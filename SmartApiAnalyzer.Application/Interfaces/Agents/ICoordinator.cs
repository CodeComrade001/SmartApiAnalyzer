using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Application.Services.Interface.Events;

public interface ICoordinator
{
  Task RunAsync(
      LogIngestedEvent evt,
      CancellationToken ct = default);

  Task ResumeAsync(Guid sessionId, ApprovalRequest request, CancellationToken ct);
}