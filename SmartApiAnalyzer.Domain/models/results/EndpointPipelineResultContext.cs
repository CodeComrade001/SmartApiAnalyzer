using SmartApiAnalyzer.Domain.Enums;

namespace SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;


public sealed class EndpointPipelineContext
{
  public required Uri Website { get; init; }

  public List<CandidateEndpoint> Candidates { get; } = [];

  public List<VerifiedEndpoint> VerifiedEndpoints { get; } = [];

  public DiscoveryStatistics Statistics { get; } = new();

  public HttpClient HttpClient { get; init; } = default!;

  public Dictionary<string, object> SharedData { get; } = [];

}

public sealed class EndpointPipelineResult<T>
{
  public T? pipelineResult { get; set; }

}

public sealed class CandidateEndpoint
{
  /// <summary>
  /// The discovered endpoint path.
  /// Example: /api/v1/users/{id}
  /// </summary>
  public required string Path { get; init; }

  /// <summary>
  /// The discovery strategy that found this endpoint.
  /// Example: Swagger, Html, Robots, Javascript...
  /// </summary>
  public required string DiscoverySource { get; init; }

  /// <summary>
  /// Confidence assigned by the discovery strategy.
  /// Range: 0 - 100
  /// </summary>
  public double Confidence { get; set; }

  /// <summary>
  /// Evidence supporting this discovery.
  /// </summary>
  public List<EndpointEvidence> Evidence { get; } = [];

  /// <summary>
  /// UTC timestamp when the endpoint was discovered.
  /// </summary>
  public DateTimeOffset DiscoveredAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class EndpointEvidence
{
  /// <summary>
  /// The strategy that produced this evidence.
  /// </summary>
  public required string Source { get; init; }

  /// <summary>
  /// Human-readable explanation.
  /// Example:
  /// "Found in OpenAPI specification."
  /// </summary>
  public required string Description { get; init; }

  /// <summary>
  /// Raw value that produced the evidence.
  /// Example:
  /// "/swagger/v1/swagger.json"
  /// or
  /// "/api/users"
  /// </summary>
  public string? Value { get; init; }

  /// <summary>
  /// Confidence contributed by this evidence.
  /// </summary>
  public double Confidence { get; init; }
}

public sealed class VerifiedEndpoint
{
  /// <summary>
  /// The verified endpoint path.
  /// </summary>
  public required string Path { get; init; }

  /// <summary>
  /// Whether the endpoint was successfully verified.
  /// </summary>
  public bool IsVerified { get; set; }

  /// <summary>
  /// HTTP status returned during verification.
  /// </summary>
  public int? StatusCode { get; set; }

  /// <summary>
  /// Final confidence after verification.
  /// </summary>
  public double Confidence { get; set; }

  /// <summary>
  /// Supported HTTP methods discovered later.
  /// </summary>
  public HashSet<HttpMethod> SupportedMethods { get; } = [];

  /// <summary>
  /// Discovery evidence inherited from CandidateEndpoint.
  /// </summary>
  public List<EndpointEvidence> Evidence { get; } = [];

  /// <summary>
  /// Additional metadata added during Endpoint Intelligence.
  /// </summary>
  public Dictionary<string, object> Metadata { get; } = [];

  /// <summary>
  /// Time this endpoint was verified.
  /// </summary>
  public DateTimeOffset VerifiedAt { get; set; } = DateTimeOffset.UtcNow;

  /// <summary>Added — carried over from the merged CandidateEndpoint(s). Needed because
  /// DiscoveredEndpoint reports both DiscoveredAt and VerifiedAt, and this was the only
  /// place that information could survive the verification merge.</summary>
  public DateTimeOffset DiscoveredAt { get; init; }
}

public sealed class DiscoveryStatistics
{
  /// <summary>
  /// Number of strategies executed.
  /// </summary>
  public int StrategiesExecuted { get; set; }

  /// <summary>
  /// Total candidate endpoints discovered.
  /// </summary>
  public int CandidateEndpointsFound { get; set; }

  /// <summary>
  /// Number of duplicate endpoints removed.
  /// </summary>
  public int DuplicateEndpointsMerged { get; set; }

  /// <summary>
  /// Number of endpoints successfully verified.
  /// </summary>
  public int VerifiedEndpoints { get; set; }

  /// <summary>
  /// Number of endpoints that failed verification.
  /// </summary>
  public int FailedVerification { get; set; }

  /// <summary>
  /// Number of HTTP requests performed during discovery.
  /// </summary>
  public int TotalRequests { get; set; }

  /// <summary>
  /// Total pipeline execution time.
  /// </summary>
  public TimeSpan Duration { get; set; }

  /// <summary>
  /// Time spent per discovery strategy.
  /// </summary>
  public Dictionary<string, TimeSpan> StrategyDurations { get; } = [];

