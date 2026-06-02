using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Events;

public interface IAgentSelector
{
  /// <summary>
  /// Selects and orders agents appropriate for this event context.
  /// The gatekeeper is excluded — the coordinator handles it separately.
  /// </summary>
  IEnumerable<IAgent> Select(
      GateKeeperIngestedEvent evt,
      IEnumerable<IAgent> agents);
}