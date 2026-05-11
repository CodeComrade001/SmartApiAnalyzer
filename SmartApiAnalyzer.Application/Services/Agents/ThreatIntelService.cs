using SmartApiAnalyzer.Application.Services.Interface.Agent.Security;
using SmartApiAnalyzer.Domain.Entities.Models;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class ThreatIntelService : IThreatIntelService
{
  public Task<ThreatAnalysisResult> AnalyzeAsync(Uri target, CancellationToken ct)
  {
    throw new NotImplementedException();
  }
}