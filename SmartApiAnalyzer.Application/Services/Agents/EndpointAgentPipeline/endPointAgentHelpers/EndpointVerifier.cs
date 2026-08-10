using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointAgentPipeline;

public sealed partial class EndpointVerifier : IEndpointVerifier
{
  private const string CanaryBaselineSharedDataKey = "EndpointVerifier.CanaryBaseline";
  private const int SignatureSampleBytes = 512;
  // Structured-evidence floor from your DiscoveryConfidence bands (65-84 = "structured client-code evidence").
  // Anything below this is heuristic-only and MUST NOT be auto-trusted for an unprobeable templated path.
  private const double MinTrustedTemplateConfidence = 65.0;

  [GeneratedRegex(@"\{[^/]+\}")]
  private static partial Regex TemplateParamRegex();

  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<EndpointVerifier> _logger;

  public EndpointVerifier(IHttpClientFactory httpClientFactory, ILogger<EndpointVerifier> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public async Task<PipelineStageResult> VerifyAsync(EndpointPipelineContext context, CancellationToken cancellationToken)
  {
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
    const string stageName = "EndpointVerification";

    try
    {
      cancellationToken.ThrowIfCancellationRequested();

      if (context.Candidates.Count == 0)
        return PipelineStageResult.Ok(stageName, "No candidates to verify.", stopwatch.Elapsed);

      var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);
      var merged = MergeDuplicates(context.Candidates);
      ResponseSignature? baseline = null;

      foreach (var candidate in merged)
      {
        cancellationToken.ThrowIfCancellationRequested();

        if (TemplateParamRegex().IsMatch(candidate.Path))
        {
          VerifyTemplatedCandidate(candidate, context);
          continue;
        }

        baseline ??= await GetOrCreateBaselineAsync(client, context, cancellationToken);

        if (baseline is null)
        {
          _logger.LogWarning("Could not establish canary baseline for {Website}; skipping live verification for remaining concrete paths.", context.Website);
          break;
        }

        await VerifyConcreteCandidateAsync(client, candidate, baseline.Value, context, cancellationToken);
      }

      context.Statistics.VerifiedEndpoints = context.VerifiedEndpoints.Count(e => e.IsVerified);
      context.Statistics.FailedVerification = context.VerifiedEndpoints.Count(e => !e.IsVerified);
      context.Statistics.DuplicateEndpointsMerged = context.Candidates.Count - merged.Count;

      return PipelineStageResult.Ok(
          stageName,
          $"Verified {context.Statistics.VerifiedEndpoints} of {merged.Count} candidate endpoint(s).",
          stopwatch.Elapsed);
    }
    catch (OperationCanceledException)
    {
      throw;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Endpoint verification stage failed unexpectedly.");
      return PipelineStageResult.Fail(stageName, "Endpoint verification failed due to an unexpected error.", ex.Message, stopwatch.Elapsed);
    }
  }

  private static List<CandidateEndpoint> MergeDuplicates(List<CandidateEndpoint> candidates)
  {
    return candidates
        .GroupBy(c => c.Path, StringComparer.OrdinalIgnoreCase)
        .Select(group =>
        {
          var best = group.OrderByDescending(c => c.Confidence).First();
          var mergedCandidate = new CandidateEndpoint
          {
            Path = best.Path,
            DiscoverySource = best.DiscoverySource,
            Confidence = group.Max(c => c.Confidence),
            DiscoveredAt = group.Min(c => c.DiscoveredAt),
          };
          mergedCandidate.Evidence.AddRange(group.SelectMany(c => c.Evidence));
          return mergedCandidate;
        })
        .ToList();
  }

  private static void VerifyTemplatedCandidate(CandidateEndpoint candidate, EndpointPipelineContext context)
  {
    if (candidate.Confidence < MinTrustedTemplateConfidence) return; // refuse to guess — better nothing than rubbish

    var verified = new VerifiedEndpoint
    {
      Path = candidate.Path,
      IsVerified = true,
      StatusCode = null,
      Confidence = candidate.Confidence,
      DiscoveredAt = candidate.DiscoveredAt,
    };
    verified.Evidence.AddRange(candidate.Evidence);
    verified.Metadata[EndpointMetadataKeys.VerificationMethod] = "TrustedByDeclaration";
    context.VerifiedEndpoints.Add(verified);
  }

