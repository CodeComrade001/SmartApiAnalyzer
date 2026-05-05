using System.Collections.Concurrent;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

public class InMemoryEventQueue : IEventQueue
{
  private readonly ConcurrentQueue<LogIngestedEvent> _queue = new();

  public ValueTask<LogIngestedEvent> DequeueAsync(CancellationToken cancellationToken = default)
  {
    throw new NotImplementedException();
  }

  public void Enqueue(LogIngestedEvent logEvent)
  {
    _queue.Enqueue(logEvent);
  }

  public ValueTask EnqueueAsync(LogIngestedEvent logEvent, CancellationToken cancellationToken = default)
  {
    throw new NotImplementedException();
  }

  public bool TryDequeue(out LogIngestedEvent logEvent)
  {
    return _queue.TryDequeue(out logEvent);
  }
}