using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Domain.Events;

public sealed class LogIngestedEvent
{
    public Guid EventId { get; }
    public Guid TenantId { get; }
    public string domainUrl { get; }
    public int StatusCode { get; }
    public double ResponseTimeMs { get; }
    public DateTime Timestamp { get; }

    // Set by UrlValidationAndEndpoints agent after gatekeeper pass
    public Uri? NormalizedUri { get; set; }
    public List<string> DiscoveredRoutes { get; set; } = new();
    public List<string> AllowedMethods { get; set; } = new();

    // Resume / approval flow
    public Guid SessionId { get; set; }
    public List<string> ApprovedRoutes { get; set; } = new();

    // Accumulated agent payloads — written by coordinator after each agent
    public Dictionary<string, Dictionary<string, object>> AgentPayloads { get; } = new();

    public LogIngestedEvent(
        Guid tenantId,
        string passedDomainUrl,
        int statusCode,
        double responseTimeMs,
        DateTime timestamp)
    {
        EventId = Guid.NewGuid();
        TenantId = tenantId;
        domainUrl = passedDomainUrl;
        StatusCode = statusCode;
        ResponseTimeMs = responseTimeMs;
        Timestamp = timestamp;
    }

    public List<AgentResult> AgentResults { get; init; } = new();
}