namespace SmartApiAnalyzer.Domain.Enums;

public enum PipelineStatus
{
  Completed,
  PartiallyCompleted,
  Failed,
  Cancelled,
}

public enum EndpointClassification
{
  Unknown,
  RestResource,
  GraphQl,
  HealthCheck,
  Documentation,
  Authentication,
}