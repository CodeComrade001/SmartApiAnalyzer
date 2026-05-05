namespace SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Domain.Events;

public interface IAgent
{
  string Name { get; }

  Task ExecuteAsync(
      LogIngestedEvent evt,
      CancellationToken ct = default);
}