using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointAgentPipeline;

public sealed partial class EndpointIntelligence : IEndpointIntelligence
{
  [GeneratedRegex(@"/v(\d+(?:\.\d+)?)/", RegexOptions.IgnoreCase)]
  private static partial Regex VersionRegex();

  [GeneratedRegex(@"\{([^/}]+)\}")]
  private static partial Regex PathParamRegex();

  private readonly ILogger<EndpointIntelligence> _logger;

  public EndpointIntelligence(ILogger<EndpointIntelligence> logger)
  {
    _logger = logger;
  }

  public Task<PipelineStageResult> EnrichAsync(EndpointPipelineContext context, CancellationToken cancellationToken)
  {
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
    const string stageName = "EndpointIntelligence";

    try
    {
      cancellationToken.ThrowIfCancellationRequested();

      var verified = context.VerifiedEndpoints.Where(e => e.IsVerified).ToList();
      foreach (var endpoint in verified)
      {
        cancellationToken.ThrowIfCancellationRequested();
        EnrichAuthentication(endpoint);
        EnrichVersion(endpoint);
        EnrichPathParameters(endpoint);
        EnrichClassification(endpoint);
      }

      return Task.FromResult(PipelineStageResult.Ok(stageName, $"Enriched {verified.Count} endpoint(s).", stopwatch.Elapsed));
    }
    catch (OperationCanceledException)
    {
      throw;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Endpoint intelligence stage failed unexpectedly.");
      return Task.FromResult(PipelineStageResult.Fail(stageName, "Enrichment failed due to an unexpected error.", ex.Message, stopwatch.Elapsed));
    }
  }

  private static void EnrichAuthentication(VerifiedEndpoint endpoint)
  {
    var hasWwwAuthenticate = endpoint.Metadata.TryGetValue(EndpointMetadataKeys.WwwAuthenticateHeader, out var authHeader) && authHeader is string;
    var requiresAuth = endpoint.StatusCode is 401 or 403 || hasWwwAuthenticate;

    endpoint.Metadata[EndpointMetadataKeys.AuthenticationRequired] = requiresAuth;

    if (hasWwwAuthenticate && authHeader is string headerValue)
    {
      var scheme = headerValue.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "Unknown";
      endpoint.Metadata[EndpointMetadataKeys.AuthenticationScheme] = scheme;
    }
    else if (requiresAuth)
    {
      endpoint.Metadata[EndpointMetadataKeys.AuthenticationScheme] = "Unknown";
    }
  }

  private static void EnrichVersion(VerifiedEndpoint endpoint)
  {
    var match = VersionRegex().Match(endpoint.Path);
    if (match.Success)
      endpoint.Metadata[EndpointMetadataKeys.ApiVersion] = match.Groups[1].Value;
  }

  private static void EnrichPathParameters(VerifiedEndpoint endpoint)
  {
    var parameters = PathParamRegex().Matches(endpoint.Path).Select(m => m.Groups[1].Value).ToList();
    if (parameters.Count > 0)
      endpoint.Metadata[EndpointMetadataKeys.PathParameters] = parameters;
  }

  private static void EnrichClassification(VerifiedEndpoint endpoint)
  {
    var path = endpoint.Path.ToLowerInvariant();

    var classification = path switch
    {
      _ when path.Contains("graphql") => EndpointClassification.GraphQl,
      _ when path.Contains("health") || path.Contains("status") || path.Contains("ping") => EndpointClassification.HealthCheck,
      _ when path.Contains("swagger") || path.Contains("openapi") || path.Contains("api-docs") || path.Contains("docs") => EndpointClassification.Documentation,
      _ when path.Contains("auth") || path.Contains("login") || path.Contains("token") || path.Contains("oauth") => EndpointClassification.Authentication,
      _ => EndpointClassification.RestResource,
    };

    endpoint.Metadata[EndpointMetadataKeys.Classification] = classification;
  }
}