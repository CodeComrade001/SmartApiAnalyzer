using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agent.Metric;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class LatencyPerformance_Agent : IAgent
{
  private readonly ILatencyInspectionService _service;

  // public LatencyPerformance_Agent(
  //     ILatencyInspectionService service)
  // {
  //   _service = service;
  // }

  public string Name => AgentType.LatencyPerformance.ToSystemName();

  public int Priority => 4;

  public async Task<AgentResult> ExecuteAsync(
      LogIngestedEvent evt,
      CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      if (!Uri.TryCreate(evt.Endpoint, UriKind.Absolute, out var uri))
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "Invalid URL.",
            sw.Elapsed);
      }

      var result = await _service.AnalyzeAsync(uri, ct);

      var payload = new Dictionary<string, object>
      {
        ["LatencyMs"] = result.LatencyMs,
        ["TtfbMs"] = result.TtfbMs,
        ["StatusCode"] = result.StatusCode,
        ["PerformanceGrade"] = result.Grade
      };

      return AgentRequestFactory.Ok(
          Name,
          "Latency inspection completed.",
          sw.Elapsed,
          payload);
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
      throw;
    }
    catch (Exception ex)
    {
      return AgentRequestFactory.CriticalStop(
          Name,
          ex.Message,
          sw.Elapsed);
    }
    finally
    {
      sw.Stop();
    }
  }
}