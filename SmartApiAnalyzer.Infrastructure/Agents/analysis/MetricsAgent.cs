using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class Metrics_Agent : IAgent
{
  public string Name => AgentType.Metrics.ToSystemName();
  public int Priority => 3;

  public async Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      if (evt == null)
      {
        return AgentRequestFactory.CriticalStop(Name, "Invalid event payload.", sw.Elapsed);
      }

      var responseTime = evt.ResponseTimeMs;
      var statusCode = evt.StatusCode;

      var isError = statusCode >= 400;

      var payload = new Dictionary<string, object>
      {
        ["ResponseTimeMs"] = responseTime,
        ["StatusCode"] = statusCode,
        ["IsError"] = isError,
        ["PerformanceGrade"] =
            responseTime < 200 ? "A" :
            responseTime < 500 ? "B" :
            responseTime < 1000 ? "C" : "D"
      };

      return AgentRequestFactory.Ok(
          Name,
          "Metrics analysis completed.",
          sw.Elapsed,
          payload);
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
      throw;
    }
    catch (Exception ex)
    {
      return AgentRequestFactory.CriticalStop(Name, ex.Message, sw.Elapsed);
    }
    finally
    {
      sw.Stop();
    }
  }
}