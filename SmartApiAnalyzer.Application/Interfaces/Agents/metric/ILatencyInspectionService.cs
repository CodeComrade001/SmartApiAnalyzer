namespace SmartApiAnalyzer.Application.Services.Interface.Agent.Metric;

// public interface ILatencyInspectionService
// {
//   Task<LatencyInspectionResult> AnalyzeAsync(
//       Uri uri,
//       CancellationToken ct);
// }

public sealed class LatencyInspectionResult
{
  public long LatencyMs { get; set; }
  public long TtfbMs { get; set; }
  public int StatusCode { get; set; }
  public string Grade { get; set; } = "Unknown";
}