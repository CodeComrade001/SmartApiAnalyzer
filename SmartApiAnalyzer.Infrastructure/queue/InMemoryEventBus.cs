

using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Infrastructure.queue;

public class InMemoryEventBus : IEventBus
{
  private readonly IEventQueue _queue;

  public InMemoryEventBus(IEventQueue queue)
  {
    _queue = queue;
  }

  public async Task PublishAsync<T>(
      T message,
      CancellationToken ct = default)
  {
    if (message is LogIngestedEvent evt)
      await _queue.EnqueueAsync(evt, ct);
  }
}