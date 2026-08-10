namespace SmartApiAnalyzer.Application.Services.Interface.Agents;

using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;

public interface IAgent
{
  string Name { get; }

  int Priority { get; }

  Task<IAgentResult> ExecuteAsync(
      UserApprovedScanEvent evt,
      CancellationToken ct);
}