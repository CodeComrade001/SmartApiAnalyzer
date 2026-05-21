using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;
using SmartApiAnalyzer.Domain.Constants;
using Infrastructure.Common;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Infrastructure.Agents;

/// <summary>
/// Priority = 1
/// Entry gatekeeper agent.
///
/// Responsibilities:
/// 1. Validate URL format
/// 2. Reject suspicious / malicious domains
/// 3. Discover reachable endpoints
/// 4. Infer supported HTTP methods per route
/// 5. Package normalized payload for downstream agents
/// </summary>
public sealed class UrlValidationAndEndpointGeneration_Agent : IAgent
{
  private readonly IThreatIntelService _threatIntel;
  private readonly IEndpointDiscoveryService _endpointDiscovery;

  public UrlValidationAndEndpointGeneration_Agent(
      IThreatIntelService threatIntel,
      IEndpointDiscoveryService endpointDiscovery)
  {
    _threatIntel = threatIntel;
    _endpointDiscovery = endpointDiscovery;
  }

  public string Name => AgentType.UrlValidationAndEndpoints.ToSystemName();

  public int Priority => 1;

  public async Task<AgentResult> ExecuteAsync(
      LogIngestedEvent evt,
      CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      var rawUrl = evt.Endpoint?.Trim();

      if (string.IsNullOrWhiteSpace(rawUrl))
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "Input URL is required.",
            sw.Elapsed);
      }

      if (!Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri))
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "Invalid absolute URL.",
            sw.Elapsed);
      }

      if (!IsSupportedScheme(uri))
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "Only HTTP/HTTPS URLs are supported.",
            sw.Elapsed);
      }

      // Threat intelligence scan
      AppLogger.Log("Threat scan starting...");
      var threatResult = await _threatIntel.EvaluateAsync(uri, ct);
      AppLogger.Log("Threat scan done.");

      if (threatResult.IsMalicious)
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            $"Blocked suspicious domain: {uri.Host}",
            sw.Elapsed);
      }

      // Discover routes
      AppLogger.Log("Endpoint discovery starting...");
      var discovered = await _endpointDiscovery.DiscoverAsync(uri, ct);
      AppLogger.Log("Endpoint discovery done.");

      var routes = discovered.DiscoveredRoutes
          .Where((string x) => !string.IsNullOrWhiteSpace(x))
          .Select(NormalizeEndpoint)
          .Distinct(StringComparer.OrdinalIgnoreCase)
          .OrderBy(x => x)
          .ToList();

      if (routes.Count == 0)
      {
        routes.Add("/");
      }

      // Build route + method payload
      var routePayload = routes
          .Select(route => new EndpointRouteDto
          {
            Route = route,
            Methods = InferMethods(route)
          })
          .ToList();

      var payload =
          new Dictionary<string, object>
          {
            ["BaseUrl"] = $"{uri.Scheme}://{uri.Host}",
            ["Host"] = uri.Host,
            ["Scheme"] = uri.Scheme,
            ["Port"] = uri.Port,
            ["Endpoints"] = routePayload,
            ["EndpointCount"] = routePayload.Count,
            ["ThreatScore"] = threatResult.Score,
            ["Safe"] = true
          };

      return AgentRequestFactory.Ok(
          Name,
          $"Validated domain and discovered {routePayload.Count} endpoint(s).",
          sw.Elapsed,
          payload);
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
      throw;
    }
    catch (Exception ex)
    {
      return AgentRequestFactory.CriticalStop(
          Name,
          $"Unhandled validation error: {ex.Message}",
          sw.Elapsed);
    }
    finally
    {
      sw.Stop();
    }
  }

  private static bool IsSupportedScheme(Uri uri) =>
      uri.Scheme == Uri.UriSchemeHttp ||
      uri.Scheme == Uri.UriSchemeHttps;

  private static string NormalizeEndpoint(string endpoint)
  {
    if (string.IsNullOrWhiteSpace(endpoint))
      return "/";

    endpoint = endpoint.Trim();

    if (!endpoint.StartsWith("/"))
      endpoint = "/" + endpoint;

    return endpoint.ToLowerInvariant();
  }

  /// <summary>
  /// Safe heuristic inference.
  /// Replace later with OPTIONS / Swagger / OpenAPI parser.
  /// </summary>
  private static List<string> InferMethods(string route)
  {
    route = route.ToLowerInvariant();

    var methods = new List<string> { "GET", "HEAD", "OPTIONS" };

    if (route.Contains("create") ||
        route.Contains("register") ||
        route.Contains("login"))
    {
      methods.Add("POST");
    }

    if (route.Contains("{id}") ||
        route.Any(char.IsDigit))
    {
      methods.Add("PUT");
      methods.Add("PATCH");
      methods.Add("DELETE");
    }

    return methods.Distinct().ToList();
  }
}

/// <summary>
/// Clean downstream transport model.
/// </summary>
public sealed class EndpointRouteDto
{
  public string Route { get; set; } = default!;

  public List<string> Methods { get; set; } = new();
}