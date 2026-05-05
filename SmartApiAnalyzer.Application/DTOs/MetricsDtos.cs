// =============================================
// DTOs
// File: Application/DTOs/Metrics/MetricsDtos.cs
// =============================================
namespace Application.DTOs.Metrics;

public static class MetricsSchema
{
  public class SummaryResponse
  {
    public int TotalRequests { get; set; }
    public double AverageLatency { get; set; }
    public double ErrorRate { get; set; }
    public int ActiveEndpoints { get; set; }
  }

  public class EndpointMetricResponse
  {
    public string Endpoint { get; set; } = string.Empty;
    public int TotalRequests { get; set; }
    public double AverageLatency { get; set; }
    public double P95Latency { get; set; }
    public double ErrorRate { get; set; }
  }

  public class TopCostResponse
  {
    public string Endpoint { get; set; } = string.Empty;
    public double CostScore { get; set; }
  }

  public class DegradationResponse
  {
    public string Endpoint { get; set; } = string.Empty;
    public double PreviousLatency { get; set; }
    public double CurrentLatency { get; set; }
    public double DegradationPercent { get; set; }
  }
}