using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Domain.Constants;
using Infrastructure.Common;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Entities.Payload;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

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
public sealed class GateKeeper_Agent : IGateKeeperAgent
{
  private readonly IThreatIntelService _threatIntel;
  private readonly IEndpointDiscoveryService _endpointDiscovery;

  public GateKeeper_Agent(
      IThreatIntelService threatIntel,
      IEndpointDiscoveryService endpointDiscovery)
  {
    _threatIntel = threatIntel;
    _endpointDiscovery = endpointDiscovery;
  }

  public string Name => AgentType.UrlValidationAndEndpoints.ToSystemName();

  public int Priority => (int)AgentType.UrlValidationAndEndpoints;

  public async Task<AgentResult<GateKeeperPayload>> ExecuteAsync(
      GateKeeperIngestedEvent evt,
      CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      Console.WriteLine($"GateKeeper_Agent: Validating URL and discovering endpoints for {evt.domainUrl}");

      var rawUrl = evt.domainUrl?.Trim();

      if (string.IsNullOrWhiteSpace(rawUrl))
      {
        return Stop("Input URL is required.", sw.Elapsed, AgentSeverity.Warning);
      }

      if (!Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri))
      {
        return Stop("Invalid absolute URL", sw.Elapsed, AgentSeverity.Warning);
      }

      if (!IsSupportedScheme(uri))
      {
        return Stop("Only HTTP/HTTPS URLs are supported.", sw.Elapsed, AgentSeverity.Warning);
      }

      // Threat intelligence scan
      AppLogger.Log("Threat scan starting...");
      var threatResult = await _threatIntel.EvaluateAsync(uri, ct);
      AppLogger.Log("Threat scan done.");

      if (threatResult.IsMalicious)
      {
        return Stop($"Blocked suspicious domain: {uri.Host}", sw.Elapsed, AgentSeverity.Critical);
      }

      // Discover routes
      AppLogger.Log("domainUrl discovery starting...");
      var discovered = await _endpointDiscovery.DiscoverAsync(uri, ct);
      AppLogger.Log("domainUrl discovery done.");
      var seeDiscoveredResult = discovered;
      // A failed discovery pipeline is not itself grounds to stop downstream agents —
      // security/perf agents can still run against the bare host — but it MUST be
      // visible, not silently swallowed into a false "safe: true".
      if (discovered.Status == PipelineStatus.Failed)
      {
        var failurePayload = BuildPayload(uri, threatResult, discovered, safe: false);
        return AgentResult<GateKeeperPayload>.CreateWarning(
            Name,
            $"Endpoint discovery failed for {uri.Host}: {discovered.FailureReason ?? "unknown error"}. Downstream agents will operate with no discovered routes.",
            sw.Elapsed,
            failurePayload);
      }

      var routes = discovered.Endpoints
          .Select(e => new EndpointRouteDto
          {
            route = e.Path,
            methods = e.SupportedMethods.Select(m => m.Method).ToList(),
          })
          .ToList();

      // Fallback so downstream agents always have at least the root to probe,
      // consistent with the original (commented-out) intent.
      if (routes.Count == 0)
      {
        routes.Add(new EndpointRouteDto { route = "/", methods = ["GET", "HEAD", "OPTIONS"] });
      }

      var isPartial = discovered.Status == PipelineStatus.PartiallyCompleted;

      var payload = new GateKeeperPayload
      {
        domainUrl = $"{uri.Scheme}://{uri.Host}",
        host = uri.Host,
        scheme = uri.Scheme,
        port = uri.Port,
        routesPayload = routes,
        endpointCount = routes.Count,
        threatScore = threatResult.Score,
        safe = !threatResult.IsMalicious,
      };

      var message = isPartial
          ? $"Validated domain and discovered {routes.Count} endpoint(s) (discovery partially completed — some enrichment stages failed)."
          : $"Validated domain and discovered {routes.Count} endpoint(s).";

      return isPartial
          ? AgentResult<GateKeeperPayload>.CreateWarning(Name, message, sw.Elapsed, payload)
          : AgentResult<GateKeeperPayload>.CreateOk(Name, message, sw.Elapsed, payload);
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
      throw;
    }
    catch (Exception ex)
    {
      return Stop($"Unhandled validation error: {ex.Message}", sw.Elapsed, AgentSeverity.Critical);
    }
    finally
    {
      sw.Stop();
    }
  }

  /// <summary>
  /// Constructs a pipeline-halting result. AgentRequestFactory currently has no
  /// stop-capable factory method (only CreateOk/CreateWarning, neither of which can set
  /// StopProcessing = true), so this bypasses it via direct construction. Flagging as a
  /// gap: recommend adding AgentRequestFactory.CreateStop(...) so no caller needs to do
  /// this by hand and risk forgetting the flag.
  /// </summary>
  private AgentResult<GateKeeperPayload> Stop(string message, TimeSpan elapsed, AgentSeverity severity) =>
      new()
      {
        AgentName = Name,
        Success = false,
        StopProcessing = true,
        Message = message,
        Severity = severity,
        Elapsed = elapsed,
        Payload = default,
      };

  private static GateKeeperPayload BuildPayload(
      Uri uri, ThreatIntelResult threatResult, EndpointDiscoveryResult discovered, bool safe) =>
      new()
      {
        domainUrl = $"{uri.Scheme}://{uri.Host}",
        host = uri.Host,
        scheme = uri.Scheme,
        port = uri.Port,
        routesPayload = discovered.Endpoints
              .Select(e => new EndpointRouteDto { route = e.Path, methods = e.SupportedMethods.Select(m => m.Method).ToList() })
              .ToList(),
        endpointCount = discovered.Endpoints.Count,
        threatScore = threatResult.Score,
        safe = safe,
      };

  private static bool IsSupportedScheme(Uri uri) =>
      uri.Scheme == Uri.UriSchemeHttp ||
      uri.Scheme == Uri.UriSchemeHttps;
}