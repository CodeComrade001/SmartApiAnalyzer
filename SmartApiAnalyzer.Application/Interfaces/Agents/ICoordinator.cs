using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Application.Services.Interface.Events;

public interface ICoordinator
{
  Task<PipelineResult> RunAsync(Guid sessionId, ApprovalRequest evt, CancellationToken ct);
}