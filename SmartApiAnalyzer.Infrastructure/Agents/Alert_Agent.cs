using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class Alert_Agent : IAgent
{
  public string Name => AgentType.Alert.ToSystemName();
  public int Priority => (int)AgentType.Alert;

  public Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
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
          alerts.Count == 0 ? "LOW" :
          alerts.Count == 1 ? "MEDIUM" :
          "HIGH";

      var payload = new Dictionary<string, object>
      {
        ["Alerts"] = alerts,
        ["Severity"] = severity
      };

      return Task.FromResult(AgentRequestFactory.Ok(
          Name,
          "Alert evaluation completed.",
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