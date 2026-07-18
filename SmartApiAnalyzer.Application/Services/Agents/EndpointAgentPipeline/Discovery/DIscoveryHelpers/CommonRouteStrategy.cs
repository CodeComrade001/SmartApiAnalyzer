using System.Collections.Concurrent;
using System.Net;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

public sealed class CommonRouteStrategy : IDiscoveryStrategy
{
  // Hardcoded default; treat as a config extension point (IOptions<CommonRouteOptions>)
  // if/when you want ops to tune this without a redeploy. Not wired to config now
  // because no config source for this was confirmed.
  private static readonly string[] DefaultCandidateRoutes =
  [
      "/api", "/api/v1", "/api/v2", "/api/status", "/api/health",
        "/health", "/healthz", "/status", "/ping",
        "/api/users", "/api/user", "/api/auth", "/api/login", "/api/token",
        "/api/products", "/api/orders", "/api/config", "/api/version",
        "/version", "/metrics", "/api/docs", "/api/info",
    ];

  private const int DefaultMaxConcurrency = 5;
  private static readonly TimeSpan DefaultPerRequestTimeout = TimeSpan.FromSeconds(3);
  private const int SignatureSampleBytes = 512;

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<CommonRouteStrategy> _logger;
  private readonly IReadOnlyList<string> _candidateRoutes;
  private readonly int _maxConcurrency;
  private readonly TimeSpan _perRequestTimeout;

  public CommonRouteStrategy(
      IHttpClientFactory httpClientFactory,
      ILogger<CommonRouteStrategy> logger,
      IReadOnlyList<string>? candidateRoutes = null,
      int maxConcurrency = DefaultMaxConcurrency,
      TimeSpan? perRequestTimeout = null)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
    _candidateRoutes = candidateRoutes ?? DefaultCandidateRoutes;
    _maxConcurrency = maxConcurrency;
    _perRequestTimeout = perRequestTimeout ?? DefaultPerRequestTimeout;
  }

  public DiscoveryStrategiesNames Name => DiscoveryStrategiesNames.CommonRoute___Strategy;
  public int Priority => 100;

  public async Task<IEnumerable<CandidateEndpoint>> DiscoverAsync(Uri baseUrl, CancellationToken cancellationToken)
  {
    var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);

    // Baseline against a guaranteed-nonexistent path. If the server doesn't behave
    // consistently enough to even establish a baseline, we bail entirely rather than guess.
    var baseline = await ProbeAsync(client, BuildCanaryUri(baseUrl), cancellationToken);
    if (baseline is null)
    {
      _logger.LogDebug("CommonRoute canary probe failed for {BaseUrl}; skipping heuristic probing.", baseUrl);
      return [];
    }

    var results = new ConcurrentBag<CandidateEndpoint>();
    using var semaphore = new SemaphoreSlim(_maxConcurrency);

    var tasks = _candidateRoutes.Select(async route =>
    {
      await semaphore.WaitAsync(cancellationToken);
      try
      {
        var candidateUri = new Uri(baseUrl, route);
        var signature = await ProbeAsync(client, candidateUri, cancellationToken);
        if (signature is null) return;

        var evaluation = Evaluate(signature.Value, baseline.Value);
        if (evaluation is null) return;

        var candidate = new CandidateEndpoint
        {
          Path = EndpointPathNormalizer.Normalize(route),
          DiscoverySource = Name,
          Confidence = evaluation.Value.Confidence,
        };
        candidate.Evidence.Add(new EndpointEvidence
        {
          Source = Name,
          Description = evaluation.Value.Description,
          Value = $"status={signature.Value.StatusCode} contentType={signature.Value.ContentType}",
          Confidence = evaluation.Value.Confidence,
        });
        results.Add(candidate);
      }
      finally
      {
        semaphore.Release();
      }
    });

    await Task.WhenAll(tasks);
    return results;
  }

  private static Uri BuildCanaryUri(Uri baseUrl) => new(baseUrl, $"/__sa_canary_{Guid.NewGuid():N}");

  private async Task<ResponseSignature?> ProbeAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
  {
    using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
    timeoutCts.CancelAfter(_perRequestTimeout);

    try
    {
      var response = await SendWithMethodFallbackAsync(client, uri, timeoutCts.Token);
      if (response is null) return null;

      using (response)
      {
        var contentType = response.Content.Headers.ContentType?.MediaType;
        var sampleBytes = Array.Empty<byte>();

        if (response.Content.Headers.ContentLength is not 0)
        {
          try
          {
            await using var stream = await response.Content.ReadAsStreamAsync(timeoutCts.Token);
            var buffer = new byte[SignatureSampleBytes];
            var totalRead = 0;
            int read;
            while (totalRead < buffer.Length &&
                   (read = await stream.ReadAsync(buffer.AsMemory(totalRead, buffer.Length - totalRead), timeoutCts.Token)) > 0)
            {
              totalRead += read;
            }
            sampleBytes = buffer[..totalRead];
          }
          catch (IOException)
          {
            // Non-fatal — fall back to a status/content-type-only signature.
          }
        }

        return new ResponseSignature((int)response.StatusCode, contentType, ComputeHash(sampleBytes));
      }
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException)
    {
      _logger.LogDebug(ex, "CommonRoute probe failed for {Uri}", uri);
      return null;
    }
  }

  private static async Task<HttpResponseMessage?> SendWithMethodFallbackAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
  {
    using var headRequest = new HttpRequestMessage(HttpMethod.Head, uri);
    var headResponse = await client.SendAsync(headRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

    if (headResponse.StatusCode is HttpStatusCode.MethodNotAllowed or HttpStatusCode.NotImplemented)
    {
      headResponse.Dispose();
      using var getRequest = new HttpRequestMessage(HttpMethod.Get, uri);
      return await client.SendAsync(getRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
    }

    return headResponse;
  }

  private static string ComputeHash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes));

  private static (double Confidence, string Description)? Evaluate(ResponseSignature candidate, ResponseSignature baseline)
  {
    // Identical status AND identical body signature vs. the confirmed-nonexistent canary
    // means this server returns a catch-all/soft-404 for unknown routes. No trust possible.
    var matchesCanary = candidate.StatusCode == baseline.StatusCode && candidate.BodyHash == baseline.BodyHash;
    if (matchesCanary) return null;

    var isJson = candidate.ContentType is not null && candidate.ContentType.Contains("json", StringComparison.OrdinalIgnoreCase);
    var isSuccess = candidate.StatusCode is >= 200 and < 300;

    if (isSuccess && isJson)
    {
      return (DiscoveryConfidence.CommonRouteDistinctSignalHigh,
          "Route returned a distinct 2xx JSON response, differing from the confirmed-nonexistent canary path.");
    }

    var isRecognizedButRestricted = candidate.StatusCode is 401 or 403 or 405 && candidate.StatusCode != baseline.StatusCode;
    if (isRecognizedButRestricted)
    {
      return (DiscoveryConfidence.CommonRouteDistinctSignalLow,
          $"Route returned status {candidate.StatusCode}, distinct from the canary baseline, suggesting the route is recognized but access-restricted.");
    }

    if (isSuccess && candidate.StatusCode != baseline.StatusCode)
    {
      return (DiscoveryConfidence.CommonRouteDistinctSignalLow,
          "Route returned a 2xx response distinct from the canary baseline.");
    }

    return null;
  }

  private readonly record struct ResponseSignature(int StatusCode, string? ContentType, string BodyHash);
}