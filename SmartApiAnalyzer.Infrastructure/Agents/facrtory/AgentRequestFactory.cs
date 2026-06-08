
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Infrastructure.Agents.Factory;

/// <summary>
/// Central factory for constructing AgentResult instances.
/// Infrastructure-only — never leak into Domain or Application.
/// </summary>
public static class AgentRequestFactory
{
    public static AgentResult<TPayload> Ok<TPayload>(
        string agentName,
        string message,
        TimeSpan elapsed,
        TPayload? payload = default)
        => AgentResult<TPayload>.CreateOk(
            agentName,
            message,
            elapsed,
            payload);

    public static AgentResult<TPayload> Warning<TPayload>(
        string agentName,
        string message,
        TimeSpan elapsed,
        TPayload? payload = default)
        => AgentResult<TPayload>.CreateWarning(
            agentName,
            message,
            elapsed,
            payload);

    public static AgentCriticalResult CriticalStop(
        string agentName,
        string message,
        TimeSpan elapsed)
    {
        return AgentCriticalResult.CreateCriticalStop(
            agentName,
            message,
            elapsed);
    }
}
