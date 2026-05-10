using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Events;

public interface IAgentSelector
{
  IEnumerable<IAgent> Select(
      LogIngestedEvent evt,
      IEnumerable<IAgent> agents);
}