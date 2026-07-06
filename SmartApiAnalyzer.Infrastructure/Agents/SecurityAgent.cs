using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Enums.Agents;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class Security_Agent : IAgent
{
  public string Name => AgentType.SecurityAgentEvaluation.ToSystemName();
  public int Priority => (int)AgentType.SecurityAgentEvaluation;

  public async Task<IAgentResult> ExecuteAsync(GateKeeperIngestedEvent evt, CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      var issues = new List<string>();

      if (evt.domainUrl?.StartsWith("http://") == true)
        issues.Add("Unencrypted HTTP usage");

      if (string.IsNullOrWhiteSpace(evt.domainUrl))
        issues.Add("Missing endpoint");

      var riskScore = issues.Count * 25;

      var payload = new AllAgentsPayload.SecurityAgentPayload
      {
        Issues = issues,
        RiskScore = riskScore,
        RiskLevel =
            riskScore < 25 ? SeverityStatus.Low :
            riskScore < 75 ? SeverityStatus.Medium : SeverityStatus.High
      };

      return AgentRequestFactory.Ok(
          Name,
          "Security analysis completed.",
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