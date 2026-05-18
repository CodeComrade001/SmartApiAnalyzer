using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models;

namespace SmartApiAnalyzer.Infrastructure.Services;

/// <summary>
/// Structured-log sink by default. Replace with PagerDuty / Slack / SendGrid
/// integration by implementing IAlertDispatchService and swapping DI registration.
/// </summary>
public sealed class AlertDispatchService : IAlertDispatchService
{
    private readonly ILogger<AlertDispatchService> _logger;

    public AlertDispatchService(ILogger<AlertDispatchService> logger)
        => _logger = logger;

    public Task DispatchAsync(
        string tenantId,
        Guid sessionId,
        IReadOnlyList<AgentResult> criticalResults,
        CancellationToken ct)
    {
        foreach (var r in criticalResults)
        {
            _logger.LogCritical(
                "SECURITY_ALERT | Tenant={TenantId} Session={SessionId} Agent={Agent} | {Message}",
                tenantId, sessionId, r.AgentName, r.Message);
        }
        return Task.CompletedTask;
    }
}
