using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.UseCases.Engine;
using SmartApiAnalyzer.Domain.Events;

public class MetricProcessor : IMetricProcessor
{
  private readonly ICostScoringEngine _costEngine;

  // in-memory store (replace later with DB)
  private readonly Dictionary<string, List<LogIngestedEvent>> _store = new();

  public MetricProcessor(ICostScoringEngine costEngine)
  {
    _costEngine = costEngine;
  }

  public void Process(LogIngestedEvent logEvent)
  {
    var key = $"{logEvent.TenantId}:{logEvent.Endpoint}";

    if (!_store.ContainsKey(key))
      _store[key] = new List<LogIngestedEvent>();

    _store[key].Add(logEvent);

    var logs = _store[key];

    var avgLatency = (int)logs.Average(x => x.ResponseTimeMs);
    var errorRate = logs.Count(x => x.StatusCode >= 500) / (double)logs.Count;
    var requestCount = logs.Count;

    // var costScore = _costEngine.CalculateCostScore(avgLatency, errorRate, requestCount);
    var costScore = 20; // placeholder

    Console.WriteLine($"[METRICS] {key}");
    Console.WriteLine($"Latency: {avgLatency}ms | ErrorRate: {errorRate:P2} | CostScore: {costScore}");
  }
}