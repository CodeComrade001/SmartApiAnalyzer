using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Application.Services.Agents;

/// <summary>
/// Structured-log sink by default.
/// Replace with PagerDuty / Slack / SendGrid later.
/// </summary>
public sealed class AlertDispatchService : IAlertDispatchService
{
    private readonly ILogger<AlertDispatchService> _logger;

    public AlertDispatchService(
        ILogger<AlertDispatchService> logger)
    {
        _logger = logger;
    }

    public Task<AlertDispatchResult> DispatchAsync(
        string tenantId,
        Guid sessionId,
        IReadOnlyList<AgentResult<AlertDispatchResult>> criticalResults,
        CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();

        var errors = new List<string>();
        var successCount = 0;
        var failedCount = 0;

        foreach (var result in criticalResults)
        {
            try
            {
                ct.ThrowIfCancellationRequested();

                _logger.LogCritical(
                    "SECURITY_ALERT | Tenant={TenantId} Session={SessionId} Agent={AgentName} Severity={Severity} Message={Message}",
                    tenantId,
                    sessionId,
                    result.AgentName,
                    result.Severity,
                    result.Message);

                successCount++;
            }
            catch (Exception ex)
            {
                failedCount++;

                errors.Add(ex.Message);

                _logger.LogError(
                    ex,
                    "Failed dispatching alert for Tenant={TenantId} Session={SessionId} Agent={AgentName}",
                    tenantId,
                    sessionId,
                    result.AgentName);
            }
        }

        sw.Stop();

        var dispatchResult = new AlertDispatchResult
        {
            Success = failedCount == 0,
            TotalAlertsProcessed = criticalResults.Count,
            SuccessfulDispatches = successCount,
            FailedDispatches = failedCount,
            RequiresRetry = failedCount > 0,
            Errors = errors,
            Elapsed = sw.Elapsed,
            CompletedAtUtc = DateTime.UtcNow
        };

        return Task.FromResult(dispatchResult);
    }
}