using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class CorsPolicy_Agent : IAgent
{
    private readonly ICorsPolicyService _service;
    private readonly ILogger<CorsPolicy_Agent> _logger;

    public string Name => AgentType.CorsPolicy.ToSystemName();
    public int Priority => (int)AgentType.CorsPolicy;

    public CorsPolicy_Agent(ICorsPolicyService service, ILogger<CorsPolicy_Agent> logger)
    {
        _service = service;
        _logger = logger;
    }

    public async Task<IAgentResult> ExecuteAsync(
      GateKeeperIngestedEvent evt,
      CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            ct.ThrowIfCancellationRequested();

            if (!Uri.TryCreate(evt.domainUrl?.Trim(), UriKind.Absolute, out var uri))
                return AgentRequestFactory.CriticalStop(Name, "Invalid URI.", sw.Elapsed);

            var result = await _service.AnalyzeAsync(uri, ct);

            var payload = new Dictionary<string, object>
            {
                ["AllowsWildcard"] = result.AllowsWildcardOrigin,
                ["AllowsCredentials"] = result.AllowsCredentials,
                ["WildcardWithCredentials"] = result.WildcardWithCredentials,
                ["ReflectsArbitraryOrigin"] = result.ReflectsArbitraryOrigin,
                ["AllowOriginHeader"] = result.AllowOriginHeader,
                ["AllowMethodsHeader"] = result.AllowMethodsHeader,
                ["AllowHeadersHeader"] = result.AllowHeadersHeader,
                ["IsMisconfigured"] = result.IsMisconfigured,
                ["Summary"] = result.Summary,
            };

            // Wildcard + credentials is a P0 vulnerability — stop processing
            if (result.WildcardWithCredentials)
            {
                _logger.LogCritical(
                    "CORS critical misconfiguration on {Host}: wildcard origin + credentials allowed",
                    uri.Host);

                return AgentRequestFactory.CriticalStop(
                    Name,
                    "Critical CORS misconfiguration: Access-Control-Allow-Origin: * combined with " +
                    "Access-Control-Allow-Credentials: true. Any origin can make credentialed requests.",
                    sw.Elapsed);
            }

            if (result.IsMisconfigured)
            {
                _logger.LogWarning("CORS misconfiguration on {Host}: {Summary}", uri.Host, result.Summary);
                return AgentRequestFactory.Warning(Name, $"CORS misconfiguration: {result.Summary}",
                    sw.Elapsed, payload);
            }

            return AgentRequestFactory.Ok(Name, "CORS policy is acceptable.", sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CorsPolicy agent fault");
            return AgentRequestFactory.CriticalStop(
                Name, $"CORS check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
