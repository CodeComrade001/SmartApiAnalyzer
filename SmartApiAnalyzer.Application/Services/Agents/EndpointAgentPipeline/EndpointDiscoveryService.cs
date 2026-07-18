using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace SmartApiAnalyzer.Infrastructure.Services;

/// <summary>
/// Production-grade endpoint discovery service.
///
/// Pipeline:
/// 1. Look for OpenAPI/Swagger
/// 2. Parse every path
/// 3. Normalize paths (preserve base path, keep {param} templates intact)
/// 4. Detect supported HTTP methods (from spec when available, else probed)
/// 5. Build endpoint hierarchy
/// 6. Mark parents that contain children
///
/// Safe for production:
/// - bounded concurrency
/// - timeouts
/// - cancellation aware
/// - no blind brute force crawling
/// - single-pass pipeline (no recursive re-discovery)
/// </summary>
public sealed class EndpointDiscoveryService : IEndpointDiscoveryService
{
  private static readonly HttpClient _http =
      new HttpClient(new SocketsHttpHandler
      {
        PooledConnectionLifetime = TimeSpan.FromMinutes(5),
        MaxConnectionsPerServer = 20,
        AutomaticDecompression =
              DecompressionMethods.GZip |
              DecompressionMethods.Deflate
      })
      {
        Timeout = TimeSpan.FromSeconds(5)
      };

  private const int MaxParallelism = 6;

  private static readonly string[] CandidateSpecs =
  [
      "/swagger/v1/swagger.json",
        "/swagger.json",
        "/openapi.json",
        "/openapi/v1.json",
        "/api-docs",
        "/v3/api-docs"
  ];

  private static readonly string[] CommonRoutes =
  [
      "/",
        "/health",
        "/status",
        "/ready",
        "/metrics",

        "/api",
        "/api/v1",
        "/api/v2",

        "/users",
        "/auth",
        "/login",
        "/register",
        "/profile",

        "/products",
        "/orders",
        "/payments",

        "/docs",
        "/swagger"
  ];

  // Infra/meta routes that are useful to probe for existence but should not
  // be reported as API data endpoints or mixed into the hierarchy.
  private static readonly HashSet<string> InfraRoutes =
      new(StringComparer.OrdinalIgnoreCase)
      {
            "/health", "/status", "/ready", "/metrics", "/docs", "/swagger"
      };

  // ----------------------------------------------------
  // PUBLIC ENTRY POINT (single pipeline, no recursion)
  // ----------------------------------------------------
  public async Task<EndpointDiscoveryResult> DiscoverAsync(
      Uri baseUri,
      CancellationToken ct)
  {
    ct.ThrowIfCancellationRequested();

    // 1 + 2. OpenAPI first (best source of truth) — gives us paths AND methods.
    var (specRoutes, matchedSpecUrl) = await TryDiscoverFromOpenApi(baseUri, ct);

    // 3. Normalize + collect route -> methods map.
    var routeMethods =
        new ConcurrentDictionary<string, IReadOnlyCollection<string>>(
            StringComparer.OrdinalIgnoreCase);

    foreach (var (path, methods) in specRoutes)
      routeMethods[path] = methods;

    if (specRoutes.Count == 0)
    {
      // No spec available — fall back to smart probing of known concrete route
      var found = new ConcurrentDictionary<string, byte>(
          StringComparer.OrdinalIgnoreCase);

      // await ProbeRoutes(baseUri, CommonRoutes, found, ct);

      if (found.IsEmpty)
        found.TryAdd("/", 0);

      // 4. Detect methods only for concrete (non-templated) routes we confirmed exist.
      await Parallel.ForEachAsync(
          found.Keys,
          new ParallelOptions
          {
            MaxDegreeOfParallelism = MaxParallelism,
            CancellationToken = ct
          },
          async (route, token) =>
          {
            var methods = await DetectMethods(baseUri, route, token);
            routeMethods[route] = methods;
          });
    }

    // 5 + 6. Build hierarchy and mark parents with children.
    var hierarchy = BuildHierarchy(routeMethods.Keys);

    return new EndpointDiscoveryResult
    {
      DiscoveredRoutes = routeMethods.Keys
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList(),

      RouteMethods = routeMethods.ToDictionary(
            x => x.Key,
            x => x.Value.ToList(),
            StringComparer.OrdinalIgnoreCase),

      Hierarchy = hierarchy,

      DiscoveryMethod = specRoutes.Count > 0 ? "OpenApi" : "Probe",
      OpenApiAvailable = specRoutes.Count > 0,
      OpenApiUrl = matchedSpecUrl?.ToString()
    };
  }

