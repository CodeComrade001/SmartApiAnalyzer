using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;


public class SecurityAgent : IAgent
{
  public string Name => "Security Agent";
  public int Priority => 1;

  public async Task<AgentResult> ExecuteAsync(
      LogIngestedEvent evt,
      CancellationToken ct)
  {
    throw new NotImplementedException();
  }
}