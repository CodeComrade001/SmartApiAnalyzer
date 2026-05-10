using SmartApiAnalyzer.Domain.Entities.Models;

namespace SmartApiAnalyzer.Application.Services.Interface.Agent.Security;

/// <summary>
/// Checks whether a domain / URL is suspicious,
/// malicious, blacklisted, phishing, etc.
/// </summary>
public interface IThreatIntelService
{
  Task<ThreatAnalysisResult> AnalyzeAsync(
      Uri target,
      CancellationToken ct);
}