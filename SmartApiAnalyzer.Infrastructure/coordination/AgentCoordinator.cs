// =============================================
// File: Infrastructure/Events/AgentCoordinator.cs
// =============================================
using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;

namespace SmartAPiAnalyzer.Infrastructure.Coordination;

public sealed class AgentCoordinator : ICoordinator
{
  private readonly IAgentRegistry _registry;
  private readonly IAgentSelector _selector;
  private readonly IRealtimeNotifier _notifier;
  private readonly ILogger<AgentCoordinator> _logger;
  private readonly ITemporaryInMemoryStorage<Object> _tempStorage;

  private static readonly TimeSpan AgentTimeout = TimeSpan.FromSeconds(30);

  public AgentCoordinator(
      IAgentRegistry registry,
      IAgentSelector selector,
      IRealtimeNotifier notifier,
      ILogger<AgentCoordinator> logger,
      ITemporaryInMemoryStorage<Object> tempStorage
      )
  {
    _registry = registry;
    _selector = selector;
    _notifier = notifier;
    _logger = logger;
    _tempStorage = tempStorage;
  }


  public async Task<PipelineResult> RunAsync(
      Guid sessionId,
      UserApprovedScanEvent request,
      CancellationToken ct)
  {
    ArgumentNullException.ThrowIfNull(request);

    _logger.LogInformation(
        "Resuming Agent execution session {sessionId} with {request.RoutesAndEndpoints.Count} approved route(s).",
        sessionId, request.ApprovedRoutesAndMethods.Count);

    // ResumeAsync rehydrates a minimal event representing the approved continuation.
    // The endpoint here is intentionally empty — resumed pipelines operate on
    // ApprovedRoutes, not a raw URL. Downstream agents that require NormalizedUri
    // must guard against a null NormalizedUri.
    var evt = new UserApprovedScanEvent(
        request.TenantId,
        passedDomainUrl: string.Empty,
        request.ApprovedRoutesAndMethods,
        statusCode: 200,
        responseTimeMs: 0,
        timestamp: DateTime.UtcNow,
        request.UserSelectedAgents)
    {
      SessionId = sessionId,
    };

    await _notifier.NotifyAsync(
        "Session {sessionId}: user approved {request.RoutesAndEndpoints.Count} route(s). Resuming.",
        evt, ct);

    return await RunDownstreamOnlyAsync(evt, ct);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async Task<PipelineResult> RunDownstreamOnlyAsync(
      UserApprovedScanEvent evt, CancellationToken ct)
  {
    var results = new List<IAgentResult>();
    var pipeline = Stopwatch.StartNew();

    var agents = _selector.Select(evt, _registry.GetAll());

    foreach (var agent in agents)
    {
      ct.ThrowIfCancellationRequested();

      var result = await ExecuteWithTimeoutAsync(agent, evt, ct);
      results.Add(result);
      MergePayload(evt, agent.Name, result);

      _tempStorage.StoreScanResult(evt.TenantId, agent.Name, result);

      await _notifier.NotifyAsync(result.Message, evt, ct);

      if (result.StopProcessing)
      {
        pipeline.Stop();
        return Halted(evt, results, pipeline.Elapsed,
            "[{agent.Name}] {result.Message}");
      }
    }

    pipeline.Stop();
    return new PipelineResult
    {
      EventId = evt.EventId,
      TenantId = evt.TenantId,
      Halted = false,
      AgentResults = results,
      CompletedAt = DateTime.UtcNow,
      TotalElapsed = pipeline.Elapsed,
    };
  }

  private async Task<IAgentResult> ExecuteWithTimeoutAsync(
      IAgent agent, UserApprovedScanEvent evt, CancellationToken externalCt)
  {
    using var linked = CancellationTokenSource.CreateLinkedTokenSource(externalCt);
    linked.CancelAfter(AgentTimeout);

    var sw = Stopwatch.StartNew();
    try
    {
      return await agent.ExecuteAsync(evt, linked.Token);
    }
    catch (OperationCanceledException) when (!externalCt.IsCancellationRequested)
    {
      // Per-agent timeout fired, not the pipeline's external token
      sw.Stop();
      _logger.LogWarning(
          "Agent {agent.Name} exceeded {AgentTimeout.TotalSeconds}s timeout and was cancelled.",
          agent.Name, AgentTimeout.TotalSeconds);

      return AgentResult<DefaultAgentResult>.CreateWarning(
          agent.Name,
          "Agent timed out after {AgentTimeout.TotalSeconds}s.",
          sw.Elapsed);
    }
  }

  private static void MergePayload(
    UserApprovedScanEvent evt,
    string agentName,
    IAgentResult result)
  {
    if (result.PayloadObject is null)
    {
      return;
    }

    if (result.PayloadObject is Dictionary<string, object> payload)
    {
      evt.AgentPayloads[agentName] = payload;
      return;
    }

    evt.AgentPayloads[agentName] = new Dictionary<string, object>
    {
      ["Payload"] = result.PayloadObject,
    };
  }

  private static PipelineResult Halted(
      UserApprovedScanEvent evt,
      List<IAgentResult> results,
      TimeSpan elapsed,
      string reason) => new()
      {
        EventId = evt.EventId,
        TenantId = evt.TenantId,
        Halted = true,
        HaltReason = reason,
        AgentResults = results,
        CompletedAt = DateTime.UtcNow,
        TotalElapsed = elapsed,
      };
}
