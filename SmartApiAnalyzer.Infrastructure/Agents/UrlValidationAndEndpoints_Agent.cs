using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class UrlValidationAndEndpoints_Agent : IAgent
{
    private readonly IUrlValidationService _urlValidator;
    private readonly IThreatIntelService _threatIntel;
    private readonly IEndpointDiscoveryService _discovery;
    private readonly ILogger<UrlValidationAndEndpoints_Agent> _logger;

    public string Name => AgentType.UrlValidationAndEndpoints.ToSystemName();
    public int Priority => (int)AgentType.UrlValidationAndEndpoints;

    public UrlValidationAndEndpoints_Agent(
        IUrlValidationService urlValidator,
        IThreatIntelService threatIntel,
        IEndpointDiscoveryService discovery,
        ILogger<UrlValidationAndEndpoints_Agent> logger)
    {
        _urlValidator = urlValidator;
        _threatIntel = threatIntel;
        _discovery = discovery;
        _logger = logger;
    }

    public async Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            ct.ThrowIfCancellationRequested();

            var raw = evt.Endpoint?.Trim();
            if (string.IsNullOrWhiteSpace(raw))
                return AgentRequestFactory.CriticalStop(Name, "Endpoint URL is required.", sw.Elapsed);

            if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri))
                return AgentRequestFactory.CriticalStop(Name, $"Malformed URL: '{raw}'.", sw.Elapsed);

            if (uri.Scheme is not ("http" or "https"))
                return AgentRequestFactory.CriticalStop(
                    Name, $"Unsupported scheme '{uri.Scheme}'. Only HTTP/HTTPS accepted.", sw.Elapsed);

            // ── Phase 1: URL Validation ─────────────────────────────────────
            var validation = await _urlValidator.ValidateAsync(uri, ct);
            if (!validation.IsValid)
                return AgentRequestFactory.CriticalStop(
                    Name, validation.FailureReason ?? "URL failed validation.", sw.Elapsed,
                    BuildValidationPayload(validation));

            // ── Phase 2: Threat Intelligence ────────────────────────────────
            var threat = await _threatIntel.EvaluateAsync(uri, ct);
            if (threat.IsMalicious)
            {
                _logger.LogWarning(
                    "Threat detected for {Host} — Score: {Score}, Reason: {Summary}",
                    uri.Host, threat.ThreatScore, threat.Summary);

                return AgentRequestFactory.CriticalStop(
                    Name,
                    $"Threat intelligence block: {threat.Summary} (score={threat.ThreatScore:F1})",
                    sw.Elapsed,
                    BuildThreatPayload(validation, threat));
            }

            // ── Phase 3: Endpoint Discovery ─────────────────────────────────
            var discovery = await _discovery.DiscoverAsync(uri, ct);

            // Hydrate event so downstream agents can read discovered routes
            evt.NormalizedUri = uri;
            evt.DiscoveredRoutes = discovery.DiscoveredRoutes;
            evt.AllowedMethods = discovery.AllowedMethods;

            var payload = new Dictionary<string, object>
            {
                ["Scheme"] = uri.Scheme,
                ["Host"] = uri.Host,
                ["IsHttps"] = validation.IsHttps,
                ["DnsResolvable"] = validation.DnsResolvable,
                ["ResolvedIp"] = validation.ResolvedIp ?? "n/a",
                ["IsPrivateIp"] = validation.IsPrivateIp,
                ["ThreatScore"] = threat.ThreatScore,
                ["DiscoveredRoutes"] = discovery.DiscoveredRoutes,
                ["AllowedMethods"] = discovery.AllowedMethods,
                ["DiscoveryMethod"] = discovery.DiscoveryMethod,
                ["OpenApiAvailable"] = discovery.OpenApiAvailable,
            };

            _logger.LogInformation(
                "Gatekeeper passed for {Host}. Routes discovered: {Count}",
                uri.Host, discovery.DiscoveredRoutes.Count);

            return AgentRequestFactory.Ok(
                Name, "URL validated, threat check passed, endpoints discovered.", sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gatekeeper agent fault for endpoint '{Endpoint}'", evt.Endpoint);
            return AgentRequestFactory.CriticalStop(
                Name, $"Gatekeeper fault: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }

    private static Dictionary<string, object> BuildValidationPayload(UrlValidationResult v) => new()
    {
        ["Host"] = v.Host,
        ["Scheme"] = v.Scheme,
        ["DnsResolvable"] = v.DnsResolvable,
        ["IsPrivateIp"] = v.IsPrivateIp,
        ["IsLoopback"] = v.IsLoopback,
    };

    private static Dictionary<string, object> BuildThreatPayload(
        UrlValidationResult v, ThreatIntelResult t) => new()
        {
            ["Host"] = v.Host,
            ["ThreatScore"] = t.ThreatScore,
            ["SuspiciousHost"] = t.SuspiciousHost,
            ["DnsFailure"] = t.DnsFailure,
            ["IsUnencrypted"] = t.IsUnencrypted,
            ["ThreatSummary"] = t.Summary,
        };
}
