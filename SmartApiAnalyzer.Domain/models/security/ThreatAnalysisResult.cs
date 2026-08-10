namespace SmartApiAnalyzer.Domain.Entities.Models;

/// <summary>
/// Result returned from threat intelligence scan.
/// </summary>
public sealed class ThreatAnalysisResult
{
  public bool IsMalicious { get; init; }

  public double Score { get; init; }

  public string? Category { get; init; }

  public List<string>? Reason { get; init; }
}