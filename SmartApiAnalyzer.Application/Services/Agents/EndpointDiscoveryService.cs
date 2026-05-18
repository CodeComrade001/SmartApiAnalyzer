// using SmartApiAnalyzer.Application.Services.Interface.Agent.Web;
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
/// Responsibilities:
/// 1. Detect OpenAPI / Swagger specs
/// 2. Parse documented routes
/// 3. Probe common API routes
/// 4. Discover accepted HTTP methods via:
///    - Allow header
///    - OPTIONS
///    - fallback probing
/// 5. Return normalized route list
///
/// Safe for production:
/// - bounded concurrency
/// - timeouts
/// - cancellation aware
/// - no blind brute force crawling
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



  public async Task<EndpointDiscoveryResult> DiscoverAsync(
      Uri baseUri,
      CancellationToken ct)
  {
    ct.ThrowIfCancellationRequested();

    var routes = new ConcurrentDictionary<string, byte>(
        StringComparer.OrdinalIgnoreCase);

    // 1. OpenAPI first (best source of truth)
    var fromSpec = await TryDiscoverFromOpenApi(baseUri, ct);

    foreach (var route in fromSpec)
      routes.TryAdd(route, 0);

    // 2. Smart probing fallback
    var probeTargets = routes.Count > 0
        ? routes.Keys.ToArray()
        : CommonRoutes;

    await ProbeRoutes(baseUri, probeTargets, routes, ct);

    if (!routes.ContainsKey("/"))
      routes.TryAdd("/", 0);

    return new EndpointDiscoveryResult
    {
      DiscoveredRoutes = routes.Keys
         .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
         .ToList(),

      DiscoveryMethod = fromSpec.Count > 0
         ? "OpenApi"
         : "Probe",

      OpenApiAvailable = fromSpec.Count > 0
    };
  }

  // ----------------------------------------------------
  // PUBLIC helper for your pipeline to get methods also
  // ----------------------------------------------------
  public async Task<IReadOnlyDictionary<string, IReadOnlyCollection<string>>>
      DiscoverRoutesWithMethodsAsync(
          Uri baseUri,
          CancellationToken ct)
  {
    var discovery = await DiscoverAsync(baseUri, ct);

    var result =
        new ConcurrentDictionary<string, IReadOnlyCollection<string>>(
            StringComparer.OrdinalIgnoreCase);

    await Parallel.ForEachAsync(
        discovery.DiscoveredRoutes,
        new ParallelOptions
        {
          MaxDegreeOfParallelism = MaxParallelism,
          CancellationToken = ct
        },
        async (route, token) =>
        {
          var methods =
                  await DetectMethods(baseUri, route, token);

          result[route] = methods;
        });

    return result
        .OrderBy(x => x.Key)
        .ToDictionary(
            x => x.Key,
            x => x.Value,
            StringComparer.OrdinalIgnoreCase);
  }

  // ----------------------------------------------------
  // OPENAPI DISCOVERY
  // ----------------------------------------------------
  private static async Task<HashSet<string>> TryDiscoverFromOpenApi(
      Uri baseUri,
      CancellationToken ct)
  {
    var routes = new HashSet<string>(
        StringComparer.OrdinalIgnoreCase);

    foreach (var specPath in CandidateSpecs)
    {
      ct.ThrowIfCancellationRequested();

      try
      {
        var uri = new Uri(baseUri, specPath);

        using var request =
            BuildRequest(HttpMethod.Get, uri);

        using var response =
            await _http.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
          continue;

        var json =
            await response.Content.ReadAsStringAsync(ct);

        ExtractPathsFromSpec(json, routes);

        if (routes.Count > 0)
          return routes;
      }
      catch
      {
        // swallow intentionally
      }
    }

    return routes;
  }

  private static void ExtractPathsFromSpec(
      string json,
      HashSet<string> routes)
  {
    try
    {
      using var doc = JsonDocument.Parse(json);

      if (!doc.RootElement.TryGetProperty(
              "paths",
              out var paths))
        return;

      foreach (var item in paths.EnumerateObject())
      {
        var route = Normalize(item.Name);

        routes.Add(route);
      }
    }
    catch
    {
      // invalid json/spec ignored
    }
  }

  // ----------------------------------------------------
  // PROBING
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
          var uri = new Uri(baseUri, route);

          try
          {
            using var request =
                    BuildRequest(HttpMethod.Head, uri);

            using var response =
                    await _http.SendAsync(request, token);

            if (IsAcceptable(response.StatusCode))
            {
              found.TryAdd(Normalize(route), 0);
              return;
            }

            // Some APIs block HEAD
            using var get =
                    BuildRequest(HttpMethod.Get, uri);

            using var getResp =
                    await _http.SendAsync(get, token);

            if (IsAcceptable(getResp.StatusCode))
            {
              found.TryAdd(Normalize(route), 0);
            }
          }
          catch
          {
            // safe ignore
          }
        });
  }

  // ----------------------------------------------------
  // METHOD DETECTION
  // ----------------------------------------------------
  private static async Task<IReadOnlyCollection<string>>
      DetectMethods(
          Uri baseUri,
          string route,
          CancellationToken ct)
  {
    var methods =
        new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

    var uri = new Uri(baseUri, route);

    // OPTIONS = strongest runtime signal
    try
    {
      using var options =
          BuildRequest(HttpMethod.Options, uri);

      using var response =
          await _http.SendAsync(options, ct);

      if (response.Content.Headers.Allow.Any())
      {
        foreach (var m in response.Content.Headers.Allow)
        {
          methods.Add(m.Method);
        }
      }
    }
    catch
    {
    }

    // Fallback probing
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
        using var request =
            BuildRequest(method, uri);

        using var response =
            await _http.SendAsync(request, ct);

        if (response.StatusCode ==
            HttpStatusCode.MethodNotAllowed)
          continue;

        if (response.StatusCode ==
            HttpStatusCode.NotFound)
          continue;

        methods.Add(method.Method);
      }
      catch
      {
      }
    }

    if (methods.Count == 0)
      methods.Add("GET");

    return methods
        .OrderBy(x => x)
        .ToList();
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  private static HttpRequestMessage BuildRequest(
      HttpMethod method,
      Uri uri)
  {
    var req = new HttpRequestMessage(method, uri);

    req.Headers.UserAgent.Add(
        new ProductInfoHeaderValue(
            "SmartApiAnalyzer",
            "1.0"));

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

  private static string Normalize(string route)
  {
    if (string.IsNullOrWhiteSpace(route))
      return "/";

    route = route.Trim();

    if (!route.StartsWith("/"))
      route = "/" + route;

    return route.ToLowerInvariant();
  }
}