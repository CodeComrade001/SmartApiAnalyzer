using SmartApiAnalyzer.Application.Services.Interface.Agent.Web;
using System.Net.Http.Headers;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class EndpointDiscoveryService : IEndpointDiscoveryService
{
  private static readonly HttpClient _httpClient = new HttpClient
  {
    Timeout = TimeSpan.FromSeconds(3)
  };

  private static readonly string[] CommonEndpoints =
  [
      "/",
        "/api",
        "/api/v1",
        "/health",
        "/status",
        "/swagger",
        "/swagger/index.html",
        "/openapi.json",
        "/docs",
        "/auth",
        "/login",
        "/register"
  ];

  public async Task<IReadOnlyCollection<string>> DiscoverAsync(
      Uri baseUri,
      CancellationToken ct)
  {
    ct.ThrowIfCancellationRequested();

    var found = new List<string>();

    foreach (var endpoint in CommonEndpoints)
    {
      ct.ThrowIfCancellationRequested();

      var fullUrl = new Uri(baseUri, endpoint);

      try
      {
        using var request = new HttpRequestMessage(HttpMethod.Head, fullUrl);
        request.Headers.UserAgent.Add(
            new ProductInfoHeaderValue("SmartApiAnalyzer", "1.0"));

        using var response = await _httpClient.SendAsync(request, ct);

        if (response.IsSuccessStatusCode ||
            response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed)
        {
          found.Add(endpoint);
        }
      }
      catch
      {
        // ignore failures (production-safe probing behavior)
      }
    }

    // Always ensure root exists
    if (!found.Contains("/"))
      found.Add("/");

    return found.Distinct().ToList();
  }
}