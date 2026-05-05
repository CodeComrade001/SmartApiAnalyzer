

using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

public class AgentCoordinator : ICoordinator
{
  private readonly IEnumerable<IAgent> _agents;
  private readonly IRealtimeNotifier _notifier;

  public AgentCoordinator(
      IEnumerable<IAgent> agents,
      IRealtimeNotifier notifier)
  {
    _agents = agents;
    _notifier = notifier;
  }

  public async Task RunAsync(
      LogIngestedEvent evt,
      CancellationToken ct = default)
  {
    foreach (var agent in _agents)
    {
      await _notifier.NotifyAsync(
          $"{agent.Name} started", evt);

      await agent.ExecuteAsync(evt, ct);

      await _notifier.NotifyAsync(
          $"{agent.Name} completed", evt);
    }
  }
}