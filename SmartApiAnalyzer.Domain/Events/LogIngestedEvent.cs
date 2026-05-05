namespace SmartApiAnalyzer.Domain.Events;

public record LogIngestedEvent(
    Guid TenantId,
    string Endpoint,
    int StatusCode,
    double ResponseTimeMs,
    DateTime Timestamp
);