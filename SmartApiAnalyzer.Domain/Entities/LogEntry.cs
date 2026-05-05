namespace Domain.Entities;

public class LogEntry
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public string Endpoint { get; set; } = default!;
    public string Method { get; set; } = default!;
    public int StatusCode { get; set; }

    public DateTime Timestamp { get; set; }
    public int ResponseTimeMs { get; set; }
    public DateTime TimestampUtc { get; set; }
}