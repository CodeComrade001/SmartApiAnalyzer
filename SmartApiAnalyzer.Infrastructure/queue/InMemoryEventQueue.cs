using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

using System.Threading.Channels;
namespace SmartApiAnalyzer.Infrastructure.queue;

public class InMemoryEventQueue : IEventQueue
{
  private readonly Channel<GateKeeperIngestedEvent> _channel =
      Channel.CreateUnbounded<GateKeeperIngestedEvent>();

  public async ValueTask EnqueueAsync(
      GateKeeperIngestedEvent logEvent,
      CancellationToken ct = default)
  {
    await _channel.Writer.WriteAsync(logEvent, ct);
  }

  public async ValueTask<GateKeeperIngestedEvent> DequeueAsync(
      CancellationToken ct = default)
  {
    return await _channel.Reader.ReadAsync(ct);
  }
}