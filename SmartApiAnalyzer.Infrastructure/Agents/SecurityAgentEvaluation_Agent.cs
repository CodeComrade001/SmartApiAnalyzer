using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

/// <summary>
/// Priority 11 — Aggregate reasoning agent. Runs after all analysis agents.
/// Reads evt.AgentResults, synthesises risk signals into a final security grade.
/// No external I/O. Never halts the pipeline — output feeds Alert_Agent.
/// </summary>
public sealed class SecurityAgentEvaluation_Agent : IAgent
{
    public string Name => AgentType.SecurityAgentEvaluation.ToSystemName();
    public int Priority => (int)AgentType.SecurityAgentEvaluation;

    public async Task<IAgentResult> ExecuteAsync(GateKeeperIngestedEvent evt, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();

        try
        {
            ct.ThrowIfCancellationRequested();

            var results = evt.AgentResults;

            if (results.Count == 0)
            {
                return AgentRequestFactory.Ok(
                    Name, "No prior agent results to evaluate.", sw.Elapsed, results);
            }

            double accumulated = 0;
            int criticalCount = 0;
            int warningCount = 0;
            var synthesized = new List<string>();

            foreach (var r in results)
            {
                switch (r.Severity)
                {
                    case AgentSeverity.Critical:
                        criticalCount++;
                        accumulated += 30;
                        synthesized.Add($"[CRITICAL] {r.AgentName}: {r.Message}");
                        break;
                    case AgentSeverity.Warning:
                        warningCount++;
                        accumulated += 10;
                        synthesized.Add($"[WARNING]  {r.AgentName}: {r.Message}");
                        break;
                }

                // Pull explicit risk scores produced by analysis agents
                if (r.Payload is IDictionary<string, object> agentPayload && agentPayload.TryGetValue("RiskScore", out var raw) && raw is double agentRisk)
                    accumulated += agentRisk * 0.25; // weighted contribution
            }

            double finalScore = Math.Min(100, accumulated);

            var grade = finalScore switch
            {
                < 20 => "A",
                < 40 => "B",
                < 60 => "C",
                < 80 => "D",
                _ => "F"
            };

            var posture = finalScore switch
            {
                < 20 => "Excellent",
                < 40 => "Acceptable",
                < 60 => "Needs Attention",
                < 80 => "Poor",
                _ => "Critical Risk"
            };

            var payload = new AllAgentsPayload.SecurityAgentEvaluationAgentPayload
            {
                OverallRiskScore = Math.Round(finalScore, 2),
                SecurityGrade = grade,
                SecurityPosture = posture,
                CriticalIssues = criticalCount,
                Warnings = warningCount,
                TotalAgentsEvaluated = results.Count,
                SynthesizedFindings = synthesized
            };

            return AgentRequestFactory.Ok(
                Name,
                $"Security evaluation complete. Grade={grade} | Posture={posture} | Score={finalScore:F0}/100",
                sw.Elapsed,
                payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            return AgentRequestFactory.CriticalStop(
                Name, $"Evaluation failed: {ex.GetType().Name}: {ex.Message}", sw.Elapsed);
        }
        finally
        {
            sw.Stop();
        }
    }
}
