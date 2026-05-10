using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Agent.Security;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class SecurityHeaders_Agent : IAgent
{
  private readonly ISecurityHeaderInspectionService _service;

  // public SecurityHeaders_Agent(
  //     ISecurityHeaderInspectionService service)
  // {
  //   _service = service;
  // }

  public string Name => AgentType.SecurityHeaders.ToSystemName();

  public int Priority => 5;

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
        ["HasHsts"] = result.HasHsts,
        ["HasCsp"] = result.HasCsp,
        ["HasXFrameOptions"] = result.HasXFrameOptions,
        ["HasNoSniff"] = result.HasNoSniff,
        ["MissingHeaders"] = result.MissingHeaders
      };

      return AgentRequestFactory.Ok(
          Name,
          "Security headers checked.",
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