using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class SslTlsCheck_Agent : IAgent
{
    private readonly ISslTlsCheckService _service;
    private readonly ILogger<SslTlsCheck_Agent> _logger;

    public string Name => AgentType.SslTlsCheck.ToSystemName();
    public int Priority => (int)AgentType.SslTlsCheck;

    public SslTlsCheck_Agent(ISslTlsCheckService service, ILogger<SslTlsCheck_Agent> logger)
    {
        _service = service;
        _logger = logger;
    }

    public async Task<AgentResult> ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            ct.ThrowIfCancellationRequested();

            if (!Uri.TryCreate(evt.Endpoint?.Trim(), UriKind.Absolute, out var uri))
                return AgentRequestFactory.CriticalStop(Name, "Invalid URI.", sw.Elapsed);

            // Non-HTTPS targets skip this agent gracefully — SecurityHeaders will flag it.
            if (!string.Equals(uri.Scheme, "https", StringComparison.OrdinalIgnoreCase))
            {
                return AgentRequestFactory.Warning(
                    Name,
                    "Target is not HTTPS — SSL/TLS check skipped. Insecure scheme detected.",
                    sw.Elapsed,
                    new Dictionary<string, object> { ["Scheme"] = uri.Scheme, ["IsHttps"] = false });
            }

            var result = await _service.AnalyzeAsync(uri, ct);

            var payload = new Dictionary<string, object>
            {
                ["Subject"] = result.Subject,
                ["Issuer"] = result.Issuer,
                ["ExpiresAt"] = result.ExpiresAt.ToString("o"),
                ["DaysUntilExpiry"] = result.DaysUntilExpiry,
                ["IsExpired"] = result.IsExpired,
                ["IsExpiringSoon"] = result.IsExpiringSoon,
                ["TlsVersion"] = result.TlsVersion,
                ["IsTrusted"] = result.IsTrusted,
                ["SupportsHsts"] = result.SupportsHsts,
            };

            if (result.IsCritical)
            {
                _logger.LogWarning(
                    "SSL/TLS critical failure on {Host}: {Reason}", uri.Host, result.FailureReason);

                return AgentRequestFactory.CriticalStop(
                    Name, result.FailureReason ?? "Certificate is invalid or expired.", sw.Elapsed, payload);
            }

            if (result.IsExpiringSoon)
            {
                return AgentRequestFactory.Warning(
                    Name,
                    $"Certificate expires in {result.DaysUntilExpiry} day(s). Renewal required.",
                    sw.Elapsed, payload);
            }

            return AgentRequestFactory.Ok(Name, "SSL/TLS certificate is valid.", sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SslTlsCheck agent fault");
            return AgentRequestFactory.Warning(
                Name, $"SSL/TLS check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
