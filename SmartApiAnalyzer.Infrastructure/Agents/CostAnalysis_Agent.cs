using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class CostAnalysis_Agent : IAgent
{
  public string Name => AgentType.CostAnalysis.ToSystemName();
  public int Priority => (int)AgentType.CostAnalysis;

  public async Task<IAgentResult> ExecuteAsync(GateKeeperIngestedEvent evt, CancellationToken ct)
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

      var payload = new AllAgentsPayload.CostAnalysisPayload
      {
        Latency = latency,
        StatusCode = status,
        CostScore = costScore,
        CostLevel =
            costScore < 200 ? "LOW" :
            costScore < 500 ? "MEDIUM" : "HIGH"
      };

      return AgentRequestFactory.Ok(
          Name,
          "Cost analysis completed.",
          sw.Elapsed,
          payload);
    }
    catch (Exception ex)
    {
      return
          AgentRequestFactory.CriticalStop(Name, ex.Message, sw.Elapsed);
    }
    finally
    {
      sw.Stop();
    }
  }
}