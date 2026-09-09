using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

public sealed partial class DocsStrategy : IDiscoveryStrategy
{
  // Reasonable default set of docs-page conventions. Treat as a config extension point
  // (IOptions<T>) later if ops needs to tune per-environment — same call I flagged on
  // CommonRouteStrategy's wordlist.
  private static readonly string[] CandidateDocsPaths =
  [
      "/docs",
        "/documentation",
        "/api-reference",
        "/api/docs",
        "/reference",
        "/redoc",
    ];

  private const int MaxHtmlBytes = 3 * 1024 * 1024;
  private const int MaxCodeBlockMatches = 200;

  // --- Renderer fingerprints -------------------------------------------------
  // Each targets the specific embed pattern that renderer uses to declare its spec source.
  // These are NOT generic "find any URL" patterns — a false match here means silently
  // fetching the wrong resource as if it were an authoritative spec.

  [GeneratedRegex("""<redoc\b[^>]*\bspec-url\s*=\s*['"]([^'"]+)['"]""", RegexOptions.IgnoreCase)]
  private static partial Regex RedocSpecUrlRegex();

  [GeneratedRegex("""SwaggerUIBundle\s*\(\s*\{[^}]*?\burl\s*:\s*['"]([^'"]+)['"]""", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
  private static partial Regex SwaggerUiSpecUrlRegex();

  [GeneratedRegex("""<elements-api\b[^>]*\bapiDescriptionUrl\s*=\s*['"]([^'"]+)['"]""", RegexOptions.IgnoreCase)]
  private static partial Regex StoplightSpecUrlRegex();

  [GeneratedRegex("""<script[^>]+\bid\s*=\s*['"]api-reference['"][^>]*\bdata-url\s*=\s*['"]([^'"]+)['"]""", RegexOptions.IgnoreCase)]
  private static partial Regex ScalarDataAttributeRegex();

  [GeneratedRegex("""Scalar\.createApiReference\s*\([^,]+,\s*\{[^}]*?\burl\s*:\s*['"]([^'"]+)['"]""", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
  private static partial Regex ScalarInitCallRegex();

  // Fallback for renderer-less static docs (Docusaurus/GitBook/Slate/ReadMe.io style):
  // path-like literals inside code blocks only — never free text, to keep noise down.
  private static readonly Regex CodeBlockPathRegex = new Regex(
    "<(?:code|pre)[^>]*>\\s*(?:[A-Z]{3,7}\\s+)?(\\/(?:api|v[0-9]+)[a-zA-Z0-9_\\-\\/.:{}]*)",
    RegexOptions.IgnoreCase | RegexOptions.Compiled
  );

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<DocsStrategy> _logger;

  public DocsStrategy(IHttpClientFactory httpClientFactory, ILogger<DocsStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public string Name => DiscoveryStrategyType.Doc__Strategy.ToSystemName();

  // Elevated to match SwaggerStrategy's tier: once the embedded spec-url is reso
  public int Priority => (int)DiscoveryStrategyType.Doc__Strategy;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);

    foreach (var docsPath in CandidateDocsPaths)
    {
      cancellationToken.ThrowIfCancellationRequested();

      var docsUri = new Uri(baseUrl, docsPath);
      var html = await FetchHtmlAsync(client, docsUri, cancellationToken);
      if (html is null) continue;

      var specUrl = DetectRendererSpecUrl(html);
      if (specUrl is not null)
      {
        var resolvedSpecUri = ResolveSpecUri(specUrl, docsUri);
        if (resolvedSpecUri is not null)
        {
          var specResults = await TryExtractFromSpecAsync(client, resolvedSpecUri, docsUri, cancellationToken);
          if (specResults is { Count: > 0 })
            return specResults; // Authoritative spec found — no need to keep probing other docs paths.
        }
      }

      // No renderer recognized (or its spec didn't resolve/parse) — fall back to
      // low-confidence text mining rather than giving up on this docs page entirely.
      var fallbackResults = ExtractFromCodeBlocks(html, docsUri, baseUrl);
      if (fallbackResults.Count > 0) return fallbackResults;
    }

    return [];
  }

  private async Task<string?> FetchHtmlAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
  {
    try
    {
      using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
      if (!response.IsSuccessStatusCode) return null;

      var contentType = response.Content.Headers.ContentType?.MediaType;
      if (contentType is not null && !contentType.Contains("html", StringComparison.OrdinalIgnoreCase))
        return null;

      await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
      using var limited = new MaxLengthStream(stream, MaxHtmlBytes);
      using var reader = new StreamReader(limited);
      return await reader.ReadToEndAsync(cancellationToken);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException)
    {
      _logger.LogDebug(ex, "Docs page fetch failed for {Uri}", uri);
      return null;
    }
  }

  private static string? DetectRendererSpecUrl(string html)
  {
    var redoc = RedocSpecUrlRegex().Match(html);
    if (redoc.Success) return redoc.Groups[1].Value;

    var swaggerUi = SwaggerUiSpecUrlRegex().Match(html);
    if (swaggerUi.Success) return swaggerUi.Groups[1].Value;

    var stoplight = StoplightSpecUrlRegex().Match(html);
    if (stoplight.Success) return stoplight.Groups[1].Value;

    var scalarAttr = ScalarDataAttributeRegex().Match(html);
    if (scalarAttr.Success) return scalarAttr.Groups[1].Value;

    var scalarInit = ScalarInitCallRegex().Match(html);
    if (scalarInit.Success) return scalarInit.Groups[1].Value;

    return null;
  }

  private static Uri? ResolveSpecUri(string specUrl, Uri docsPageUri)
  {
    if (Uri.TryCreate(specUrl, UriKind.Absolute, out var absolute)) return absolute;
    return Uri.TryCreate(docsPageUri, specUrl, out var relative) ? relative : null;
  }

  private async Task<List<CandidateEndpoint>?> TryExtractFromSpecAsync(
      HttpClient client, Uri specUri, Uri docsPageUri, CancellationToken cancellationToken)
  {
    JsonDocument document;
    try
    {
      using var response = await client.GetAsync(specUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
      if (!response.IsSuccessStatusCode) return null;

      var contentType = response.Content.Headers.ContentType?.MediaType;
      if (contentType is not null &&
          !contentType.Contains("json", StringComparison.OrdinalIgnoreCase) &&
          !contentType.Contains("yaml", StringComparison.OrdinalIgnoreCase) &&
          !contentType.Contains("yml", StringComparison.OrdinalIgnoreCase))
      {
        return null;
      }

      if (contentType is not null && contentType.Contains("yaml", StringComparison.OrdinalIgnoreCase))
      {
        // Known gap, not silently swallowed: no YAML parser dependency confirmed for
        // this project. Add YamlDotNet + parse here if your specs are commonly YAML.
        _logger.LogInformation(
            "Docs page {DocsPage} references a YAML spec at {SpecUri}; YAML parsing is not implemented, skipping.",
            docsPageUri, specUri);
        return null;
      }

      await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
      document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or IOException)
    {
      _logger.LogDebug(ex, "Spec fetch/parse failed for {Uri} (referenced by docs page {DocsPage})", specUri, docsPageUri);
      return null;
    }

    using (document)
    {
      var paths = OpenApiPathExtractor.TryExtractPaths(document.RootElement);
      if (paths is null) return null;

      var results = new List<CandidateEndpoint>();

      foreach (var (rawPath, methods) in paths)
      {
        var normalizedPath = EndpointPathNormalizer.Normalize(rawPath);
        var confidence = methods.Count > 0
            ? DiscoveryConfidence.DocsRenderedSpecPathWithMethods
            : DiscoveryConfidence.DocsRenderedSpecPath;

        var candidate = new CandidateEndpoint
        {
          Path = normalizedPath,
          DiscoverySource = Name,
          Confidence = confidence,
        };

        candidate.Evidence.Add(new EndpointEvidence
        {
          Source = Name,
          Description = $"Path declared in OpenAPI specification resolved via docs page renderer ({docsPageUri}).",
          Value = specUri.ToString(),
          Confidence = confidence,
        });

        if (methods.Count > 0)
        {
          candidate.Evidence.Add(new EndpointEvidence
          {
            Source = Name,
            Description = $"HTTP methods declared in specification: {string.Join(", ", methods)}.",
            Value = string.Join(",", methods),
            Confidence = confidence,
          });
        }

        results.Add(candidate);
      }

      return results;
    }
  }

  private List<CandidateEndpoint> ExtractFromCodeBlocks(string html, Uri docsPageUri, Uri baseUrl)
  {
    var results = new List<CandidateEndpoint>();
    var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    foreach (Match match in CodeBlockPathRegex.Matches(html).Take(MaxCodeBlockMatches))
    {
      var rawValue = match.Groups[1].Value;
      var normalized = EndpointPathNormalizer.Normalize(rawValue);

      if (normalized == "/" || EndpointPathNormalizer.LooksLikeStaticAsset(normalized)) continue;
      if (!seen.Add(normalized)) continue;

      var candidate = new CandidateEndpoint
      {
        Path = normalized,
        DiscoverySource = Name,
        Confidence = DiscoveryConfidence.DocsUnstructuredCodeBlockHint,
      };
      candidate.Evidence.Add(new EndpointEvidence
      {
        Source = Name,
        Description = "API-like path literal found in a code block on a documentation page (no machine-readable spec detected).",
        Value = $"{docsPageUri} :: {rawValue}",
        Confidence = DiscoveryConfidence.DocsUnstructuredCodeBlockHint,
      });
      results.Add(candidate);
    }

    return results;
  }
}