using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

namespace SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;

public interface IEndpointVerifier
{
  Task<PipelineStageResult> VerifyAsync(EndpointPipelineContext context, CancellationToken cancellationToken);
}