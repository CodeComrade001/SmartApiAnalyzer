using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;
using Microsoft.Extensions.Logging;

public class LogProcessingWorker : BackgroundService
{
  private readonly IEventQueue _queue;
  private readonly IServiceScopeFactory _scopeFactory;
  private static readonly Guid GlobalGuid = Guid.Parse("12345678-1234-1234-1234-123456789ABC");

  public LogProcessingWorker(
      IEventQueue queue,
      IServiceScopeFactory scopeFactory)
  {
    _queue = queue;
    _scopeFactory = scopeFactory;
  }

  protected override async Task ExecuteAsync(
      CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      var evt = await _queue.DequeueAsync(stoppingToken);
      var sessionId = GlobalGuid;

      using var scope = _scopeFactory.CreateScope();

      var notifier =
          scope.ServiceProvider.GetRequiredService<IRealtimeNotifier>();

      var coordinator =
          scope.ServiceProvider.GetRequiredService<ICoordinator>();

      await notifier.NotifyAsync(
          new AgentProgressMessage
          {
            ScanId = sessionId,
            Message = "New log received; processing started"
          },
          evt);

      await coordinator.RunAsync(sessionId, evt, stoppingToken);
    }
  }
}
