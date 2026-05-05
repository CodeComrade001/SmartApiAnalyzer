namespace Application.DTOs;

public class IngestLogRequest
{
    public string Endpoint { get; set; } = string.Empty;
    // public string Method { get; set; } = default!;
    public int StatusCode { get; set; }
    public int ResponseTimeMs { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}