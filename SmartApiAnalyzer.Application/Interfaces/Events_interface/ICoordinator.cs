using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services.Interface.Events;

public interface ICoordinator
{
  Task RunAsync(
      LogIngestedEvent evt,
      CancellationToken ct = default);
}