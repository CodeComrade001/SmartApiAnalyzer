using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

namespace SmartApiAnalyzer.Application.Services.Interface.Agents;

// ── 1. UrlValidationAndEndpoints ─────────────────────────────────────────────

public interface IUrlValidationService
{
    Task<UrlValidationResult> ValidateAsync(Uri uri, CancellationToken ct);
}

public interface IEndpointDiscoveryService
{
    Task<EndpointDiscoveryResult> DiscoverAsync(Uri website, CancellationToken ct);
}

public interface IThreatIntelService
{
    // Task<ThreatIntelResult> EvaluateAsync(Uri uri, CancellationToken ct);
    Task<ThreatIntelResult> EvaluateAsync(Uri uri, CancellationToken ct);
}

// ── 2. DomainHijack ──────────────────────────────────────────────────────────

public interface IDomainHijackService
{
    Task<DomainHijackResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

// ── 3. SslTlsCheck ───────────────────────────────────────────────────────────

public interface ISslTlsCheckService
{
    Task<SslTlsCheckResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

// ── 4. SecurityHeaders ───────────────────────────────────────────────────────

public interface ISecurityHeaderService
{
    Task<SecurityHeadersResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

// ── 5. CredentialCheck ───────────────────────────────────────────────────────

public interface ICredentialExposureService
{
    Task<CredentialExposureResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

// ── 6. CorsPolicy ────────────────────────────────────────────────────────────

public interface ICorsPolicyService
{
    Task<CorsPolicyResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

// ── 7. RedirectChain ─────────────────────────────────────────────────────────

public interface IRedirectChainService
{
    Task<RedirectChainResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

public interface ILatencyInspectionService
{
    Task<LatencyInspectionResult> AnalyzeAsync(Uri uri, CancellationToken ct);
}

// ─ 20. AlertDispatch ─────────────────────────────────────────────────────────

public interface IAlertDispatchService
{
    Task<AlertDispatchResult> DispatchAsync(string tenantId, Guid sessionId, IReadOnlyList<AgentResult<AlertDispatchResult>> criticalResults, CancellationToken ct);
}