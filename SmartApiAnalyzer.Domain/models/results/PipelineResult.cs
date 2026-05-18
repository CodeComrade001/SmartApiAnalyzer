

namespace SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

public sealed class PipelineResult
{
  public Guid EventId { get; init; }
  public Guid TenantId { get; init; }
  public bool Halted { get; init; }
  public string HaltReason { get; init; } = string.Empty;
  public List<AgentResult> AgentResults { get; init; } = new();
  public DateTime CompletedAt { get; init; } = DateTime.UtcNow;
  public TimeSpan TotalElapsed { get; init; }
}
