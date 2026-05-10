namespace SmartApiAnalyzer.Domain.Constants;

public static class AgentTypeExtensions
{
  public static string ToSystemName(this AgentType type)
      => type switch
      {
        AgentType.UrlValidationAndEndpoints => "UrlValidationAndEndpoints",
        AgentType.CredentialCheck => "CredentialCheck",
        AgentType.CostAnalysis => "CostAnalysis",
        AgentType.Metrics => "Metrics",
        AgentType.LatencyPerformance => "LatencyPerformance",
        AgentType.Alert => "Alert",
        AgentType.SecurityHeaders => "SecurityHeaders",
        AgentType.SslTlsCheck => "SslTlsCheck",
        AgentType.SecurityAgentEvaluation => "SecurityAgentEvaluation",
        _ => throw new ArgumentOutOfRangeException(nameof(type))
      };
}

public enum AgentType
{
  UrlValidationAndEndpoints = 1,
  CredentialCheck = 2,
  CostAnalysis = 3,
  Metrics = 4,
  LatencyPerformance = 5,
  SecurityHeaders = 6,
  SslTlsCheck = 7,
  SecurityAgentEvaluation = 8,
  Alert = 20
}