using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class AgentSelector : IAgentSelector
{
  public IEnumerable<IAgent> Select(LogIngestedEvent evt, IEnumerable<IAgent> agents)
  {
    throw new NotImplementedException();
  }
}