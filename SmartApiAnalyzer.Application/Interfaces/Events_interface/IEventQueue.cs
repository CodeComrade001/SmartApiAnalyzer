namespace SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Domain.Events;

public interface IEventQueue
{
    ValueTask EnqueueAsync(
        GateKeeperIngestedEvent logEvent,
        CancellationToken cancellationToken = default);

    ValueTask<GateKeeperIngestedEvent> DequeueAsync(
        CancellationToken cancellationToken = default);
}