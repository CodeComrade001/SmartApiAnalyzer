using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

using System.Threading.Channels;
namespace SmartApiAnalyzer.Infrastructure.queue;

public class InMemoryEventQueue : IEventQueue
{
  private readonly Channel<LogIngestedEvent> _channel =
      Channel.CreateUnbounded<LogIngestedEvent>();

  public async ValueTask EnqueueAsync(
      LogIngestedEvent logEvent,
      CancellationToken ct = default)
  {
    await _channel.Writer.WriteAsync(logEvent, ct);
  }

  public async ValueTask<LogIngestedEvent> DequeueAsync(
      CancellationToken ct = default)
  {
    return await _channel.Reader.ReadAsync(ct);
  }
}