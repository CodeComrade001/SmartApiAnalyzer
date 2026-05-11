
using SmartApiAnalyzer.Application.Services.Interface.Agent.Web;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class EndpointDiscoveryService : IEndpointDiscoveryService
{
  public Task<IReadOnlyCollection<string>> DiscoverAsync(Uri baseUri, CancellationToken ct)
  {
    throw new NotImplementedException();
  }
}