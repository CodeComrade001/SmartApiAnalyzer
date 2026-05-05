
namespace SmartApiAnalyzer.Domain.Entities.Models;

public sealed class AgentResult
{
  public string AgentName { get; init; } = string.Empty;

  public bool Success { get; init; }

  public bool StopProcessing { get; init; }

  public bool ShouldRetry { get; init; }

  public AgentSeverity Severity { get; init; } = AgentSeverity.Info;

  public string Message { get; init; } = string.Empty;

  public Dictionary<string, object>? Data { get; init; }

  public DateTime CompletedAtUtc { get; init; } = DateTime.UtcNow;

  public TimeSpan Duration { get; init; }
}

public enum AgentSeverity
{
  Info = 0,
  Warning = 1,
  Error = 2,
  Critical = 3
}