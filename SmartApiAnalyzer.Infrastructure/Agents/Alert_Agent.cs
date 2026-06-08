using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Enums.Agents;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class Alert_Agent : IAgent
{
  public string Name => AgentType.Alert.ToSystemName();
  public int Priority => (int)AgentType.Alert;

  public async Task<IAgentResult> ExecuteAsync(GateKeeperIngestedEvent evt, CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      var alerts = new List<string>();

      if (evt.ResponseTimeMs > 1000)
        alerts.Add("High latency detected");

      if (evt.StatusCode >= 500)
        alerts.Add("Server error spike");

      if (string.IsNullOrWhiteSpace(evt.domainUrl))
        alerts.Add("Missing endpoint");

      var severity =
          alerts.Count == 0 ? SeverityStatus.Low :
          alerts.Count == 1 ? SeverityStatus.Medium :
          SeverityStatus.High;

      var payload = new AllAgentsPayload.AlertAgentPayload
      {
        Alerts = alerts,
        Severity = severity
      };

      return AgentRequestFactory.Ok(
          Name,
          "Alert evaluation completed.",
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