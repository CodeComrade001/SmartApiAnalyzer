using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Infrastructure.Agents.Selector;

/// <summary>
/// Selects and orders the pipeline agents for a given event.
/// The gatekeeper (UrlValidationAndEndpoints) is always excluded here —
/// the coordinator owns its exclusive first execution.
/// </summary>
public sealed class AgentSelector : IAgentSelector
{
    private static readonly string GatekeeperName =
        AgentType.UrlValidationAndEndpoints.ToSystemName();

    public IReadOnlyList<IAgent> Select(
        LogIngestedEvent evt,
        IReadOnlyList<IAgent> candidates)
    {
        ArgumentNullException.ThrowIfNull(evt);
        ArgumentNullException.ThrowIfNull(candidates);

        return candidates
            .Where(a => !string.Equals(a.Name, GatekeeperName, StringComparison.Ordinal))
            .OrderBy(a => a.Priority)
            .ToList()
            .AsReadOnly();
    }
}
