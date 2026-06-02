using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class DomainHijack_Agent : IAgent
{
    private readonly IDomainHijackService _service;
    private readonly ILogger<DomainHijack_Agent> _logger;

    public string Name => AgentType.DomainHijack.ToSystemName();
    public int Priority => (int)AgentType.DomainHijack;

    public DomainHijack_Agent(IDomainHijackService service, ILogger<DomainHijack_Agent> logger)
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

            var uri = evt.NormalizedUri;
            if (uri is null || !Uri.TryCreate(evt.domainUrl?.Trim(), UriKind.Absolute, out uri))
                return AgentRequestFactory.CriticalStop(Name, "No valid URI available.", sw.Elapsed);

            var result = await _service.AnalyzeAsync(uri, ct);

            var payload = new Dictionary<string, object>
            {
                ["IsVulnerable"] = result.IsVulnerable,
                ["HasDanglingCname"] = result.HasDanglingCname,
                ["HasSubdomainTakeover"] = result.HasSubdomainTakeover,
                ["NsLookupFailed"] = result.NsLookupFailed,
                ["CnameTarget"] = result.CnameTarget ?? "none",
                ["VulnerableProvider"] = result.VulnerableProvider ?? "none",
                ["DetectedSignals"] = result.DetectedSignals,
                ["Summary"] = result.Summary,
            };

            if (result.IsVulnerable)
            {
                _logger.LogWarning(
                    "Domain hijack vulnerability detected on {Host}: {Summary}",
                    uri.Host, result.Summary);

                return AgentRequestFactory.Warning(
                    Name, $"Domain hijack risk: {result.Summary}", sw.Elapsed, payload);
            }

            return AgentRequestFactory.Ok(Name, "No domain hijack signals detected.", sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DomainHijack agent fault");
            return AgentRequestFactory.CriticalStop(
                Name, $"Domain hijack check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