  /// <summary>
  /// Route -> methods map, without re-running discovery (fixes the old
  /// infinite recursion between this method and DiscoverAsync).
  /// </summary>
  public async Task<IReadOnlyDictionary<string, IReadOnlyCollection<string>>>
      DiscoverRoutesWithMethodsAsync(Uri baseUri, CancellationToken ct)
  {
    var (specRoutes, _) = await TryDiscoverFromOpenApi(baseUri, ct);

    if (specRoutes.Count > 0)
      return specRoutes;

    var found = new ConcurrentDictionary<string, byte>(
        StringComparer.OrdinalIgnoreCase);

    await ProbeRoutes(baseUri, CommonRoutes, found, ct);

    var result = new ConcurrentDictionary<string, IReadOnlyCollection<string>>(
        StringComparer.OrdinalIgnoreCase);

    await Parallel.ForEachAsync(
        found.Keys,
        new ParallelOptions
        {
          MaxDegreeOfParallelism = MaxParallelism,
          CancellationToken = ct
        },
        async (route, token) =>
        {
          result[route] = await DetectMethods(baseUri, route, token);
        });

    return result
        .OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(x => x.Key, x => x.Value, StringComparer.OrdinalIgnoreCase);
  }

  // ----------------------------------------------------
  // OPENAPI DISCOVERY (paths + methods, straight from spec)
  // ----------------------------------------------------
  private static async Task<(Dictionary<string, IReadOnlyCollection<string>> Routes, Uri? SpecUrl)>
      TryDiscoverFromOpenApi(Uri baseUri, CancellationToken ct)
  {
    var routes = new Dictionary<string, IReadOnlyCollection<string>>(
        StringComparer.OrdinalIgnoreCase);

    foreach (var specPath in CandidateSpecs)
    {
      ct.ThrowIfCancellationRequested();

      try
      {
        var uri = CombineUri(baseUri, specPath);

        using var request = BuildRequest(HttpMethod.Get, uri);
        using var response = await _http.SendAsync(request, ct);

        if (response == null || !response.IsSuccessStatusCode)
          continue;

        var json = await response.Content.ReadAsStringAsync(ct);

        ExtractPathsAndMethodsFromSpec(json, routes);

        if (routes.Count > 0)
          return (routes, uri);
      }
      catch
      {
        // swallow intentionally — try next candidate spec location
      }
    }

    return (routes, null);
  }

  private static readonly string[] HttpVerbs =
      ["get", "post", "put", "patch", "delete", "head", "options"];

  private static void ExtractPathsAndMethodsFromSpec(
      string json,
      Dictionary<string, IReadOnlyCollection<string>> routes)
  {
    try
    {
      using var doc = JsonDocument.Parse(json);

      if (!doc.RootElement.TryGetProperty("paths", out var paths))
        return;

      foreach (var item in paths.EnumerateObject())
      {
        var route = Normalize(item.Name);

        var methods = new List<string>();

        if (item.Value.ValueKind == JsonValueKind.Object)
        {
          foreach (var verb in HttpVerbs)
          {
            if (item.Value.TryGetProperty(verb, out _))
              methods.Add(verb.ToUpperInvariant());
          }
        }

        if (methods.Count == 0)
          methods.Add("GET");

        routes[route] = methods;
      }
    }
    catch
    {
      // invalid json/spec ignored
    }
  }

  // ----------------------------------------------------
  // PROBING (only for concrete routes, never templated ones)
  // ----------------------------------------------------
  private static async Task ProbeRoutes(
      Uri baseUri,
      IEnumerable<string> candidates,
      ConcurrentDictionary<string, byte> found,
      CancellationToken ct)
  {
    await Parallel.ForEachAsync(
        candidates,
        new ParallelOptions
        {
          MaxDegreeOfParallelism = MaxParallelism,
          CancellationToken = ct
        },
        async (route, token) =>
        {
          var uri = CombineUri(baseUri, route);

          try
          {
            using var request = BuildRequest(HttpMethod.Head, uri);
            using var response = await _http.SendAsync(request, token);

            if (IsAcceptable(response.StatusCode))
            {
              found.TryAdd(Normalize(route), 0);
              return;
            }

            // Some APIs block HEAD
            using var get = BuildRequest(HttpMethod.Get, uri);
            using var getResp = await _http.SendAsync(get, token);

            if (IsAcceptable(getResp.StatusCode))
              found.TryAdd(Normalize(route), 0);
          }
          catch
          {
            // safe ignore
          }
        });
  }

