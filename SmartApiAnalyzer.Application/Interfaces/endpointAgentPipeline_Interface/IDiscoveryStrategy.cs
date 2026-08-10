
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;

namespace SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;


public interface IDiscoveryStrategy
{
  string Name { get; }

  int Priority { get; }

  Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(
      Uri baseUrl,
      CancellationToken cancellationToken);
}