
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Infrastructure.Agents.Factory;

/// <summary>
/// Central factory for constructing AgentResult instances.
/// Infrastructure-only — never leak into Domain or Application.
/// </summary>
public class AgentRequestFactory
{
    public static AgentResult Ok(
        string agentName,
        string message,
        TimeSpan elapsed,
        Dictionary<string, object>? payload = null)
        => AgentResult.CreateOk(agentName, message, elapsed, payload);

    public static AgentResult Warning(
        string agentName,
        string message,
        TimeSpan elapsed,
        Dictionary<string, object>? payload = null)
        => AgentResult.CreateWarning(agentName, message, elapsed, payload);

    public static AgentResult CriticalStop(
        string agentName,
        string message,
        TimeSpan elapsed,
        Dictionary<string, object>? payload = null)
        => AgentResult.CreateCriticalStop(agentName, message, elapsed, payload);
}