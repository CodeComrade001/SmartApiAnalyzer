namespace SmartApiAnalyzer.Domain.Entities;

public class EndpointMetrics
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }

    public string Endpoint { get; set; } = default!;

    public int TotalRequests { get; set; }
    public double AverageLatency { get; set; }

    public double P95Latency { get; set; }
    public double P99Latency { get; set; }

    public double ErrorRate { get; set; }
    public double CostScore { get; set; }

    public double DegradationScore { get; set; }
}