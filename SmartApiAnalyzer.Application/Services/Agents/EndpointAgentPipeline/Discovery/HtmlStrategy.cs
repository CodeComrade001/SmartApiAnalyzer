using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Domain.Constants;

public sealed partial class HtmlStrategy : IDiscoveryStrategy
{
  private const int MaxHtmlBytes = 3 * 1024 * 1024;

  [GeneratedRegex("""href\s*=\s*["']([^"'#][^"']*)["']""", RegexOptions.IgnoreCase)]
  private static partial Regex HrefRegexImpl();

  [GeneratedRegex("""<form[^>]*\baction\s*=\s*["']([^"']*)["']""", RegexOptions.IgnoreCase)]
  private static partial Regex FormActionRegexImpl();

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<HtmlStrategy> _logger;

  public HtmlStrategy(IHttpClientFactory httpClientFactory, ILogger<HtmlStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public string Name => DiscoveryStrategyType.Html__Strategy.ToSystemName();
  public int Priority => (int)DiscoveryStrategyType.Html__Strategy;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var results = new List<CandidateEndpoint>();
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);

    string html;
    try
    {
      using var response = await client.GetAsync(baseUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
      if (!response.IsSuccessStatusCode) return results;

      var contentType = response.Content.Headers.ContentType?.MediaType;
      if (contentType is not null && !contentType.Contains("html", StringComparison.OrdinalIgnoreCase))
        return results;

      await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
      using var limitedStream = new MaxLengthStream(stream, MaxHtmlBytes);
      using var reader = new StreamReader(limitedStream);
      html = await reader.ReadToEndAsync(cancellationToken);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException)
    {
      _logger.LogDebug(ex, "HTML fetch failed for {Uri}", baseUrl);
      return results;
    }

    var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    foreach (Match match in HrefRegexImpl().Matches(html))
      AddIfApiLike(match.Groups[1].Value, "anchor href", DiscoveryConfidence.HtmlAnchorApiLikeHref, results, seen, baseUrl);

    foreach (Match match in FormActionRegexImpl().Matches(html))
      AddIfApiLike(match.Groups[1].Value, "form action", DiscoveryConfidence.HtmlFormAction, results, seen, baseUrl);

    return results;
  }

  private void AddIfApiLike(
      string rawValue, string sourceKind, double confidence,
      List<CandidateEndpoint> results, HashSet<string> seen, Uri baseUrl)
  {
    if (string.IsNullOrWhiteSpace(rawValue)) return;
    if (rawValue.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase)) return;
    if (rawValue.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase)) return;
    if (rawValue.StartsWith("tel:", StringComparison.OrdinalIgnoreCase)) return;

    string absolutePath;
    if (Uri.TryCreate(rawValue, UriKind.Absolute, out var absoluteUri))
    {
      if (!string.Equals(absoluteUri.Host, baseUrl.Host, StringComparison.OrdinalIgnoreCase)) return;
      absolutePath = absoluteUri.AbsolutePath;
    }
    else if (rawValue.StartsWith('/'))
    {
      absolutePath = rawValue;
    }
    else
    {
      return; // Page-relative paths need DOM <base> resolution we don't have here — skip rather than guess.
    }

    var normalized = EndpointPathNormalizer.Normalize(absolutePath);
    if (normalized == "/" || EndpointPathNormalizer.LooksLikeStaticAsset(normalized)) return;
    if (!seen.Add(normalized)) return;

    var candidate = new CandidateEndpoint
    {
      Path = normalized,
      DiscoverySource = Name,
      Confidence = confidence,
    };
    candidate.Evidence.Add(new EndpointEvidence
    {
      Source = Name,
      Description = $"Path referenced by {sourceKind} in root HTML document.",
      Value = rawValue,
      Confidence = confidence,
    });
    results.Add(candidate);
  }
}