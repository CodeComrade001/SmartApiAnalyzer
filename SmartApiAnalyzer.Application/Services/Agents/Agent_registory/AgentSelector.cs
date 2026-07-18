using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class AgentSelector : IAgentSelector
{

  public IEnumerable<IAgent> Select(
    UserApprovedScanEvent evt,
    IEnumerable<IAgent> agents)
  {
    var selected = new HashSet<string>(
        evt.UserSelectedAgents,
        StringComparer.OrdinalIgnoreCase);

    return agents
        .Where(a => selected.Contains(a.Name))
        .OrderBy(a => a.Priority);
  }
}