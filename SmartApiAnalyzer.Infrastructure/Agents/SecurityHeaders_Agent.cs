using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

// namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class SecurityHeaders_Agent : IAgent
{
    private readonly ISecurityHeadersService _service;
    private readonly ILogger<SecurityHeaders_Agent> _logger;

    public string Name => AgentType.SecurityHeaders.ToSystemName();
    public int Priority => (int)AgentType.SecurityHeaders;

    public SecurityHeaders_Agent(
        ISecurityHeadersService service,
        ILogger<SecurityHeaders_Agent> logger)
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

            var result = await _service.AnalyzeAsync(uri, ct);

            var payload = new Dictionary<string, object>
            {
                ["Score"] = result.Score,
                ["Grade"] = result.Grade,
                ["HasHsts"] = result.HasHsts,
                ["HasCsp"] = result.HasCsp,
                ["HasXFrameOptions"] = result.HasXFrameOptions,
                ["HasXContentType"] = result.HasXContentTypeOpts,
                ["HasReferrerPolicy"] = result.HasReferrerPolicy,
                ["HasPermPolicy"] = result.HasPermissionsPolicy,
                ["MissingHeaders"] = result.MissingHeaders,
                ["PresentHeaders"] = result.PresentHeaders,
            };

            if (result.IsCritical)
            {
                _logger.LogWarning(
                    "Critical security header failures on {Host}. Score: {Score}/100, Missing: {Missing}",
                    uri.Host, result.Score, string.Join(", ", result.MissingHeaders));

                return AgentRequestFactory.Warning(
                    Name,
                    $"Security header posture is critical. Score: {result.Score}/100. " +
                    $"Missing: {string.Join(", ", result.MissingHeaders)}",
                    sw.Elapsed, payload);
            }

            return AgentRequestFactory.Ok(
                Name, $"Security headers checked. Score: {result.Score}/100 (Grade: {result.Grade}).",
                sw.Elapsed, payload);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SecurityHeaders agent fault");
            return AgentRequestFactory.Warning(
                Name, $"Security header check inconclusive: {ex.GetType().Name} — {ex.Message}", sw.Elapsed);
        }
        finally { sw.Stop(); }
    }
}
