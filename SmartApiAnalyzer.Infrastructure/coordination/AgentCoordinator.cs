using System.Collections.Concurrent;
using System.Diagnostics;

using Microsoft.Extensions.Logging;

using SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Events;

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

  private static readonly TimeSpan AgentTimeout =
      TimeSpan.FromSeconds(30);

  private const int MaxWorkersPerAgent = 5;

  public AgentCoordinator(
      IAgentRegistry registry,
      IAgentSelector selector,
      IRealtimeNotifier notifier,
      ILogger<AgentCoordinator> logger,
      ITemporaryInMemoryStorage<object> tempStorage)
  {
    _registry = registry;
    _selector = selector;
    _notifier = notifier;
    _logger = logger;
  }

  public async Task<PipelineResult> RunAsync(
      Guid sessionId,
      UserApprovedScanEvent request,
      CancellationToken ct)
  {
    ArgumentNullException.ThrowIfNull(request);

    _logger.LogInformation(
        "Starting agent execution session {SessionId} with {RouteCount} approved route(s).",
        sessionId,
        request.ApprovedRoutesAndMethods.Count);

    var evt = new UserApprovedScanEvent(
        request.TenantId,
        request.domainUrl,
        request.ApprovedRoutesAndMethods,
        statusCode: 200,
        responseTimeMs: 0,
        timestamp: DateTime.UtcNow,
        request.UserSelectedAgents)
    {
      SessionId = sessionId
    };

    return await RunDownstreamOnlyAsync(evt, ct);
  }

  private async Task<PipelineResult> RunDownstreamOnlyAsync(
      UserApprovedScanEvent evt,
      CancellationToken ct)
  {
    var pipeline = Stopwatch.StartNew();

    var agents = _selector
        .Select(evt, _registry.GetAll())
        .ToList();

    _logger.LogInformation(
        "Selected {AgentCount} agent(s) for session {SessionId}.",
        agents.Count,
        evt.SessionId);

    /*
     * ONE MAIN WORKER PER SELECTED AGENT.
     *
     * If 5 agents are selected:
     *
     * Agent A -> Main Worker
     * Agent B -> Main Worker
     * Agent C -> Main Worker
     * Agent D -> Main Worker
     * Agent E -> Main Worker
     *
     * All 5 execute concurrently.
     */
    var agentTasks = agents.Select(
        agent => RunAgentWorkerAsync(
            agent,
            evt,
            ct));

    var agentResults = await Task.WhenAll(agentTasks);

    pipeline.Stop();

    /*
     * Flatten all results from all agents.
     */
    var results = agentResults
        .SelectMany(x => x.Results)
        .ToList();

    /*
     * The original event is updated ONLY AFTER
     * all parallel work has completed.
     *
     * This prevents concurrent writes to:
     *
     * evt.AgentPayloads
     */
    foreach (var agentResult in agentResults)
    {
      MergeAgentPayloads(
          evt,
          agentResult.AgentName,
          agentResult.Results);
    }

    /*
     * If any agent requested a halt, return halted.
     */
    var haltedResult = agentResults
        .FirstOrDefault(x => x.StopProcessing);

    if (haltedResult is not null)
    {
      return Halted(
          evt,
          results,
          pipeline.Elapsed,
          haltedResult.HaltReason
              ?? "Agent requested pipeline halt.");
    }

    return new PipelineResult
    {
      EventId = evt.EventId,
      TenantId = evt.TenantId,
      Halted = false,
      AgentResults = results,
      CompletedAt = DateTime.UtcNow,
      TotalElapsed = pipeline.Elapsed
    };
  }

  /*
   * ============================================================
   * ONE MAIN WORKER PER AGENT
   * ============================================================
   *
   * Each agent receives the SAME original event as its source.
   *
   * The approved routes are then processed with a maximum
   * concurrency of 5.
   */
  private async Task<AgentWorkerResult> RunAgentWorkerAsync(
      IAgent agent,
      UserApprovedScanEvent originalEvent,
      CancellationToken ct)
  {
    _logger.LogInformation(
        "Starting main worker for agent {AgentName}.",
        agent.Name);

    var results = new ConcurrentBag<IAgentResult>();

    var stopProcessing = 0;

    string? haltReason = null;

    /*
     * Each RouteInputDto is one unit of work.
     */
    var routes = originalEvent.ApprovedRoutesAndMethods;

    var options = new ParallelOptions
    {
      MaxDegreeOfParallelism = MaxWorkersPerAgent,
      CancellationToken = ct
    };

    await Parallel.ForEachAsync(
        routes,
        options,
        async (route, workerToken) =>
        {
          /*
           * If another worker requested a halt,
           * don't start additional work.
           */
          if (Volatile.Read(ref stopProcessing) == 1)
            return;

          /*
           * IMPORTANT:
           *
           * Do NOT modify originalEvent.
           *
           * Create a new event containing only the
           * route being processed by this worker.
           */
          var workerEvent = CreateWorkerEvent(
                  originalEvent,
                  route);

          var result = await ExecuteWithTimeoutAsync(
                  agent,
                  workerEvent,
                  workerToken);

          results.Add(result);

          /*
           * Notify immediately when this individual
           * worker finishes.
           */
          await NotifyProgressAsync(
                  agent,
                  originalEvent,
                  result,
                  workerToken);

          if (result.StopProcessing)
          {
            haltReason = result.Message;

            Interlocked.Exchange(
                    ref stopProcessing,
                    1);
          }
        });

    _logger.LogInformation(
        "Main worker for agent {AgentName} completed with {ResultCount} result(s).",
        agent.Name,
        results.Count);

    return new AgentWorkerResult
    {
      AgentName = agent.Name,
      Results = results.ToList(),
      StopProcessing = Volatile.Read(ref stopProcessing) == 1,
      HaltReason = haltReason
    };
  }

  /*
   * ============================================================
   * CREATE EVENT FOR INDIVIDUAL WORKER
   * ============================================================
   *
   * This preserves UserApprovedScanEvent completely.
   *
   * The agent still receives:
   *
   * ExecuteAsync(UserApprovedScanEvent, CancellationToken)
   *
   * But the event contains ONE approved route instead of
   * the entire collection.
   */
  private static UserApprovedScanEvent CreateWorkerEvent(
      UserApprovedScanEvent originalEvent,
      RouteInputDto route)
  {
    return new UserApprovedScanEvent(
        originalEvent.TenantId,
        originalEvent.domainUrl,
        new List<RouteInputDto>
        {
                route
        },
        originalEvent.StatusCode,
        originalEvent.ResponseTimeMs,
        originalEvent.Timestamp,
        originalEvent.UserSelectedAgents)
    {
      SessionId = originalEvent.SessionId
    };
  }

  /*
   * ============================================================
   * EXECUTE ONE AGENT WORK ITEM
   * ============================================================
   */
  private async Task<IAgentResult> ExecuteWithTimeoutAsync(
      IAgent agent,
      UserApprovedScanEvent workerEvent,
      CancellationToken externalCt)
  {
    using var linked =
        CancellationTokenSource.CreateLinkedTokenSource(
            externalCt);

    linked.CancelAfter(AgentTimeout);

    var sw = Stopwatch.StartNew();

    try
    {
      return await agent.ExecuteAsync(
          workerEvent,
          linked.Token);
    }
    catch (OperationCanceledException)
        when (!externalCt.IsCancellationRequested)
    {
      sw.Stop();

      _logger.LogWarning(
          "Agent {AgentName} exceeded {Timeout}s timeout.",
          agent.Name,
          AgentTimeout.TotalSeconds);

      return AgentResult<DefaultAgentResult>.CreateWarning(
          agent.Name,
          $"Agent timed out after {AgentTimeout.TotalSeconds}s.",
          sw.Elapsed);
    }
  }

  /*
   * ============================================================
   * REALTIME NOTIFICATION
   * ============================================================
   */
  private async Task NotifyProgressAsync(
      IAgent agent,
      UserApprovedScanEvent originalEvent,
      IAgentResult result,
      CancellationToken ct)
  {
    await _notifier.NotifyAsync(
        new AgentProgressMessage
        {
          ScanId = originalEvent.TenantId,
          AgentName = agent.Name,
          Status = result.Success
                ? "Completed"
                : "Failed",
          Message = result.Message,
          Success = result.Success,
          Payload = result.PayloadObject,
          Timestamp = DateTime.UtcNow,
          EventId = originalEvent.EventId
        },
        originalEvent,
        ct);
  }

  /*
   * ============================================================
   * MERGE RESULTS
   * ============================================================
   *
   * This happens AFTER all workers have finished.
   *
   * Therefore AgentPayloads is not being concurrently modified.
   */
  private static void MergeAgentPayloads(
      UserApprovedScanEvent evt,
      string agentName,
      List<IAgentResult> results)
  {
    var payloads = new Dictionary<string, object>();

    var index = 0;

    foreach (var result in results)
    {
      if (result.PayloadObject is null)
        continue;

      payloads[$"result_{index++}"] =
          result.PayloadObject;
    }

    if (payloads.Count == 0)
      return;

    evt.AgentPayloads[agentName] = payloads;
  }

  private static PipelineResult Halted(
      UserApprovedScanEvent evt,
      List<IAgentResult> results,
      TimeSpan elapsed,
      string reason)
  {
    return new PipelineResult
    {
      EventId = evt.EventId,
      TenantId = evt.TenantId,
      Halted = true,
      HaltReason = reason,
      AgentResults = results,
      CompletedAt = DateTime.UtcNow,
      TotalElapsed = elapsed
    };
  }

  private sealed class AgentWorkerResult
  {
    public string AgentName { get; init; } = string.Empty;

    public List<IAgentResult> Results { get; init; } = new();

    public bool StopProcessing { get; init; }

    public string? HaltReason { get; init; }
  }
}