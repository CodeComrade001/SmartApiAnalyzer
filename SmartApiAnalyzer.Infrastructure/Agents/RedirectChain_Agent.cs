using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class RedirectChain_Agent : IAgent
{
    private readonly IRedirectChainService _service;
    private readonly ILogger<RedirectChain_Agent> _logger;

    public string Name => AgentType.RedirectChain.ToSystemName();
    public int Priority => (int)AgentType.RedirectChain;

    public RedirectChain_Agent(IRedirectChainService service, ILogger<RedirectChain_Agent> logger)
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
                ["EnforcesHttps"] = result.EnforcesHttps,
                ["HasLoop"] = result.HasRedirectLoop,
                ["LandsOnHttp"] = result.LandsOnHttp,
                ["HopCount"] = result.HopCount,
                ["FinalUrl"] = result.FinalUrl,
                ["Hops"] = result.Hops.Select(h => new
                {
                    h.Step,
                    h.FromUrl,
                    h.ToUrl,
                    h.StatusCode
                }).ToList<object>(),
            };

            if (result.HasRedirectLoop)
            {
                _logger.LogWarning("Redirect loop detected on {Host}", uri.Host);
                return AgentRequestFactory.CriticalStop(
                    Name, "Redirect loop detected — request will never resolve.", sw.Elapsed);
            }

            if (result.LandsOnHttp)
            {
                _logger.LogWarning("Redirect lands on plain HTTP for {Host}", uri.Host);
                return AgentRequestFactory.Warning(
                    Name, "Redirect chain terminates on an insecure HTTP endpoint.", sw.Elapsed, payload);
            }

            if (!result.EnforcesHttps)
            {
                return AgentRequestFactory.Warning(
                    Name, "HTTP to HTTPS upgrade is not enforced.", sw.Elapsed, payload);
            }

            return AgentRequestFactory.Ok(
                Name, $"Redirect chain clean. {result.HopCount} hop(s). HTTPS enforced.",
                sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "RedirectChain agent fault");
            return AgentRequestFactory.CriticalStop(
                Name, $"Redirect check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
