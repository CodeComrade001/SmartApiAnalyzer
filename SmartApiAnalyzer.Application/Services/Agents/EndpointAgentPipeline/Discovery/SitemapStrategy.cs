using System.Xml;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Domain.Constants;

public sealed class SitemapStrategy : IDiscoveryStrategy
{
  private static readonly string[] DefaultSitemapPaths =
  [
      "/sitemap.xml",
        "/sitemap_index.xml",
        "/sitemap/sitemap.xml",
    ];

  private const int MaxUrlEntriesPerSitemap = 2000;

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<SitemapStrategy> _logger;

  public SitemapStrategy(IHttpClientFactory httpClientFactory, ILogger<SitemapStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public string Name => DiscoveryStrategyType.Sitemap_Strategy.ToSystemName();
  public int Priority => (int)DiscoveryStrategyType.Sitemap_Strategy;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);
    var results = new List<CandidateEndpoint>();

    foreach (var path in DefaultSitemapPaths)
    {
      cancellationToken.ThrowIfCancellationRequested();
      var sitemapUri = new Uri(baseUrl, path);

      XDocument xml;
      try
      {
        using var response = await client.GetAsync(sitemapUri, cancellationToken);
        if (!response.IsSuccessStatusCode) continue;

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        xml = await XDocument.LoadAsync(stream, LoadOptions.None, cancellationToken);
      }
      catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or XmlException)
      {
        _logger.LogDebug(ex, "Sitemap probe failed for {Uri}", sitemapUri);
        continue;
      }

      var ns = xml.Root?.Name.Namespace ?? XNamespace.None;
      var locElements = xml.Descendants(ns + "loc").Take(MaxUrlEntriesPerSitemap);

      foreach (var locElement in locElements)
      {
        var locValue = locElement.Value.Trim();
        if (!Uri.TryCreate(locValue, UriKind.Absolute, out var entryUri)) continue;
        if (!string.Equals(entryUri.Host, baseUrl.Host, StringComparison.OrdinalIgnoreCase)) continue;

        var normalized = EndpointPathNormalizer.Normalize(entryUri.AbsolutePath);
        if (normalized == "/" || EndpointPathNormalizer.LooksLikeStaticAsset(normalized)) continue;

        var candidate = new CandidateEndpoint
        {
          Path = normalized,
          DiscoverySource = Name,
          Confidence = DiscoveryConfidence.SitemapUrlEntry,
        };
        candidate.Evidence.Add(new EndpointEvidence
        {
          Source = Name,
          Description = "URL entry found in default-location sitemap.",
          Value = sitemapUri.ToString(),
          Confidence = DiscoveryConfidence.SitemapUrlEntry,
        });
        results.Add(candidate);
      }

      // A valid sitemap at a default location is enough; stop probing further locations.
      return results;
    }

    return results;
  }
}