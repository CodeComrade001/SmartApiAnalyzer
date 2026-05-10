using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;

namespace SmartApiAnalyzer.Application.UseCases.Metrics;

public class GenerateMetricsUseCase
{
  private readonly ILogRepository _repo;

  // public GenerateMetricsUseCase(ILogRepository repo)
  // {
  //   _repo = repo;
  // }

  public async Task<EndpointMetrics> ExecuteAsync(string tenantId, string endpoint)
  {
    var logs = await _repo.GetByTenantAsync(tenantId);

    var filtered = logs.Where(x => x.Endpoint == endpoint).ToList();

    var total = filtered.Count;
    var avgLatency = filtered.Average(x => x.ResponseTimeMs);
    var errorRate = filtered.Count(x => x.StatusCode >= 400) / (double)total;

    return new EndpointMetrics
    {
      // TenantId = tenantId,
      Endpoint = endpoint,
      TotalRequests = total,
      AverageLatency = avgLatency,
      ErrorRate = errorRate
    };
  }
}