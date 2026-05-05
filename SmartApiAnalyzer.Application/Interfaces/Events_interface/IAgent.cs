namespace SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;

public interface IAgent
{
  string Name { get; }

  int Priority { get; }

  Task<AgentResult> ExecuteAsync(
      LogIngestedEvent evt,
      CancellationToken ct);
}