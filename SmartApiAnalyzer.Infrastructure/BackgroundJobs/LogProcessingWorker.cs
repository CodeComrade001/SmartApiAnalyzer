using Microsoft.Extensions.Hosting;
using SmartApiAnalyzer.Application.Services.Interface.Events;

public class LogProcessingWorker : BackgroundService
{
  private readonly IEventQueue _queue;
  private readonly IRealtimeNotifier _notifier;

  public LogProcessingWorker(
      IEventQueue queue,
      IRealtimeNotifier notifier)
  {
    _queue = queue;
    _notifier = notifier;
  }

  protected override async Task ExecuteAsync(
      CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      var evt = await _queue.DequeueAsync(stoppingToken);

      await _notifier.NotifyAsync("New log received; processing started", evt);
    }
  }
}