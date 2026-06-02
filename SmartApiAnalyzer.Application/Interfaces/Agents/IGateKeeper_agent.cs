namespace SmartApiAnalyzer.Application.Services.Interface.Agents;

using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;

public interface IGateKeeperAgent
{
  string Name { get; }

  int Priority { get; }

  Task<IAgentResult> ExecuteAsync(
    GateKeeperIngestedEvent evt,
    CancellationToken ct);
}