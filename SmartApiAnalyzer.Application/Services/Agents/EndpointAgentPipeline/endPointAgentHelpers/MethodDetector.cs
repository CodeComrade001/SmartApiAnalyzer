using System.Net;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointAgentPipeline;

public sealed class MethodDetector : IMethodDetector
{
  private readonly IHttpClientFactory _httpClientFactory;
  private readonly ILogger<MethodDetector> _logger;

  public MethodDetector(IHttpClientFactory httpClientFactory, ILogger<MethodDetector> logger)
  {
    _httpClientFactory = httpClientFactory;
    _logger = logger;
  }

  public async Task<PipelineStageResult> DetectAsync(EndpointPipelineContext context, CancellationToken cancellationToken)
  {
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
    const string stageName = "MethodDetection";

    try
    {
      cancellationToken.ThrowIfCancellationRequested();

      var verifiedConcrete = context.VerifiedEndpoints.Where(e => e.IsVerified).ToList();
      if (verifiedConcrete.Count == 0)
        return PipelineStageResult.Ok(stageName, "No verified endpoints to inspect for methods.", stopwatch.Elapsed);

      var client = _httpClientFactory.CreateClient(DiscoveryHttpClient.Name);

      foreach (var endpoint in verifiedConcrete)
      {
        cancellationToken.ThrowIfCancellationRequested();
        await DetectMethodsAsync(client, endpoint, context, cancellationToken);
      }

      return PipelineStageResult.Ok(stageName, $"Method detection completed for {verifiedConcrete.Count} endpoint(s).", stopwatch.Elapsed);
    }
    catch (OperationCanceledException)
    {
      throw;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Method detection stage failed unexpectedly.");
      return PipelineStageResult.Fail(stageName, "Method detection failed due to an unexpected error.", ex.Message, stopwatch.Elapsed);
    }
  }

  private async Task DetectMethodsAsync(HttpClient client, VerifiedEndpoint endpoint, EndpointPipelineContext context, CancellationToken cancellationToken)
  {
    if (!Uri.TryCreate(context.Website, endpoint.Path, out var uri)) return;

    context.Statistics.TotalRequests++;
    var allowHeaderMethods = await TryGetAllowHeaderAsync(client, uri, cancellationToken);

    if (allowHeaderMethods is { Count: > 0 })
    {
      foreach (var method in allowHeaderMethods) endpoint.SupportedMethods.Add(method);
      endpoint.Metadata[EndpointMetadataKeys.OptionsAllowHeader] = string.Join(",", allowHeaderMethods.Select(m => m.Method));
      return;
    }

    // OPTIONS gave nothing usable. GET is the only remaining verb safe to confirm without
    // prior server confirmation (idempotent, non-mutating). We stop there — no guessing.
    context.Statistics.TotalRequests++;
    if (await TryGetAsync(client, uri, cancellationToken))
    {
      endpoint.SupportedMethods.Add(HttpMethod.Get);
    }
  }

  private async Task<List<HttpMethod>?> TryGetAllowHeaderAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
  {
    try
    {
      using var request = new HttpRequestMessage(HttpMethod.Options, uri);
      using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

      if (response.Content.Headers.Allow.Count == 0) return null;
      return response.Content.Headers.Allow.Select(m => new HttpMethod(m.ToUpperInvariant())).ToList();
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
    {
      _logger.LogDebug(ex, "OPTIONS probe failed for {Uri}", uri);
      return null;
    }
  }

  private async Task<bool> TryGetAsync(HttpClient client, Uri uri, CancellationToken cancellationToken)
  {
    try
    {
      using var request = new HttpRequestMessage(HttpMethod.Get, uri);
      using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
      return response.StatusCode != HttpStatusCode.MethodNotAllowed;
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
    {
      _logger.LogDebug(ex, "GET probe failed for {Uri}", uri);
      return false;
    }
  }
}