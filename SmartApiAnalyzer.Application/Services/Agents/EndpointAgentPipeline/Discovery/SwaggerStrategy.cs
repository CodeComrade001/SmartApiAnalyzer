using System.Text.Json;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

public sealed class SwaggerStrategy : IDiscoveryStrategy
{
  private static readonly string[] CandidatePaths =
  [
      "/swagger/v1/swagger.json",
        "/swagger/v2/swagger.json",
        "/swagger.json",
        "/openapi.json",
        "/openapi/v1.json",
        "/v3/api-docs",
        "/v2/api-docs",
        "/api-docs",
        "/api-docs.json",
        "/.well-known/openapi.json",
    ];

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<SwaggerStrategy> _logger;

  public SwaggerStrategy(IHttpClientFactory httpClientFactory, ILogger<SwaggerStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public string Name => DiscoveryStrategyType.Swagger__Strategy.ToSystemName();
  public int Priority => (int)DiscoveryStrategyType.Swagger__Strategy;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);
    var results = new List<CandidateEndpoint>();

    foreach (var candidatePath in CandidatePaths)
    {
      cancellationToken.ThrowIfCancellationRequested();

      Uri specUri;
      try
      {
        specUri = new Uri(baseUrl, candidatePath);
      }
      catch (UriFormatException)
      {
        continue;
      }

      JsonDocument document;
      try
      {
        using var response = await client.GetAsync(specUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode) continue;

        var mediaType = response.Content.Headers.ContentType?.MediaType;
        if (mediaType is not null && !mediaType.Contains("json", StringComparison.OrdinalIgnoreCase))
          continue;

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
      }
      catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
      {
        _logger.LogDebug(ex, "Swagger probe failed for {Uri}", specUri);
        continue;
      }

      using (document)
      {
        var root = document.RootElement;
        var isOpenApiFamily = root.TryGetProperty("swagger", out _) || root.TryGetProperty("openapi", out _);

        if (!isOpenApiFamily ||
            !root.TryGetProperty("paths", out var pathsElement) ||
            pathsElement.ValueKind != JsonValueKind.Object)
        {
          continue;
        }

        foreach (var pathProperty in pathsElement.EnumerateObject())
        {
          var normalizedPath = EndpointPathNormalizer.Normalize(pathProperty.Name);
          var methods = ExtractMethods(pathProperty.Value);

          var candidate = new CandidateEndpoint
          {
            Path = normalizedPath,
            DiscoverySource = Name,
            Confidence = methods.Count > 0
                  ? DiscoveryConfidence.OpenApiPathDeclaredWithMethods
                  : DiscoveryConfidence.OpenApiPathDeclared,
          };

          candidate.Evidence.Add(new EndpointEvidence
          {
            Source = Name,
            Description = "Path declared in OpenAPI/Swagger specification.",
            Value = specUri.ToString(),
            Confidence = candidate.Confidence,
          });

          if (methods.Count > 0)
          {
            candidate.Evidence.Add(new EndpointEvidence
            {
              Source = Name,
              Description = $"HTTP methods declared in specification: {string.Join(", ", methods)}.",
              Value = string.Join(",", methods),
              Confidence = candidate.Confidence,
            });
          }

          results.Add(candidate);
        }

        // First valid, parseable spec wins — no need to probe remaining locations.
        return results;
      }
    }

    return results;
  }

  private static List<string> ExtractMethods(JsonElement pathItem)
  {
    if (pathItem.ValueKind != JsonValueKind.Object) return [];

    string[] httpVerbs = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
    var found = new List<string>();

    foreach (var verb in httpVerbs)
    {
      if (pathItem.TryGetProperty(verb, out _)) found.Add(verb.ToUpperInvariant());
    }

    return found;
  }
}