// SmartApiAnalyzer.Infrastructure/Agents/EndpointDiscovery/Shared/DiscoveryHttpClient.cs
namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

/// <summary>
/// Named HttpClient key used by every discovery strategy. Register this once in DI:
///
/// services.AddHttpClient(DiscoveryHttpClient.Name, client =>
/// {
///     client.Timeout = TimeSpan.FromSeconds(10);
///     client.DefaultRequestHeaders.UserAgent.ParseAdd("SmartApiAnalyzer-Discovery/1.0");
/// }).SetHandlerLifetime(TimeSpan.FromMinutes(5));
///
/// NOTE: No Polly retry/circuit-breaker policy is attached here. At scale, scanning
/// many targets concurrently without a circuit breaker risks hammering a slow/dead
/// target across every strategy simultaneously. If this becomes a multi-tenant scanning
/// workload, add Microsoft.Extensions.Http.Resilience here — flagging this as a gap,
/// not silently fixing it since it's a dependency decision.
/// </summary>
internal static class DiscoveryHttpClient
{
  public const string Name = "EndpointDiscovery";
}