  private async Task VerifyConcreteCandidateAsync(
      HttpClient client, CandidateEndpoint candidate, ResponseSignature baseline,
      EndpointPipelineContext context, CancellationToken cancellationToken)
  {
    context.Statistics.TotalRequests++;

    if (!Uri.TryCreate(context.Website, candidate.Path, out var uri))
    {
      context.VerifiedEndpoints.Add(new VerifiedEndpoint
      {
        Path = candidate.Path,
        IsVerified = false,
        Confidence = candidate.Confidence,
        DiscoveredAt = candidate.DiscoveredAt,
      });
      return;
    }

    var signature = await ProbeAsync(client, uri, cancellationToken);

    if (signature is null)
    {
      context.VerifiedEndpoints.Add(new VerifiedEndpoint
      {
        Path = candidate.Path,
        IsVerified = false,
        Confidence = candidate.Confidence,
        DiscoveredAt = candidate.DiscoveredAt,
      });
      return;
    }

    var matchesCanary = signature.Value.StatusCode == baseline.StatusCode && signature.Value.BodyHash == baseline.BodyHash;
    var isVerified = !matchesCanary && signature.Value.StatusCode is >= 200 and < 500;

    var verified = new VerifiedEndpoint
    {
      Path = candidate.Path,
      IsVerified = isVerified,
      StatusCode = signature.Value.StatusCode,
      Confidence = isVerified ? candidate.Confidence : Math.Min(candidate.Confidence, 15.0),
      DiscoveredAt = candidate.DiscoveredAt,
    };
    verified.Evidence.AddRange(candidate.Evidence);
    verified.Metadata[EndpointMetadataKeys.VerificationMethod] = "LiveCanaryDifferential";

    if (signature.Value.ContentType is not null)
      verified.Metadata[EndpointMetadataKeys.ObservedContentType] = signature.Value.ContentType;
    if (signature.Value.WwwAuthenticate is not null)
      verified.Metadata[EndpointMetadataKeys.WwwAuthenticateHeader] = signature.Value.WwwAuthenticate;

    context.VerifiedEndpoints.Add(verified);
  }

  private async Task<ResponseSignature?> GetOrCreateBaselineAsync(HttpClient client, EndpointPipelineContext context, CancellationToken cancellationToken)
  {
    if (context.SharedData.TryGetValue(CanaryBaselineSharedDataKey, out var cached) && cached is ResponseSignature cachedSignature)
      return cachedSignature;

    var canaryUri = new Uri(context.Website, $"/__sa_canary_{Guid.NewGuid():N}");
    context.Statistics.TotalRequests++;
    var baseline = await ProbeAsync(client, canaryUri, cancellationToken);

    if (baseline is not null)
      context.SharedData[CanaryBaselineSharedDataKey] = baseline.Value;

    return baseline;
  }

  private async Task<ResponseSignature?> ProbeAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
  {
    using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
    timeoutCts.CancelAfter(TimeSpan.FromSeconds(5));

    try
    {
      using var request = new HttpRequestMessage(HttpMethod.Get, uri);
      using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeoutCts.Token);

      var buffer = new byte[SignatureSampleBytes];
      var totalRead = 0;
      await using var stream = await response.Content.ReadAsStreamAsync(timeoutCts.Token);
      int read;
      while (totalRead < buffer.Length &&
             (read = await stream.ReadAsync(buffer.AsMemory(totalRead, buffer.Length - totalRead), timeoutCts.Token)) > 0)
      {
        totalRead += read;
      }

      return new ResponseSignature(
          (int)response.StatusCode,
          response.Content.Headers.ContentType?.MediaType,
          Convert.ToHexString(SHA256.HashData(buffer[..totalRead])),
          response.Headers.WwwAuthenticate.Count > 0 ? response.Headers.WwwAuthenticate.ToString() : null);
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException or IOException)
    {
      _logger.LogDebug(ex, "Verification probe failed for {Uri}", uri);
      return null;
    }
  }

  private readonly record struct ResponseSignature(int StatusCode, string? ContentType, string BodyHash, string? WwwAuthenticate);
}