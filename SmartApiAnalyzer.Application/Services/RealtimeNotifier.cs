using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services;

public sealed class RealtimeNotifier : IRealtimeNotifier
{
  public Task NotifyAsync(
      AgentProgressMessage AgentMessage,
      UserApprovedScanEvent? evt = null,
      CancellationToken ct = default)
  {
    Console.WriteLine($" [Realtime] AgentName :  {AgentMessage.AgentName} , [Realtime] message :  {AgentMessage.Message} , UserApprovedScanEvent: {evt}, CancellationToken: {ct}");

    return Task.CompletedTask;
  }
}