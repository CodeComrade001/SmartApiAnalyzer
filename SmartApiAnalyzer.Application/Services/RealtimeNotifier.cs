using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services;

public sealed class RealtimeNotifier : IRealtimeNotifier
{
  public Task NotifyAsync(
      string message,
      UserApprovedScanEvent? evt = null,
      CancellationToken ct = default)
  {
    Console.WriteLine($"[Realtime] :  {message} , UserApprovedScanEvent: {evt}, CancellationToken: {ct}");

    return Task.CompletedTask;
  }
}