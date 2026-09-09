using System.Collections.Frozen;
using SmartApiAnalyzer.Application.Services.Interface.Agents;

namespace SmartApiAnalyzer.Infrastructure.Agents.Registry;

/// <summary>
/// Immutable, thread-safe registry populated at startup.
/// Agents are keyed by their canonical system name.
/// </summary>
public sealed class AgentRegistry : IAgentRegistry
{
    private readonly FrozenDictionary<string, IAgent> _agents;
    private readonly IReadOnlyList<IAgent> _ordered;

    public AgentRegistry(IEnumerable<IAgent> agents)
    {
        var list = agents
            .OrderBy(a => a.Priority)
            .ToList();

        // Fail fast at startup if any name collision exists
        var dict = new Dictionary<string, IAgent>(StringComparer.Ordinal);
        foreach (var agent in list)
        {
            if (!dict.TryAdd(agent.Name, agent))
                throw new InvalidOperationException(
                    $"Duplicate agent name detected: '{agent.Name}'. Each agent must have a unique Name.");
        }

        _agents = dict.ToFrozenDictionary(StringComparer.Ordinal);
        _ordered = list.AsReadOnly();
    }

    public IAgent Get(string name)
    {
        if (_agents.TryGetValue(name, out var agent))
            return agent;

        throw new KeyNotFoundException(
            $"No agent named '{name}'");
    }

    public bool TryGet(string name, out IAgent? agent)
        => _agents.TryGetValue(name, out agent);


    public IReadOnlyCollection<IAgent> GetAll()
     => _ordered;

    public IReadOnlyCollection<IAgent> GetSelected(IReadOnlyList<string> agentNames)
     => _ordered.Where(a => agentNames.Contains(a.Name, StringComparer.Ordinal))
        .ToList()
        .AsReadOnly();
}
