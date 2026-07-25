using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services.Interface.Events;


public interface IRealtimeNotifier
{
  Task NotifyAsync(
      AgentProgressMessage agentMessage,
      UserApprovedScanEvent? evt = null,
      CancellationToken ct = default);
}