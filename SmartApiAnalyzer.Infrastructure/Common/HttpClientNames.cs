namespace SmartApiAnalyzer.Infrastructure.Common;

/// <summary>
/// Centralised names for all named HttpClient registrations.
/// Register each via IHttpClientFactory in the DI extension.
/// </summary>
public static class HttpClientNames
{
    public const string CredentialExposure = "CredentialExposure";
    public const string LatencyInspection  = "LatencyInspection";
    public const string DomainHijack       = "DomainHijack";
    public const string CorsPolicy         = "CorsPolicy";
    public const string RedirectChain      = "RedirectChain";  // Must have AllowAutoRedirect = false
    public const string SecurityHeaders    = "SecurityHeaders";
    public const string SecurityEvaluation = "SecurityEvaluation";
}
