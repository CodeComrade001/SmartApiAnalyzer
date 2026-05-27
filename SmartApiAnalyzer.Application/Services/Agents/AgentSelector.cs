using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class AgentSelector : IAgentSelector
{
  // Explicit execution plan
  // Order matters.
  private static readonly AgentType[] ExecutionPlan =
  {
        AgentType.SecurityHeaders,
        AgentType.DomainHijack,
        AgentType.LatencyPerformance,
        AgentType.SslTlsCheck,
        AgentType.CostAnalysis,
        AgentType.Alert
    };

  public IEnumerable<IAgent> Select(
      LogIngestedEvent evt,
      IEnumerable<IAgent> agents)
  {
    ArgumentNullException.ThrowIfNull(evt);
    ArgumentNullException.ThrowIfNull(agents);

    // Fast lookup table
    var agentMap = agents
        .GroupBy(a => a.Name)
        .ToDictionary(
            g => g.Key,
            g => g.First(),
            StringComparer.OrdinalIgnoreCase);

    var selectedAgents = new List<IAgent>();

    foreach (var agentType in ExecutionPlan)
    {
      var systemName = agentType.ToSystemName();

      if (agentMap.TryGetValue(systemName, out var agent))
      {
        selectedAgents.Add(agent);
      }
    }

    return selectedAgents;
  }
}