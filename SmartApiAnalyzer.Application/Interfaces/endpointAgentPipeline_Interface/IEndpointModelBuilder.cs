using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

namespace SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;

public interface IEndpointModelBuilder
{
  Task<EndpointDiscoveryResult> BuildAsync(
       EndpointPipelineContext context,
       PipelineStatus status,
       IReadOnlyList<PipelineStageResult> stageResults,
       string? failureReason,
       CancellationToken cancellationToken);
}