  /// <summary>
  /// Number of endpoints discovered by each strategy.
  /// </summary>
  public Dictionary<string, int> StrategyResults { get; } = [];
}

/// <summary>
/// Canonical confidence scale for endpoint discovery. Every strategy MUST express
/// confidence within these bands so downstream consumers (verifier, intelligence
/// enrichment, model builder) can reason about evidence quality consistently.
///
///   95-100  Ground-truth machine-readable spec (OpenAPI/Swagger "paths" object).
///   85-94   Server-declared capability (OPTIONS Allow header, GraphQL introspection).
///   65-84   Structured client-code evidence (explicit fetch/axios/XHR call, literal URL).
///   45-64   Declarative site metadata (sitemap URL entries, robots.txt Sitemap chain).
///   25-44   Unstructured document evidence (HTML anchor/form actions, loose JS literals).
///   10-24   Heuristic probed evidence that survived soft-404 differential checks.
///   0-9     Informational-only — carries no positive existence signal (e.g. blocked
///           GraphQL introspection notice). MUST NOT be surfaced as a real endpoint.
/// </summary>
public static class DiscoveryConfidence
{
  public const double OpenApiPathDeclared = 98.0;
  public const double OpenApiPathDeclaredWithMethods = 99.0;

  public const double GraphQlIntrospectionField = 92.0;
  public const double GraphQlEndpointConfirmedNoIntrospection = 55.0;
  public const double GraphQlIntrospectionBlockedInformational = 0.0;

  public const double SitemapUrlEntry = 55.0;
  public const double RobotsSitemapDirectiveChain = 50.0;
  public const double RobotsDisallowHint = 30.0;

  public const double JsStructuredCallLiteral = 75.0;
  public const double JsGenericPathStringFallback = 30.0;

  public const double HtmlFormAction = 40.0;
  public const double HtmlAnchorApiLikeHref = 25.0;

  public const double CommonRouteDistinctSignalHigh = 20.0;
  public const double CommonRouteDistinctSignalLow = 12.0;

  public const double DocsRenderedSpecPath = 96.0;
  public const double DocsRenderedSpecPathWithMethods = 97.0;

  public const double DocsUnstructuredCodeBlockHint = 35.0;
}

public sealed class PipelineStageResult
{
  public required string StageName { get; init; }
  public required bool Success { get; init; }
  public required string Message { get; init; }
  public string? ErrorDetail { get; init; }
  public TimeSpan Duration { get; init; }

  public static PipelineStageResult Ok(string stageName, string message, TimeSpan duration) =>
      new() { StageName = stageName, Success = true, Message = message, Duration = duration };

  public static PipelineStageResult Fail(string stageName, string message, string? errorDetail, TimeSpan duration) =>
      new() { StageName = stageName, Success = false, Message = message, ErrorDetail = errorDetail, Duration = duration };
}

/// <summary>
/// Well-known keys written into VerifiedEndpoint.Metadata / DiscoveredEndpoint.Metadata.
/// Centralized so verifier/detector/intelligence/builder don't drift on magic strings.
/// </summary>
public static class EndpointMetadataKeys
{
  public const string VerificationMethod = "verification.method";
  public const string ObservedContentType = "verification.content_type";
  public const string WwwAuthenticateHeader = "verification.www_authenticate";
  public const string OptionsAllowHeader = "method_detection.options_allow";

  public const string AuthenticationRequired = "intelligence.auth.required";
  public const string AuthenticationScheme = "intelligence.auth.scheme";
  public const string ApiVersion = "intelligence.version";
  public const string PathParameters = "intelligence.path_parameters";
  public const string Classification = "intelligence.classification";
}

public sealed class DiscoveredEndpoint
{
  public required string Path { get; init; }
  public required double FinalConfidence { get; init; }
  public required IReadOnlyList<HttpMethod> SupportedMethods { get; init; }
  public required IReadOnlyList<EndpointEvidence> Evidence { get; init; }
  public required EndpointClassification Classification { get; init; }
  public IReadOnlyDictionary<string, object> Metadata { get; init; } = new Dictionary<string, object>();
  public DateTimeOffset DiscoveredAt { get; init; }
  public DateTimeOffset VerifiedAt { get; init; }
}

public sealed class EndpointDiscoveryResult
{
  public required Uri Website { get; init; }
  public required PipelineStatus Status { get; init; }
  public required IReadOnlyList<DiscoveredEndpoint> Endpoints { get; init; }
  public required DiscoveryStatistics Statistics { get; init; }
  public required IReadOnlyList<PipelineStageResult> StageResults { get; init; }
  public string? FailureReason { get; init; }
  public DateTimeOffset CompletedAt { get; init; } = DateTimeOffset.UtcNow;
}