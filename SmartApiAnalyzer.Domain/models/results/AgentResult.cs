
namespace SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

public sealed class AgentCriticalResult : IAgentResult
{
  public string AgentName { get; init; } = string.Empty;

  public bool Success => false;

  public bool StopProcessing => true;

  public string Message { get; init; } = string.Empty;

  public AgentSeverity Severity => AgentSeverity.Critical;

  public TimeSpan Elapsed { get; init; }

  public object? PayloadObject => null;

  public static AgentCriticalResult CreateCriticalStop(
      string agentName,
      string message,
      TimeSpan elapsed)
  {
    return new AgentCriticalResult
    {
      AgentName = agentName,
      Message = message,
      Elapsed = elapsed
    };
  }
}
public sealed class AgentResult<TPayload> : IAgentResult
{
  public string AgentName { get; init; } = string.Empty;

  public bool Success { get; init; }

  public bool StopProcessing { get; init; }

  public string Message { get; init; } = string.Empty;

  public AgentSeverity Severity { get; init; }

  public TimeSpan Elapsed { get; init; }

  public TPayload? Payload { get; init; }

  // =========================================================
  // Non-generic access for coordinators/pipelines
  // =========================================================

  public object? PayloadObject => Payload;

  // =========================================================
  // Factory Methods
  // =========================================================

  public static AgentResult<TPayload> CreateOk(
      string agentName,
      string message,
      TimeSpan elapsed,
      TPayload? payload = default)
  {
    return new AgentResult<TPayload>
    {
      AgentName = agentName,
      Success = true,
      StopProcessing = false,
      Message = message,
      Severity = AgentSeverity.Info,
      Elapsed = elapsed,
      Payload = payload
    };
  }

  public static AgentResult<TPayload> CreateWarning(
      string agentName,
      string message,
      TimeSpan elapsed,
      TPayload? payload = default)
  {
    return new AgentResult<TPayload>
    {
      AgentName = agentName,
      Success = true,
      StopProcessing = false,
      Message = message,
      Severity = AgentSeverity.Warning,
      Elapsed = elapsed,
      Payload = payload
    };
  }
}

public interface IAgentResult
{
  string AgentName { get; }

  bool Success { get; }

  bool StopProcessing { get; }

  string Message { get; }

  AgentSeverity Severity { get; }

  TimeSpan Elapsed { get; }

  object? PayloadObject { get; }
}



// ── UrlValidation ─────────────────────────────────────────────────────────────

public sealed class UrlValidationResult
{
  public bool IsValid { get; init; }
  public bool IsHttps { get; init; }
  public string Scheme { get; init; } = string.Empty;
  public string Host { get; init; } = string.Empty;
  public bool DnsResolvable { get; init; }
  public string? ResolvedIp { get; init; }
  public bool IsPrivateIp { get; init; }
  public bool IsLoopback { get; init; }
  public string? FailureReason { get; init; }
}

public sealed class EndpointDiscoveryResult
{
  public List<string> DiscoveredRoutes { get; init; } = new();
  public List<string> AllowedMethods { get; init; } = new();
  public string DiscoveryMethod { get; init; } = string.Empty; // OpenApi|Options|Probe|Heuristic
  public bool OpenApiAvailable { get; init; }
  public string? OpenApiUrl { get; init; }
}

// ── ThreatResult ─────────────────────────────────────────────────────────────

public sealed class ThreatIntelResult
{
  public double ThreatScore { get; init; }
  public bool IsMalicious { get; init; }
  public bool SuspiciousHost { get; init; }
  public bool DnsFailure { get; init; }
  public bool IsPrivateOrLoopback { get; init; }
  public bool IsUnencrypted { get; init; }
  public string Summary { get; init; } = string.Empty;
  public double Score { get; init; }
}

// public sealed class ThreatIntelResult
// {
//   public ThreatVerdict Verdict { get; init; } = ThreatVerdict.Safe;

//   public double RiskScore { get; init; }

//   public ThreatFlags Flags { get; init; } = new();

//   public ThreatMetadata Metadata { get; init; } = new();

//   public IReadOnlyCollection<string> Reasons { get; init; }
//       = Array.Empty<string>();
// }

// public enum ThreatVerdict
// {
//   Safe,
//   Suspicious,
//   Malicious,
//   Unknown
// }

// public sealed class ThreatFlags
// {
//   public bool IsMalicious { get; init; }
//   public bool SuspiciousHost { get; init; }
//   public bool DnsFailure { get; init; }
//   public bool IsPrivateOrLoopback { get; init; }
//   public bool IsUnencrypted { get; init; }
// }

// ── DomainHijack ─────────────────────────────────────────────────────────────

