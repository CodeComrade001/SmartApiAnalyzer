namespace SmartApiAnalyzer.Domain.Constants;

public static class AgentTypeExtensions
{
  public static string ToSystemName(this AgentType type)
      => type switch
      {
        AgentType.UrlValidationAndEndpoints => "UrlValidationAndEndpoints",
        AgentType.DomainHijack => "DomainHijack",
        AgentType.SslTlsCheck => "SslTlsCheck",
        AgentType.SecurityHeaders => "SecurityHeaders",
        AgentType.CredentialCheck => "CredentialCheck",
        AgentType.CorsPolicy => "CorsPolicy",
        AgentType.RedirectChain => "RedirectChain",
        // AgentType.MixedContent => "MixedContent",
        // AgentType.RateLimitProbe => "RateLimitProbe",
        AgentType.LatencyPerformance => "LatencyPerformance",
        AgentType.Metrics => "Metrics",
        AgentType.CostAnalysis => "CostAnalysis",
        AgentType.SecurityAgentEvaluation => "SecurityAgentEvaluation",
        AgentType.Alert => "Alert",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unregistered AgentType.")
      };
}

public enum AgentType
{
  UrlValidationAndEndpoints = 1,   // Gatekeeper — runs first, always
  DomainHijack = 2,   // DNS takeover / dangling CNAME
  SslTlsCheck = 3,   // Certificate validity + TLS version
  SecurityHeaders = 4,   // HSTS, CSP, X-Frame-Options, etc.
  CredentialCheck = 5,   // Login form posture, cookies, exposed secrets
  CorsPolicy = 6,   // CORS misconfiguration
  RedirectChain = 7,   // HTTP→HTTPS redirect, loop detection
  // MixedContent = 8,   // HTTP resources on HTTPS pages
  // RateLimitProbe = 9,   // Rate limiting enforcement probe
  LatencyPerformance = 10,  // TTFB + total latency
  Metrics = 11,  // Status code, error rate, perf grade
  CostAnalysis = 12,  // Cost score from latency + error signals
  SecurityAgentEvaluation = 13,  // Aggregate security verdict (runs last of security tier)
  Alert = 20,  // Notification dispatch — always final
}