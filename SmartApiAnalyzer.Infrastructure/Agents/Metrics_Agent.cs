using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

/// <summary>
/// Priority 8 — Computes response metrics from the ingested event payload.
/// Pure computation agent — no external I/O. Uses event-provided ResponseTimeMs
/// and StatusCode values as the source of truth.
/// </summary>
public sealed class Metrics_Agent : IAgent
{
    public string Name => AgentType.Metrics.ToSystemName();
    public int Priority => (int)AgentType.Metrics;

    public async Task<IAgentResult> ExecuteAsync(GateKeeperIngestedEvent evt, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();

        try
        {
            ct.ThrowIfCancellationRequested();

            var responseTime = evt.ResponseTimeMs;
            var statusCode = evt.StatusCode;
            var isError = statusCode >= 400;
            var isClientError = statusCode is >= 400 and < 500;
            var isServerError = statusCode >= 500;

            var grade = responseTime switch
            {
                < 200 => "A",
                < 500 => "B",
                < 1000 => "C",
                < 3000 => "D",
                _ => "F"
            };

            var healthStatus = (isServerError, isClientError, responseTime) switch
            {
                (true, _, _) => "Unhealthy",
                (_, true, _) => "Degraded",
                (_, _, > 1000) => "Slow",
                _ => "Healthy"
            };

            var payload = new Dictionary<string, object>
            {
                ["ResponseTimeMs"] = responseTime,
                ["StatusCode"] = statusCode,
                ["IsError"] = isError,
                ["IsClientError"] = isClientError,
                ["IsServerError"] = isServerError,
                ["PerformanceGrade"] = grade,
                ["HealthStatus"] = healthStatus
            };

            return AgentRequestFactory.Ok(
                Name,
                $"Metrics computed. Status={statusCode}, Latency={responseTime}ms, Grade={grade}, Health={healthStatus}",
                sw.Elapsed,
                payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            return
                AgentRequestFactory.CriticalStop(Name, $"Metrics computation failed: {ex.Message}", sw.Elapsed);
        }
        finally
        {
            sw.Stop();
        }
    }
}
