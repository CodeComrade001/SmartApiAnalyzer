using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

namespace SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;


public interface IEndpointIntelligence
{
  Task<PipelineStageResult> EnrichAsync(EndpointPipelineContext context, CancellationToken cancellationToken);
}
