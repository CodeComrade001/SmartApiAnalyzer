using SmartApiAnalyzer.Application.Services.Interface.Agents;

public interface IAgentRegistry
{
  IAgent Get(string name);
  IReadOnlyCollection<IAgent> GetAll();
  bool TryGet(string name, out IAgent? agent);
}