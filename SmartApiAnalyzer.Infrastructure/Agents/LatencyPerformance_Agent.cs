using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

// namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class LatencyPerformance_Agent : IAgent
{
    private readonly ILatencyInspectionService _service;
    private readonly ILogger<LatencyPerformance_Agent> _logger;

    public string Name => AgentType.LatencyPerformance.ToSystemName();
    public int Priority => (int)AgentType.LatencyPerformance;

    public LatencyPerformance_Agent(
        ILatencyInspectionService service,
        ILogger<LatencyPerformance_Agent> logger)
    {
        _service = service;
        _logger = logger;
    }

    public async Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
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
                ["LatencyMs"] = result.LatencyMs,
                ["TtfbMs"] = result.TtfbMs,
                ["StatusCode"] = result.StatusCode,
                ["PerformanceGrade"] = result.Grade,
                ["TimedOut"] = result.TimedOut,
            };

            if (result.TimedOut)
            {
                _logger.LogWarning("Latency probe timed out for {Host}", uri.Host);
                return AgentRequestFactory.Warning(
                    Name, "Latency probe timed out — endpoint may be unreachable or severely degraded.",
                    sw.Elapsed, payload);
            }

            var message = $"Latency: {result.LatencyMs:F0}ms | TTFB: {result.TtfbMs:F0}ms | Grade: {result.Grade}";

            return result.Grade is "D"
                ? AgentRequestFactory.Warning(Name, $"Poor latency performance. {message}", sw.Elapsed, payload)
                : AgentRequestFactory.Ok(Name, message, sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LatencyPerformance agent fault");
            return AgentRequestFactory.Warning(
                Name, $"Latency check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
