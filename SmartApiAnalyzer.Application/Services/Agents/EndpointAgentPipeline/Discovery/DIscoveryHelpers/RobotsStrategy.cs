using System.Xml;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;
using SmartApiAnalyzer.Domain.Enums;

public sealed class RobotsStrategy : IDiscoveryStrategy
{
  private const int MaxSitemapDepth = 2;
  private const int MaxSitemapFilesToFetch = 10;
  private const int MaxUrlEntriesPerSitemap = 2000;

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<RobotsStrategy> _logger;

  public RobotsStrategy(IHttpClientFactory httpClientFactory, ILogger<RobotsStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public DiscoveryStrategiesNames Name => DiscoveryStrategiesNames.Robots__Strategy;
  public int Priority => 1;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);
    var results = new List<CandidateEndpoint>();

    string? robotsContent;
    var robotsUri = new Uri(baseUrl, "/robots.txt");

    try
    {
      using var response = await client.GetAsync(robotsUri, cancellationToken);
      if (!response.IsSuccessStatusCode) return results;
      robotsContent = await response.Content.ReadAsStringAsync(cancellationToken);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
    {
      _logger.LogDebug(ex, "robots.txt fetch failed for {Uri}", robotsUri);
      return results;
    }

    if (string.IsNullOrWhiteSpace(robotsContent)) return results;

    var sitemapUrls = new List<string>();

    foreach (var rawLine in robotsContent.Split('\n'))
    {
      var line = rawLine.Trim();
      if (line.Length == 0 || line.StartsWith('#')) continue;

      var separatorIndex = line.IndexOf(':');
      if (separatorIndex < 0) continue;

      var directive = line[..separatorIndex].Trim();
      var value = line[(separatorIndex + 1)..].Trim();
      if (value.Length == 0) continue;

      if (directive.Equals("Sitemap", StringComparison.OrdinalIgnoreCase))
      {
        sitemapUrls.Add(value);
        continue;
      }

      if (directive.Equals("Disallow", StringComparison.OrdinalIgnoreCase) ||
          directive.Equals("Allow", StringComparison.OrdinalIgnoreCase))
      {
        if (!value.StartsWith('/') || value.Contains('*')) continue;
        if (EndpointPathNormalizer.LooksLikeStaticAsset(value)) continue;

        var normalized = EndpointPathNormalizer.Normalize(value);
        if (normalized == "/") continue;

        var candidate = new CandidateEndpoint
        {
          Path = normalized,
          DiscoverySource = Name,
          Confidence = DiscoveryConfidence.RobotsDisallowHint,
        };
        candidate.Evidence.Add(new EndpointEvidence
        {
          Source = Name,
          Description = $"Path referenced via robots.txt '{directive}' directive.",
          Value = value,
          Confidence = DiscoveryConfidence.RobotsDisallowHint,
        });
        results.Add(candidate);
      }
    }

    if (sitemapUrls.Count == 0) return results;

    var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    var queue = new Queue<(string Url, int Depth)>();
    foreach (var url in sitemapUrls.Distinct(StringComparer.OrdinalIgnoreCase))
      queue.Enqueue((url, 0));

    var fetchedCount = 0;

    while (queue.Count > 0 && fetchedCount < MaxSitemapFilesToFetch)
    {
      cancellationToken.ThrowIfCancellationRequested();
      var (url, depth) = queue.Dequeue();

      if (!visited.Add(url)) continue;
      if (depth > MaxSitemapDepth) continue;
      if (!Uri.TryCreate(url, UriKind.Absolute, out var sitemapUri)) continue;
      if (!string.Equals(sitemapUri.Host, baseUrl.Host, StringComparison.OrdinalIgnoreCase)) continue;

      fetchedCount++;

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
        _logger.LogDebug(ex, "Sitemap fetch/parse failed for {Uri}", sitemapUri);
        continue;
      }

      var ns = xml.Root?.Name.Namespace ?? XNamespace.None;
      var isSitemapIndex = xml.Root?.Name.LocalName.Equals("sitemapindex", StringComparison.OrdinalIgnoreCase) == true;
      var locElements = xml.Descendants(ns + "loc").Take(MaxUrlEntriesPerSitemap);

      foreach (var locElement in locElements)
      {
        var locValue = locElement.Value.Trim();
        if (locValue.Length == 0) continue;

        if (isSitemapIndex)
        {
          queue.Enqueue((locValue, depth + 1));
          continue;
        }

        if (!Uri.TryCreate(locValue, UriKind.Absolute, out var entryUri)) continue;
        if (!string.Equals(entryUri.Host, baseUrl.Host, StringComparison.OrdinalIgnoreCase)) continue;

        var normalized = EndpointPathNormalizer.Normalize(entryUri.AbsolutePath);
        if (normalized == "/" || EndpointPathNormalizer.LooksLikeStaticAsset(normalized)) continue;

        var candidate = new CandidateEndpoint
        {
          Path = normalized,
          DiscoverySource = Name,
          Confidence = DiscoveryConfidence.RobotsSitemapDirectiveChain,
        };
        candidate.Evidence.Add(new EndpointEvidence
        {
          Source = Name,
          Description = "URL entry found in sitemap referenced by robots.txt.",
          Value = sitemapUri.ToString(),
          Confidence = DiscoveryConfidence.RobotsSitemapDirectiveChain,
        });
        results.Add(candidate);
      }
    }

    return results;
  }
}