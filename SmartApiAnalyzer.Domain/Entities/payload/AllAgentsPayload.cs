using SmartApiAnalyzer.Domain.Enums.Agents;

public class AllAgentsPayload
{
  public sealed class SslTlsCheckAgentPayload
  {
    public string Subject { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string ExpiresAt { get; set; } = string.Empty;
    public int DaysUntilExpiry { get; set; }
    public bool IsExpired { get; set; }
    public bool IsExpiringSoon { get; set; }
    public string TlsVersion { get; set; } = string.Empty;
    public bool IsTrusted { get; set; }
    public bool SupportsHsts { get; set; }
  }

  public sealed class SecurityHeaderAgentPayload
  {
    public double Score { get; set; }
    public string Grade { get; set; } = string.Empty;
    public bool HasHsts { get; set; }
    public bool HasCsp { get; set; }
    public bool HasXFrameOptions { get; set; }
    public bool HasXContentType { get; set; }
    public bool HasReferrerPolicy { get; set; }
    public bool HasPermPolicy { get; set; }
    public List<string> MissingHeaders { get; set; } = [];
    public List<string> PresentHeaders { get; set; } = [];
  }

  public sealed class SecurityAgentEvaluationAgentPayload
  {
    public double OverallRiskScore { get; set; }
    public string SecurityGrade { get; set; } = string.Empty;
    public string SecurityPosture { get; set; } = string.Empty;
    public int CriticalIssues { get; set; }
    public int Warnings { get; set; }
    public int TotalAgentsEvaluated { get; set; }
    public object? SynthesizedFindings { get; set; }
  }

  public sealed class SecurityAgentPayload
  {
    public object? Issues { get; set; }
    public double RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
  }

  public sealed class RedirectAgentPayload
  {
    public bool EnforcesHttps { get; set; }
    public bool HasLoop { get; set; }
    public bool LandsOnHttp { get; set; }
    public int HopCount { get; set; }
    public string FinalUrl { get; set; } = string.Empty;
    public List<RedirectHopPayload> Hops { get; set; } = [];
  }

  public sealed class RedirectHopPayload
  {
    public int Step { get; set; }
    public string FromUrl { get; set; } = string.Empty;
    public string ToUrl { get; set; } = string.Empty;
    public int StatusCode { get; set; }
  }

  public sealed class MetricsAgentPayload
  {
    public long ResponseTimeMs { get; set; }
    public int StatusCode { get; set; }
    public bool IsError { get; set; }
    public bool IsClientError { get; set; }
    public bool IsServerError { get; set; }
    public string PerformanceGrade { get; set; } = string.Empty;
    public string HealthStatus { get; set; } = string.Empty;
  }

  public sealed class LatencyPerformanceAgentPayload
  {
    public long LatencyMs { get; set; }
    public long TtfbMs { get; set; }
    public int StatusCode { get; set; }
    public string PerformanceGrade { get; set; } = string.Empty;
    public bool TimedOut { get; set; }
  }

  public sealed class CredentialCheckAgentPayload
  {
    public bool HasLoginForm { get; set; }
    public bool UsesHttps { get; set; }
    public bool CookieSecure { get; set; }
    public bool CookieHttpOnly { get; set; }
    public string CookieSameSite { get; set; } = string.Empty;
    public List<string> MissingHeaders { get; set; } = [];
    public bool ExposedSecretsFound { get; set; }
    public List<string> ExposedSecretTypes { get; set; } = [];
    public double RiskScore { get; set; }
  }

  public sealed class DomainHijackAgentPayload
  {
    public bool IsVulnerable { get; set; }
    public bool HasDanglingCname { get; set; }
    public bool HasSubdomainTakeover { get; set; }
    public bool NsLookupFailed { get; set; }
    public string CnameTarget { get; set; } = string.Empty;
    public string VulnerableProvider { get; set; } = string.Empty;
    public List<string> DetectedSignals { get; set; } = [];
    public string Summary { get; set; } = string.Empty;
  }

  public sealed class CostAnalysisPayload
  {
    public long Latency { get; set; }
    public int StatusCode { get; set; }
    public double CostScore { get; set; }
    public string CostLevel { get; set; } = string.Empty;
  }

  public sealed class KiloPayload
  {
    public long Latency { get; set; }
    public int StatusCode { get; set; }
    public double CostScore { get; set; }
    public string CostLevel { get; set; } = string.Empty;
  }

  public sealed class AlertAgentPayload
  {
    public object? Alerts { get; set; }
    public SeverityStatus Severity { get; set; } = SeverityStatus.Low;
  }

  public sealed class CorsPolicyAgentPayload
  {
    public bool AllowsWildcard { get; set; }

    public bool AllowsCredentials { get; set; }

    public bool WildcardWithCredentials { get; set; }

    public bool ReflectsArbitraryOrigin { get; set; }

    public string AllowOriginHeader { get; set; } = string.Empty;

    public string AllowMethodsHeader { get; set; } = string.Empty;

    public string AllowHeadersHeader { get; set; } = string.Empty;

    public bool IsMisconfigured { get; set; }

    public string Summary { get; set; } = string.Empty;
  }
}