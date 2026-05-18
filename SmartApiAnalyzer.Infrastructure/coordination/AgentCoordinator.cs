// =============================================
// File: Infrastructure/Events/AgentCoordinator.cs
// =============================================
using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Domain.Models;

namespace SmartAPiAnalyzer.Infrastructure.Coordination;

public sealed class AgentCoordinator : ICoordinator
{
  private readonly IAgentRegistry _registry;
  private readonly IAgentSelector _selector;
  private readonly IRealtimeNotifier _notifier;
  private readonly ILogger<AgentCoordinator> _logger;

  // Per-agent wall-clock timeout. Prevents a single hanging service
  // from stalling the entire pipeline indefinitely.
  private static readonly TimeSpan AgentTimeout = TimeSpan.FromSeconds(30);

  public AgentCoordinator(
      IAgentRegistry registry,
      IAgentSelector selector,
      IRealtimeNotifier notifier,
      ILogger<AgentCoordinator> logger)
  {
    _registry = registry;
    _selector = selector;
    _notifier = notifier;
    _logger = logger;
  }

  public async Task<PipelineResult> RunAsync(LogIngestedEvent evt, CancellationToken ct)
  {
    ArgumentNullException.ThrowIfNull(evt);

    var results = new List<AgentResult>();
    var pipeline = Stopwatch.StartNew();

    _logger.LogInformation(
        $"Pipeline starting for EventId={evt.EventId} TenantId={evt.TenantId} Endpoint={evt.Endpoint}",
        evt.EventId, evt.TenantId, evt.Endpoint);

    // ── Phase 1: Gatekeeper — always first, always exclusive ──────────
    if (!_registry.TryGet(AgentType.UrlValidationAndEndpoints.ToSystemName(), out var gatekeeper)
        || gatekeeper is null)
    {
      _logger.LogCritical("Gatekeeper agent is not registered. Pipeline aborted.");
      return Halted(evt, results, pipeline.Elapsed, "Gatekeeper agent not registered.");
    }

    var gatekeeperResult = await ExecuteWithTimeoutAsync(gatekeeper, evt, ct);
    results.Add(gatekeeperResult);
    MergePayload(evt, gatekeeper.Name, gatekeeperResult);

    await _notifier.NotifyAsync(gatekeeperResult.Message, evt, ct);

    if (gatekeeperResult.StopProcessing)
    {
      _logger.LogWarning(
          $"Pipeline halted by gatekeeper. Reason: {gatekeeperResult.Message}", gatekeeperResult.Message);

      return Halted(evt, results, pipeline.Elapsed, gatekeeperResult.Message);
    }

    _logger.LogInformation("Gatekeeper passed. Executing downstream agents.");

    // ── Phase 2: Downstream agents ────────────────────────────────────
    var agents = _selector.Select(evt, _registry.GetAll());

    foreach (var agent in agents)
    {
      ct.ThrowIfCancellationRequested();

      _logger.LogDebug($"Starting agent: {agent.Name}", agent.Name);
      await _notifier.NotifyAsync($"{agent.Name} started.", evt, ct);

      var result = await ExecuteWithTimeoutAsync(agent, evt, ct);
      results.Add(result);
      MergePayload(evt, agent.Name, result);

      await _notifier.NotifyAsync(result.Message, evt, ct);

      _logger.LogDebug(
          $"Agent {agent.Name} completed in {result.Elapsed.TotalMilliseconds}ms. Stop={result.StopProcessing} Severity={result.Severity}",
          agent.Name, result.Elapsed.TotalMilliseconds, result.StopProcessing, result.Severity);

      if (result.StopProcessing)
      {
        _logger.LogWarning(
            $"Pipeline short-circuited by agent {agent.Name}. Reason: {result.Message}",
            agent.Name, result.Message);

        pipeline.Stop();
        return new PipelineResult
        {
          EventId = evt.EventId,
          TenantId = evt.TenantId,
          Halted = true,
          HaltReason = $"[{agent.Name}] {result.Message}",
          AgentResults = results,
          CompletedAt = DateTime.UtcNow,
          TotalElapsed = pipeline.Elapsed,
        };
      }
    }

    pipeline.Stop();

    _logger.LogInformation(
        $"Pipeline completed for EventId={evt.EventId} in {pipeline.Elapsed.TotalMilliseconds}ms. Agents run: {results.Count}",
        evt.EventId, pipeline.Elapsed.TotalMilliseconds, results.Count);

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

  public async Task<PipelineResult> ResumeAsync(
      Guid sessionId,
      ApprovalRequest request,
      CancellationToken ct)
  {
    ArgumentNullException.ThrowIfNull(request);

    _logger.LogInformation(
        $"Resuming session {sessionId} with {request.Routes.Count} approved route(s).",
        sessionId, request.Routes.Count);

    // ResumeAsync rehydrates a minimal event representing the approved continuation.
    // The endpoint here is intentionally empty — resumed pipelines operate on
    // ApprovedRoutes, not a raw URL. Downstream agents that require NormalizedUri
    // must guard against a null NormalizedUri.
    var evt = new LogIngestedEvent(
        request.TenantId,
        endpoint: string.Empty,
        statusCode: 200,
        responseTimeMs: 0,
        timestamp: DateTime.UtcNow)
    {
      SessionId = sessionId,
      ApprovedRoutes = request.Routes.Select(r => r.Route).ToList(),
    };

    await _notifier.NotifyAsync(
        $"Session {sessionId}: user approved {request.Routes.Count} route(s). Resuming.",
        evt, ct);

    return await RunDownstreamOnlyAsync(evt, ct);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async Task<PipelineResult> RunDownstreamOnlyAsync(
      LogIngestedEvent evt, CancellationToken ct)
  {
    var results = new List<AgentResult>();
    var pipeline = Stopwatch.StartNew();

    var agents = _selector.Select(evt, _registry.GetAll());

    foreach (var agent in agents)
    {
      ct.ThrowIfCancellationRequested();

      var result = await ExecuteWithTimeoutAsync(agent, evt, ct);
      results.Add(result);
      MergePayload(evt, agent.Name, result);

      await _notifier.NotifyAsync(result.Message, evt, ct);

      if (result.StopProcessing)
      {
        pipeline.Stop();
        return Halted(evt, results, pipeline.Elapsed,
            $"[{agent.Name}] {result.Message}");
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

  private async Task<AgentResult> ExecuteWithTimeoutAsync(
      IAgent agent, LogIngestedEvent evt, CancellationToken externalCt)
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
          $"Agent {agent.Name} exceeded {AgentTimeout.TotalSeconds}s timeout and was cancelled.",
          agent.Name, AgentTimeout.TotalSeconds);

      return AgentResult.CreateWarning(
          agent.Name,
          $"Agent timed out after {AgentTimeout.TotalSeconds}s.",
          sw.Elapsed);
    }
  }

  private static void MergePayload(LogIngestedEvent evt, string agentName, AgentResult result)
  {
    if (result.Payload.Count > 0)
      evt.AgentPayloads[agentName] = new Dictionary<string, object>(result.Payload);
  }

  private static PipelineResult Halted(
      LogIngestedEvent evt,
      List<AgentResult> results,
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
