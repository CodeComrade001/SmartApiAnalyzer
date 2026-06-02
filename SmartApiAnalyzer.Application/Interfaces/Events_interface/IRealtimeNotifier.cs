using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services.Interface.Events;


public interface IRealtimeNotifier
{
  Task NotifyAsync(
      string message,
      GateKeeperIngestedEvent? evt = null,
      CancellationToken ct = default);
}