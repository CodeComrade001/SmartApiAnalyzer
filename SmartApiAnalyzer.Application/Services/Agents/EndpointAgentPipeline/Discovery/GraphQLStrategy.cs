using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;
using SmartApiAnalyzer.Domain.Constants;

public sealed class GraphQLStrategy : IDiscoveryStrategy
{
  /// <summary>Evidence.Source marker your frontend should check for to render the "not authorized" state.</summary>
  public const string IntrospectionBlockedEvidenceSource = "GraphQLIntrospectionBlocked";

  public const string IntrospectionBlockedMessage =
      "GraphQL introspection is disabled or access is restricted for this endpoint. " +
      "SmartApiAnalyzer could not enumerate the schema. If you are the API owner, allow access for the " +
      "scanning source (IP address / API key) to enable full schema discovery.";

  private static readonly string[] CandidatePaths = ["/graphql", "/api/graphql", "/graphql/v1", "/v1/graphql"];

  private const string IntrospectionQuery =
      """{"query":"query IntrospectionCheck { __schema { queryType { name } types { name } } }"}""";

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<GraphQLStrategy> _logger;

  public GraphQLStrategy(IHttpClientFactory httpClientFactory, ILogger<GraphQLStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }


  public string Name => DiscoveryStrategyType.GraphQL___Strategy.ToSystemName();
  public int Priority => (int)DiscoveryStrategyType.GraphQL___Strategy;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);
    var results = new List<CandidateEndpoint>();

    foreach (var path in CandidatePaths)
    {
      cancellationToken.ThrowIfCancellationRequested();
      var endpointUri = new Uri(baseUrl, path);

      HttpResponseMessage response;
      try
      {
        using var request = new HttpRequestMessage(HttpMethod.Post, endpointUri)
        {
          Content = new StringContent(IntrospectionQuery, Encoding.UTF8, "application/json"),
        };
        response = await client.SendAsync(request, cancellationToken);
      }
      catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
      {
        _logger.LogDebug(ex, "GraphQL probe failed for {Uri}", endpointUri);
        continue;
      }

      using (response)
      {
        var contentType = response.Content.Headers.ContentType?.MediaType;
        if (contentType is null || !contentType.Contains("json", StringComparison.OrdinalIgnoreCase))
          continue;

        string body;
        try { body = await response.Content.ReadAsStringAsync(cancellationToken); }
        catch (IOException) { continue; }

        JsonDocument document;
        try { document = JsonDocument.Parse(body); }
        catch (JsonException) { continue; }

        using (document)
        {
          var root = document.RootElement;
          var hasDataProperty = root.TryGetProperty("data", out var dataElement);
          var hasErrorsProperty = root.TryGetProperty("errors", out _);

          if (!hasDataProperty && !hasErrorsProperty)
            continue; // Not GraphQL-shaped — not a GraphQL endpoint.

          var normalizedPath = EndpointPathNormalizer.Normalize(path);

          var schemaExposed = hasDataProperty &&
              dataElement.ValueKind == JsonValueKind.Object &&
              dataElement.TryGetProperty("__schema", out var schemaElement) &&
              schemaElement.ValueKind == JsonValueKind.Object;

          if (schemaExposed)
          {
            var candidate = new CandidateEndpoint
            {
              Path = normalizedPath,
              DiscoverySource = Name,
              Confidence = DiscoveryConfidence.GraphQlIntrospectionField,
            };
            candidate.Evidence.Add(new EndpointEvidence
            {
              Source = Name,
              Description = "GraphQL introspection query succeeded; schema is exposed.",
              Value = endpointUri.ToString(),
              Confidence = DiscoveryConfidence.GraphQlIntrospectionField,
            });
            results.Add(candidate);
            return results;
          }

          // GraphQL-shaped endpoint confirmed, but no schema returned — likely introspection
          // disabled. Surface both a low-confidence candidate AND a zero-confidence
          // informational evidence entry carrying the frontend fallback message.
          var blockedCandidate = new CandidateEndpoint
          {
            Path = normalizedPath,
            DiscoverySource = Name,
            Confidence = DiscoveryConfidence.GraphQlEndpointConfirmedNoIntrospection,
          };
          blockedCandidate.Evidence.Add(new EndpointEvidence
          {
            Source = Name,
            Description = "GraphQL-shaped endpoint responded, but no schema data was returned.",
            Value = endpointUri.ToString(),
            Confidence = DiscoveryConfidence.GraphQlEndpointConfirmedNoIntrospection,
          });
          blockedCandidate.Evidence.Add(new EndpointEvidence
          {
            Source = Name,
            Description = IntrospectionBlockedMessage,
            Value = null,
            Confidence = DiscoveryConfidence.GraphQlIntrospectionBlockedInformational,
          });
          results.Add(blockedCandidate);
        }
      }
    }

    return results;
  }
}