public sealed class DomainHijackResult
{
  public bool IsVulnerable { get; init; }
  public bool HasDanglingCname { get; init; }
  public bool HasSubdomainTakeover { get; init; }
  public bool NsLookupFailed { get; init; }
  public string? CnameTarget { get; init; }
  public string? VulnerableProvider { get; init; }
  public List<string> DetectedSignals { get; init; } = new();
  public string Summary { get; init; } = string.Empty;
}

//  ── SslTlsCheck ───────────────────────────────────────────────────────────────────

public sealed class SslTlsCheckResult
{
  public bool IsValid { get; init; }
  public bool IsTrusted { get; init; }
  public string Subject { get; init; } = string.Empty;
  public string Issuer { get; init; } = string.Empty;
  public DateTime ExpiresAt { get; init; }
  public int DaysUntilExpiry { get; init; }
  public bool IsExpiringSoon { get; init; }  // < 30 days
  public bool IsExpired { get; init; }
  public string TlsVersion { get; init; } = string.Empty;
  public bool SupportsHsts { get; init; }
  public string? FailureReason { get; init; }
  public bool IsCritical { get; init; }
}


// ── SecurityHeaders ───────────────────────────────────────────────────────────

public sealed class SecurityHeadersResult
{
  public bool HasHsts { get; init; }
  public bool HasCsp { get; init; }
  public bool HasXFrameOptions { get; init; }
  public bool HasXContentTypeOpts { get; init; }
  public bool HasReferrerPolicy { get; init; }
  public bool HasPermissionsPolicy { get; init; }
  public bool HasXssProtection { get; init; }
  public List<string> MissingHeaders { get; init; } = new();
  public Dictionary<string, string> PresentHeaders { get; init; } = new();
  public double Score { get; init; }  // 0-100
  public string Grade { get; init; } = string.Empty;
  public bool IsCritical { get; init; }
  public List<string> Findings { get; init; } = new();
  public List<string> MisconfiguredHeaders { get; init; } = new();
}

// ── CredentialExposure ────────────────────────────────────────────────────────

public sealed class CredentialExposureResult
{
  public bool HasLoginForm { get; init; }
  public bool UsesHttps { get; init; }
  public bool CookieSecure { get; init; }
  public bool CookieHttpOnly { get; init; }
  public string CookieSameSite { get; init; } = string.Empty;
  public List<string> MissingHeaders { get; init; } = new();
  public bool ExposedSecretsFound { get; init; }
  public List<string> ExposedSecretTypes { get; init; } = new();
  public double RiskScore { get; init; }
  public bool IsCriticalRisk { get; init; }
}

// ── CorsPolicy ────────────────────────────────────────────────────────────────

public sealed class CorsPolicyResult
{
  public bool AllowsWildcardOrigin { get; init; }
  public bool AllowsCredentials { get; init; }
  public bool WildcardWithCredentials { get; init; }  // critical misconfiguration
  public string AllowOriginHeader { get; init; } = string.Empty;
  public string AllowMethodsHeader { get; init; } = string.Empty;
  public string AllowHeadersHeader { get; init; } = string.Empty;
  public bool ReflectsArbitraryOrigin { get; init; }
  public bool IsMisconfigured { get; init; }
  public string Summary { get; init; } = string.Empty;
}

// ── RedirectChain ─────────────────────────────────────────────────────────────

public sealed class RedirectChainResult
{
  public List<RedirectHop> Hops { get; init; } = new();
  public bool EnforcesHttps { get; init; }
  public bool HasRedirectLoop { get; init; }
  public bool LandsOnHttp { get; init; }
  public int HopCount { get; init; }
  public string FinalUrl { get; init; } = string.Empty;
  public bool IsCritical { get; init; }
}

public sealed class RedirectHop
{
  public int Step { get; init; }
  public string FromUrl { get; init; } = string.Empty;
  public string ToUrl { get; init; } = string.Empty;
  public int StatusCode { get; init; }
}

// ── LatencyInspection ────────────────────────────────────────────────────────

public sealed class LatencyInspectionResult
{
  public double LatencyMs { get; init; }
  public double TtfbMs { get; init; }
  public int StatusCode { get; init; }
  public string Grade { get; init; } = string.Empty;
  public bool TimedOut { get; init; }
}

// ── AlertDispatchRequest ────────────────────────────────────────────────────────

public sealed class AlertDispatchResult
{
  public bool Success { get; init; }

  public int TotalAlertsProcessed { get; init; }

  public int SuccessfulDispatches { get; init; }

  public int FailedDispatches { get; init; }

  public bool RequiresRetry { get; init; }

  public TimeSpan Elapsed { get; init; }

  public IReadOnlyList<string> Errors { get; init; }
      = Array.Empty<string>();

  public DateTime CompletedAtUtc { get; init; }
      = DateTime.UtcNow;
}

// ── Agent severity levels ─────────────────────────────────────────────────

public enum AgentSeverity { Info, Warning, Critical }