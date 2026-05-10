using SmartApiAnalyzer.Application.Services.Interface.Agents;

public interface IAgentRegistry
{
  IAgent Get(string agentName);
  IReadOnlyCollection<IAgent> GetAll();
}