using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;

namespace SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;

public interface IMethodDetector
{
  Task<PipelineStageResult> DetectAsync(EndpointPipelineContext context, CancellationToken cancellationToken);
}