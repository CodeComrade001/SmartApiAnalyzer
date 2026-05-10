// using SmartApiAnalyzer.Domain.Models;

// namespace SmartApiAnalyzer.Domain.Events;


using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Domain.Events;

public record LogIngestedEvent(
    Guid TenantId,
    string Endpoint,
    int StatusCode,
    double ResponseTimeMs,
    DateTime Timestamp)
{
    public Guid? SessionId { get; init; }

    public List<RouteInputDto>? ApprovedRoutes { get; init; }
}