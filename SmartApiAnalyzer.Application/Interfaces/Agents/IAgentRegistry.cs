using SmartApiAnalyzer.Application.Services.Interface.Agents;

public interface IAgentRegistry
{
  IAgent Get(string agentName);
  IReadOnlyCollection<IAgent> GetAll();
  bool TryGet(string name, out IAgent? agent);
}