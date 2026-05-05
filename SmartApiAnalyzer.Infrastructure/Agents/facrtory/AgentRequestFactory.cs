
using SmartApiAnalyzer.Domain.Entities.Models;

namespace SmartApiAnalyzer.Infrastructure.Agents.Factory;

public sealed partial class AgentRequestFactory
{
  public static AgentResult Ok(
      string agentName,
      string message,
      TimeSpan duration,
      Dictionary<string, object>? data = null)
      => new()
      {
        AgentName = agentName,
        Success = true,
        Message = message,
        Duration = duration,
        Data = data,
        Severity = AgentSeverity.Info
      };

  public static AgentResult Warning(
      string agentName,
      string message,
      TimeSpan duration)
      => new()
      {
        AgentName = agentName,
        Success = true,
        Message = message,
        Duration = duration,
        Severity = AgentSeverity.Warning
      };

  public static AgentResult CriticalStop(
      string agentName,
      string message,
      TimeSpan duration)
      => new()
      {
        AgentName = agentName,
        Success = false,
        StopProcessing = true,
        Message = message,
        Duration = duration,
        Severity = AgentSeverity.Critical
      };

  public static AgentResult Retry(
      string agentName,
      string message,
      TimeSpan duration)
      => new()
      {
        AgentName = agentName,
        Success = false,
        ShouldRetry = true,
        Message = message,
        Duration = duration,
        Severity = AgentSeverity.Error
      };
}