namespace SmartApiAnalyzer.Application.Services.Interface.Events;

public interface IRealtimeNotifier
{
  Task NotifyAsync(
      string message,
      CancellationToken ct = default);
}