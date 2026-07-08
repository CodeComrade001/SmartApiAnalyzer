using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

using System.Threading.Channels;
namespace SmartApiAnalyzer.Infrastructure.queue;

public class InMemoryEventQueue : IEventQueue
{
  private readonly Channel<UserApprovedScanEvent> _channel =
      Channel.CreateUnbounded<UserApprovedScanEvent>();

  public async ValueTask EnqueueAsync(
      UserApprovedScanEvent logEvent,
      CancellationToken ct = default)
  {
    await _channel.Writer.WriteAsync(logEvent, ct);
  }

  public async ValueTask<UserApprovedScanEvent> DequeueAsync(
      CancellationToken ct = default)
  {
    return await _channel.Reader.ReadAsync(ct);
  }
}