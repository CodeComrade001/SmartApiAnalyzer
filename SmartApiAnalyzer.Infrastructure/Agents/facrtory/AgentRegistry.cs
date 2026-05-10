using SmartApiAnalyzer.Application.Services.Interface.Agents;
namespace SmartApiAnalyzer.Infrastructure.Agents.Factory;

public class AgentRegistry : IAgentRegistry
{
  private readonly Dictionary<string, IAgent> _agents;

  public AgentRegistry(IEnumerable<IAgent> agents)
  {
    _agents = agents.ToDictionary(
        a => a.Name,
        a => a,
        StringComparer.OrdinalIgnoreCase);
  }

  public IAgent Get(string agentName)
  {
    if (_agents.TryGetValue(agentName, out var agent))
      return agent;

    throw new KeyNotFoundException($"Agent '{agentName}' not found.");
  }

  public IReadOnlyCollection<IAgent> GetAll()
      => _agents.Values.ToList();
}