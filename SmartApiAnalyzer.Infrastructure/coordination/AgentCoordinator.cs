// =============================================
// File: Infrastructure/Events/AgentCoordinator.cs
// =============================================
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Models;
using SmartApiAnalyzer.Domain.Events;

public class AgentCoordinator : ICoordinator
{
  private readonly IAgentSelector _selector;
  private readonly IRealtimeNotifier _notifier;
  private readonly IAgentRegistry _registry;

  public AgentCoordinator(
      IAgentRegistry registry,
      IAgentSelector selector,
      IRealtimeNotifier notifier)
  {
    _registry = registry;
    _selector = selector;
    _notifier = notifier;
  }

  public async Task RunAsync(
      LogIngestedEvent evt,
      CancellationToken ct)
  {
    var validation =
        _registry.Get(
            AgentType.UrlValidationAndEndpoints
                .ToSystemName());

    var validationResult =
        await validation.ExecuteAsync(evt, ct);

    await _notifier.NotifyAsync(
        validationResult.Message,
        evt);

    if (validationResult.StopProcessing)
      return;

    await ExecuteAgentsAsync(evt, ct);
  }

  public async Task ResumeAsync(
      Guid sessionId,
      ApprovalRequest request,
      CancellationToken ct)
  {
    try
    {
      var evt = new LogIngestedEvent(
          request.TenantId,
          string.Empty,
          200,
          0,
          DateTime.UtcNow)
      {
        SessionId = sessionId,
        ApprovedRoutes = request.Routes
      };

      await _notifier.NotifyAsync(
          $"User approved {request.Routes.Count} route(s). Resuming analysis.",
          evt);

      await ExecuteAgentsAsync(evt, ct);
    }
    catch (Exception ex)
    {
      await _notifier.NotifyAsync(
          $"Error resuming session {sessionId}: {ex.Message}",
          null);

      throw;
    }
  }

  private async Task<IEnumerable<IAgent>> ExecuteAgentsAsync(
      LogIngestedEvent evt,
      CancellationToken ct)
  {
    try
    {
      var selectedAgents =
          _selector.Select(evt, _registry.GetAll())
              .Where(x =>
                  x.Name != AgentType.UrlValidationAndEndpoints.ToSystemName())
              .ToList();

      foreach (var agent in selectedAgents)
      {
        await _notifier.NotifyAsync(
            $"{agent.Name} started",
            evt);

        var result =
            await agent.ExecuteAsync(evt, ct);

        await _notifier.NotifyAsync(
            result.Message,
            evt);

        if (result.StopProcessing)
          break;
      }

      return selectedAgents;
    }
    catch (Exception ex)
    {
      await _notifier.NotifyAsync(
          $"Error during agent execution: {ex.Message}",
          evt);

      return Enumerable.Empty<IAgent>();
    }
  }
}