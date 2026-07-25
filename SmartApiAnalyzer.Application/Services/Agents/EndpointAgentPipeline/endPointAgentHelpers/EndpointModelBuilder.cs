using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;

namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointAgentPipeline;

public sealed class EndpointModelBuilder : IEndpointModelBuilder
{
  private readonly ILogger<EndpointModelBuilder> _logger;

  public EndpointModelBuilder(ILogger<EndpointModelBuilder> logger)
  {
    _logger = logger;
  }

  public Task<EndpointDiscoveryResult> BuildAsync(
      EndpointPipelineContext context,
      PipelineStatus status,
      IReadOnlyList<PipelineStageResult> stageResults,
      string? failureReason,
      CancellationToken cancellationToken)
  {
    try
    {
      cancellationToken.ThrowIfCancellationRequested();

      var endpoints = context.VerifiedEndpoints
          .Where(e => e.IsVerified)
          .Select(BuildDiscoveredEndpoint)
          .OrderBy(e => e.Path, StringComparer.OrdinalIgnoreCase)
          .ToList();

      context.Statistics.CandidateEndpointsFound = context.Candidates.Count;

      var result = new EndpointDiscoveryResult
      {
        Website = context.Website,
        Status = status,
        Endpoints = endpoints,
        Statistics = context.Statistics,
        StageResults = stageResults,
        FailureReason = failureReason,
      };

      return Task.FromResult(result);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to build final endpoint discovery model for {Website}.", context.Website);
      return Task.FromResult(new EndpointDiscoveryResult
      {
        Website = context.Website,
        Status = PipelineStatus.Failed,
        Endpoints = [],
        Statistics = context.Statistics,
        StageResults = stageResults,
        FailureReason = $"Model building failed: {ex.Message}",
      });
    }
  }

  private static DiscoveredEndpoint BuildDiscoveredEndpoint(VerifiedEndpoint endpoint)
  {
    endpoint.Metadata.TryGetValue(EndpointMetadataKeys.Classification, out var classificationObj);

    return new DiscoveredEndpoint
    {
      Path = endpoint.Path,
      FinalConfidence = endpoint.Confidence,
      SupportedMethods = endpoint.SupportedMethods.Count > 0
            ? endpoint.SupportedMethods.ToList()
            : [HttpMethod.Get], // conservative default — it was confirmed reachable via GET during verification
      Evidence = endpoint.Evidence,
      Classification = classificationObj as EndpointClassification? ?? EndpointClassification.Unknown,
      Metadata = endpoint.Metadata,
      DiscoveredAt = endpoint.DiscoveredAt,
      VerifiedAt = endpoint.VerifiedAt,
    };
  }
}