  // ----------------------------------------------------
  // METHOD DETECTION (only ever called on concrete, existing routes)
  // ----------------------------------------------------
  private static async Task<IReadOnlyCollection<string>> DetectMethods(
      Uri baseUri,
      string route,
      CancellationToken ct)
  {
    var methods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    var uri = CombineUri(baseUri, route);

    // OPTIONS = strongest runtime signal
    try
    {
      using var options = BuildRequest(HttpMethod.Options, uri);
      using var response = await _http.SendAsync(options, ct);

      if (response.Content.Headers.Allow.Any())
      {
        foreach (var m in response.Content.Headers.Allow)
          methods.Add(m);
      }
    }
    catch
    {
    }

    if (methods.Count > 0)
      return methods.OrderBy(x => x).ToList();

    // Fallback probing only if OPTIONS gave nothing
    var candidates = new[]
    {
            HttpMethod.Get,
            HttpMethod.Post,
            HttpMethod.Put,
            HttpMethod.Patch,
            HttpMethod.Delete,
            HttpMethod.Head
        };

    foreach (var method in candidates)
    {
      ct.ThrowIfCancellationRequested();

      try
      {
        using var request = BuildRequest(method, uri);
        using var response = await _http.SendAsync(request, ct);

        if (response == null || response.StatusCode is HttpStatusCode.MethodNotAllowed
            or HttpStatusCode.NotFound)
          continue;

        methods.Add(method.Method);
      }
      catch
      {
      }
    }

    if (methods.Count == 0)
      methods.Add("GET");

    return methods.OrderBy(x => x).ToList();
  }

  /// <summary>
  /// Builds a tree from flat route paths, e.g. "/products" and
  /// "/products/{id}" become a parent node ("/products", HasChildren = true)
  /// with one child node ("/products/{id}").
  /// </summary>
  public static List<EndpointNode> BuildHierarchy(IEnumerable<string> routes)
  {
    var root = new EndpointNode { Segment = "", FullPath = "" };

    foreach (var route in routes)
    {
      var segments = route
          .Split('/', StringSplitOptions.RemoveEmptyEntries);

      var current = root;
      var pathSoFar = "";

      foreach (var segment in segments)
      {
        pathSoFar += "/" + segment;

        var existing = current.Children
            .FirstOrDefault(c => c.Segment.Equals(segment, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
          existing = new EndpointNode
          {
            Segment = segment,
            FullPath = pathSoFar,
            IsParameter = segment.StartsWith('{') && segment.EndsWith('}')
          };
          current.Children.Add(existing);
        }

        current = existing;
      }
    }

    return root.Children;
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  /// <summary>
  /// Combines a base URI with a relative route WITHOUT discarding any
  /// existing path on the base URI (unlike `new Uri(baseUri, route)`,
  /// which treats a leading "/" as absolute and resets to host root).
  /// </summary>
  private static Uri CombineUri(Uri baseUri, string route)
  {
    var basePath = baseUri.AbsolutePath.TrimEnd('/');
    var relative = route.TrimStart('/');

    var builder = new UriBuilder(baseUri)
    {
      Path = string.IsNullOrEmpty(relative)
            ? (string.IsNullOrEmpty(basePath) ? "/" : basePath)
            : $"{basePath}/{relative}"
    };

    return builder.Uri;
  }

  private static HttpRequestMessage BuildRequest(HttpMethod method, Uri uri)
  {
    var req = new HttpRequestMessage(method, uri);

    req.Headers.UserAgent.Add(
        new ProductInfoHeaderValue("SmartApiAnalyzer", "1.0"));

    req.Headers.Accept.Add(
        new MediaTypeWithQualityHeaderValue("*/*"));

    return req;
  }

  private static bool IsAcceptable(HttpStatusCode code)
  {
    return code switch
    {
      HttpStatusCode.OK => true,
      HttpStatusCode.Created => true,
      HttpStatusCode.Accepted => true,
      HttpStatusCode.NoContent => true,
      HttpStatusCode.Unauthorized => true,
      HttpStatusCode.Forbidden => true,
      HttpStatusCode.MethodNotAllowed => true,
      HttpStatusCode.Redirect => true,
      HttpStatusCode.Moved => true,
      _ => false
    };
  }

  /// <summary>
  /// Normalizes a path WITHOUT mangling {param} templates and without
  /// forcing case changes that would break case-sensitive template
  /// segments (kept lowercase here only for literal segments would need
  /// spec-aware handling if your API is case-sensitive; adjust if needed).
  /// </summary>
  private static string Normalize(string route)
  {
    if (string.IsNullOrWhiteSpace(route))
      return "/";

    route = route.Trim();

    if (!route.StartsWith('/'))
      route = "/" + route;

    // Collapse duplicate slashes, keep template braces intact.
    while (route.Contains("//"))
      route = route.Replace("//", "/");

    return route.Length > 1 ? route.TrimEnd('/') : route;
  }
}