// =============================================
// DTOs
// =============================================
namespace Application.DTOs.Logs;

public static class LogSchema
{
  public class IngestLogRequest
  {
    public string domainUrl { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public double ResponseTimeMs { get; set; }
    public DateTime Timestamp { get; set; }
  }

  public class LogResponse
  {
    public Guid Id { get; set; }
    public string domainUrl { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public double ResponseTimeMs { get; set; }
    public DateTime Timestamp { get; set; }
  }
}