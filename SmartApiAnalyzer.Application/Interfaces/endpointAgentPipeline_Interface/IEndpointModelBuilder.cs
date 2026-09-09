using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;

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