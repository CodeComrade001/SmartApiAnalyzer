using SmartApiAnalyzer.Application.Services.Interface.Agent.Metric;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class LatencyInspectionService : ILatencyInspectionService
{
  public Task<LatencyInspectionResult> AnalyzeAsync(Uri uri, CancellationToken ct)
  {
    throw new NotImplementedException();
  }
}