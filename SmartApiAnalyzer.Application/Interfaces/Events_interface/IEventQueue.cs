namespace SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Domain.Events;

public interface IEventQueue
{
    ValueTask EnqueueAsync(
        UserApprovedScanEvent logEvent,
        CancellationToken cancellationToken = default);

    ValueTask<UserApprovedScanEvent> DequeueAsync(
        CancellationToken cancellationToken = default);
}