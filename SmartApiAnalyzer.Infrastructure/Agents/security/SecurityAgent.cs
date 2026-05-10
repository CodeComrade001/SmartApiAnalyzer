using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class Security_Agent : IAgent
{
  public string Name => AgentType.SecurityAgentEvaluation.ToSystemName();
  public int Priority => 8;

  public Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      var issues = new List<string>();

      if (evt.Endpoint?.StartsWith("http://") == true)
        issues.Add("Unencrypted HTTP usage");

      if (string.IsNullOrWhiteSpace(evt.Endpoint))
        issues.Add("Missing endpoint");

      var riskScore = issues.Count * 25;

      var payload = new Dictionary<string, object>
      {
        ["Issues"] = issues,
        ["RiskScore"] = riskScore,
        ["RiskLevel"] =
            riskScore < 25 ? "LOW" :
            riskScore < 75 ? "MEDIUM" : "HIGH"
      };

      return Task.FromResult(AgentRequestFactory.Ok(
          Name,
          "Security analysis completed.",
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