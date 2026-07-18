using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;
using SmartApiAnalyzer.Domain.Enums;

public sealed partial class JavascriptStrategy : IDiscoveryStrategy
{
  private const int MaxScriptFilesToFetch = 15;
  private const long MaxBytesPerScript = 1 * 1024 * 1024;
  private const long MaxTotalScriptBytes = 5 * 1024 * 1024;

  [GeneratedRegex("""<script[^>]+src\s*=\s*["']([^"']+)["']""", RegexOptions.IgnoreCase)]
  private static partial Regex ScriptSrcRegexImpl();

  [GeneratedRegex("""<script(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script>""", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
  private static partial Regex InlineScriptRegexImpl();

  // "Structured" call-pattern extraction (option c-lite): targets the argument of a known
  // API-call function, not any string on the page. This is NOT a real AST parser — adding
  // one (Jint/Esprima.NET) would be a new dependency I'm not adding without your sign-off.
  private static readonly Regex[] StructuredCallPatterns =
  [
      new(@"fetch\s*\(\s*[`""']([^`""']+)[`""']", RegexOptions.Compiled),
        new(@"axios\.(?:get|post|put|delete|patch|head)\s*\(\s*[`""']([^`""']+)[`""']", RegexOptions.Compiled),
        new(@"axios\s*\(\s*\{[^}]*?\burl\s*:\s*[`""']([^`""']+)[`""']", RegexOptions.Compiled | RegexOptions.Singleline),
        new(@"\.open\s*\(\s*[`""'](?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)[`""']\s*,\s*[`""']([^`""']+)[`""']", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\$\.ajax\s*\(\s*\{[^}]*?\burl\s*:\s*[`""']([^`""']+)[`""']", RegexOptions.Compiled | RegexOptions.Singleline),
    ];

  // Fallback (option a), deliberately scoped to /api, /v{n}, /graphql prefixes rather than
  // any quoted string — a blind "/" scan is far too noisy for a "no rubbish" requirement.
  private static readonly Regex FallbackPathLiteralRegex =
      new("""[`"'](\/(?:api|v[0-9]+|graphql)[a-zA-Z0-9_\-\/{}.]*)[`"']""", RegexOptions.Compiled);

  private static readonly Regex TemplateInterpolationRegex = new(@"\$\{[^}]+\}", RegexOptions.Compiled);

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<JavascriptStrategy> _logger;

  public JavascriptStrategy(IHttpClientFactory httpClientFactory, ILogger<JavascriptStrategy> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public DiscoveryStrategiesNames Name => DiscoveryStrategiesNames.Javascript__Strategy;
  public int Priority => 3;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);
    var results = new List<CandidateEndpoint>();
    var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    string html;
    try
    {
      using var response = await client.GetAsync(baseUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
      if (!response.IsSuccessStatusCode) return results;
      html = await response.Content.ReadAsStringAsync(cancellationToken);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
    {
      _logger.LogDebug(ex, "Root HTML fetch failed for {Uri}", baseUrl);
      return results;
    }

    foreach (Match inlineMatch in InlineScriptRegexImpl().Matches(html))
      ExtractFromSource(inlineMatch.Groups[1].Value, "inline <script>", baseUrl, results, seen);

    var scriptUrls = ScriptSrcRegexImpl().Matches(html)
        .Select(m => m.Groups[1].Value)
        .Where(src => !src.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        .Select(src => ResolveSameOrigin(src, baseUrl))
        .Where(uri => uri is not null)
        .Cast<Uri>()
        .Distinct()
        .Take(MaxScriptFilesToFetch)
        .ToList();

    long totalBytes = 0;

    foreach (var scriptUri in scriptUrls)
    {
      if (totalBytes >= MaxTotalScriptBytes) break;
      cancellationToken.ThrowIfCancellationRequested();

      string scriptContent;
      try
      {
        using var response = await client.GetAsync(scriptUri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode) continue;

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var limited = new MaxLengthStream(stream, MaxBytesPerScript);
        using var reader = new StreamReader(limited);
        scriptContent = await reader.ReadToEndAsync(cancellationToken);
        totalBytes += scriptContent.Length;
      }
      catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException)
      {
        _logger.LogDebug(ex, "Script fetch failed for {Uri}", scriptUri);
        continue;
      }

      ExtractFromSource(scriptContent, scriptUri.ToString(), baseUrl, results, seen);
    }

    return results;
  }

  private void ExtractFromSource(string source, string origin, Uri baseUrl, List<CandidateEndpoint> results, HashSet<string> seen)
  {
    if (string.IsNullOrWhiteSpace(source)) return;

    var structuredHitCount = 0;

    foreach (var pattern in StructuredCallPatterns)
    {
      foreach (Match match in pattern.Matches(source))
      {
        if (TryAdd(match.Groups[1].Value, origin, DiscoveryConfidence.JsStructuredCallLiteral,
                "Structured API call literal (fetch/axios/XHR/$.ajax) found in JavaScript.",
                baseUrl, results, seen))
        {
          structuredHitCount++;
        }
      }
    }

    // Fallback only runs when structured extraction found nothing for this specific source —
    // "return nothing over rubbish" means we don't pile noisy matches on top of good ones either.
    if (structuredHitCount == 0)
    {
      foreach (Match match in FallbackPathLiteralRegex.Matches(source))
      {
        TryAdd(match.Groups[1].Value, origin, DiscoveryConfidence.JsGenericPathStringFallback,
            "Generic API-like path string literal found in JavaScript (no structured call matched).",
            baseUrl, results, seen);
      }
    }
  }

  private static bool TryAdd(
      string rawValue, string origin, double confidence, string description,
      Uri baseUrl, List<CandidateEndpoint> results, HashSet<string> seen)
  {
    if (string.IsNullOrWhiteSpace(rawValue)) return false;

    // Collapse template interpolations into a path-param placeholder rather than discarding —
    // `/api/users/${id}` is genuinely useful as `/api/users/{param}`.
    var templatedValue = TemplateInterpolationRegex.Replace(rawValue, "{param}");

    string path;
    if (Uri.TryCreate(templatedValue, UriKind.Absolute, out var absoluteUri))
    {
      if (!string.Equals(absoluteUri.Host, baseUrl.Host, StringComparison.OrdinalIgnoreCase)) return false;
      path = absoluteUri.AbsolutePath;
    }
    else if (templatedValue.StartsWith('/'))
    {
      path = templatedValue;
    }
    else
    {
      return false; // Dynamic base (e.g. `${apiBase}/users`) — can't verify it's same-origin, skip.
    }

    var normalized = EndpointPathNormalizer.Normalize(path);
    if (normalized == "/" || EndpointPathNormalizer.LooksLikeStaticAsset(normalized)) return false;
    if (!seen.Add(normalized)) return false;

    var candidate = new CandidateEndpoint
    {
      Path = normalized,
      DiscoverySource = DiscoveryStrategiesNames.Javascript__Strategy,
      Confidence = confidence,
    };
    candidate.Evidence.Add(new EndpointEvidence
    {
      Source = DiscoveryStrategiesNames.Javascript__Strategy,
      Description = description,
      Value = $"{origin} :: {rawValue}",
      Confidence = confidence,
    });
    results.Add(candidate);
    return true;
  }

  private static Uri? ResolveSameOrigin(string src, Uri baseUrl)
  {
    if (Uri.TryCreate(src, UriKind.Absolute, out var abs))
      return string.Equals(abs.Host, baseUrl.Host, StringComparison.OrdinalIgnoreCase) ? abs : null;

    return Uri.TryCreate(baseUrl, src, out var relative) ? relative : null;
  }
}