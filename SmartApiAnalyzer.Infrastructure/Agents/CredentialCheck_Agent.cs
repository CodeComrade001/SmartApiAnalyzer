using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

// namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class CredentialCheck_Agent : IAgent
{
    private readonly ICredentialExposureService _service;
    private readonly ILogger<CredentialCheck_Agent> _logger;

    public string Name => AgentType.CredentialCheck.ToSystemName();
    public int Priority => (int)AgentType.CredentialCheck;

    public CredentialCheck_Agent(
        ICredentialExposureService service,
        ILogger<CredentialCheck_Agent> logger)
    {
        _service = service;
        _logger = logger;
    }

    public async Task<IAgentResult> ExecuteAsync(UserApprovedScanEvent evt, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            ct.ThrowIfCancellationRequested();

            if (!Uri.TryCreate(evt.domainUrl?.Trim(), UriKind.Absolute, out var uri))
                return AgentRequestFactory.CriticalStop(Name, "Invalid URL.", sw.Elapsed);

            var result = await _service.AnalyzeAsync(uri, ct);

            var payload = new AllAgentsPayload.CredentialCheckAgentPayload
            {
                HasLoginForm = result.HasLoginForm,
                UsesHttps = result.UsesHttps,
                CookieSecure = result.CookieSecure,
                CookieHttpOnly = result.CookieHttpOnly,
                CookieSameSite = result.CookieSameSite,
                MissingHeaders = result.MissingHeaders,
                ExposedSecretsFound = result.ExposedSecretsFound,
                ExposedSecretTypes = result.ExposedSecretTypes,
                RiskScore = result.RiskScore,
            };

            if (result.IsCriticalRisk)
            {
                _logger.LogWarning(
                    "Credential exposure critical risk on {Host}. Score: {Score}. Secrets: {Secrets}",
                    uri.Host, result.RiskScore, string.Join(", ", result.ExposedSecretTypes));

                return AgentRequestFactory.Warning(
                    Name,
                    $"Credential exposure risk detected. Score: {result.RiskScore:F1}. " +
                    (result.ExposedSecretsFound
                        ? $"Exposed: {string.Join(", ", result.ExposedSecretTypes)}."
                        : "Insecure credential posture."),
                    sw.Elapsed, payload);
            }

            if (result.RiskScore > 40)
            {
                return AgentRequestFactory.Warning(
                    Name,
                    $"Credential posture has warnings. Risk score: {result.RiskScore:F1}.",
                    sw.Elapsed, payload);
            }

            return AgentRequestFactory.Ok(
                Name, $"Credential posture acceptable. Risk score: {result.RiskScore:F1}.",
                sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CredentialCheck agent fault");
            return AgentRequestFactory.CriticalStop(
                Name, $"Credential check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
