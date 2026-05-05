using SmartApiAnalyzer.Domain.Events;

public interface IRealtimeNotifier
{
  Task NotifyAsync(string agentName, LogIngestedEvent evt);
}