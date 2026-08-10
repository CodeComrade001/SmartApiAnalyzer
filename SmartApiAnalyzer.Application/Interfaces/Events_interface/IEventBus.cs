namespace SmartApiAnalyzer.Application.Services.Interface.Events;

public interface IEventBus
{
  Task PublishAsync<T>(T message, CancellationToken ct = default);
}

