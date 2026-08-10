namespace SmartApiAnalyzer.Application.Services.Interface.Agents;

using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Entities.Payload;
using SmartApiAnalyzer.Domain.Events;

public interface IGateKeeperAgent
{
  string Name { get; }

  int Priority { get; }

  Task<AgentResult<GateKeeperPayload>> ExecuteAsync(
    GateKeeperIngestedEvent evt,
    CancellationToken ct);
  // Task<IAgentResult> ExecuteAsync(
  //   GateKeeperIngestedEvent evt,
  //   CancellationToken ct);
}