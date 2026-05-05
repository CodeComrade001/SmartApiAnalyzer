namespace SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Domain.Events;

public interface IEventQueue
{
    ValueTask EnqueueAsync(
        LogIngestedEvent logEvent,
        CancellationToken cancellationToken = default);

    ValueTask<LogIngestedEvent> DequeueAsync(
        CancellationToken cancellationToken = default);
}