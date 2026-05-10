using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class CostAnalysis_Agent : IAgent
{
  public string Name => AgentType.CostAnalysis.ToSystemName();
  public int Priority => 4;

  public Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      var latency = evt.ResponseTimeMs;
      var status = evt.StatusCode;

      double costScore =
          (latency * 0.6) +
          (status >= 400 ? 50 : 0);

      var payload = new Dictionary<string, object>
      {
        ["Latency"] = latency,
        ["StatusCode"] = status,
        ["CostScore"] = costScore,
        ["CostLevel"] =
            costScore < 200 ? "LOW" :
            costScore < 500 ? "MEDIUM" : "HIGH"
      };

      return Task.FromResult(AgentRequestFactory.Ok(
          Name,
          "Cost analysis completed.",
          sw.Elapsed,
          payload));
    }
    catch (Exception ex)
    {
      return Task.FromResult(
          AgentRequestFactory.CriticalStop(Name, ex.Message, sw.Elapsed));
    }
    finally
    {
      sw.Stop();
    }
  }
}