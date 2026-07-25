using System.Diagnostics;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class LatencyInspectionService : ILatencyInspectionService
{
    private readonly HttpClient _http;
    private readonly ILogger<LatencyInspectionService> _logger;

    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(15);

    public LatencyInspectionService(IHttpClientFactory factory, ILogger<LatencyInspectionService> logger)
    {
        _http = factory.CreateClient("LatencyClient");
        _logger = logger;
    }

    public async Task<LatencyInspectionResult> AnalyzeAsync(Uri uri, CancellationToken ct)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(ProbeTimeout);

        var sw = Stopwatch.StartNew();

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, timeout.Token);

            // TTFB = time until first response byte (headers received)
            var ttfb = sw.Elapsed.TotalMilliseconds;

            // Drain body to get total latency
            await resp.Content.ReadAsByteArrayAsync(timeout.Token);
            sw.Stop();

            var totalMs = sw.Elapsed.TotalMilliseconds;
            var statusCode = (int)resp.StatusCode;
            var grade = ComputeGrade(totalMs);

            _logger.LogDebug(
                "Latency for {Host}: total={Total:F0}ms ttfb={Ttfb:F0}ms grade={Grade}",
                uri.Host, totalMs, ttfb, grade);

            return new LatencyInspectionResult
            {
                LatencyMs = Math.Round(totalMs, 2),
                TtfbMs = Math.Round(ttfb, 2),
                StatusCode = statusCode,
                Grade = grade,
                TimedOut = false,
            };
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            // Internal timeout (probe timeout), not external cancellation
            sw.Stop();
            _logger.LogWarning("Latency probe timed out for {Host} after {Ms}ms",
                uri.Host, ProbeTimeout.TotalMilliseconds);

            return new LatencyInspectionResult
            {
                LatencyMs = ProbeTimeout.TotalMilliseconds,
                TtfbMs = 0,
                StatusCode = 0,
                Grade = "F",
                TimedOut = true,
            };
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Latency probe error for {Host}", uri.Host);
            throw;
        }
        finally
        {
            sw.Stop();
        }
    }

    private static string ComputeGrade(double ms) => ms switch
    {
        < 200 => "A",
        < 500 => "B",
        < 1000 => "C",
        < 2000 => "D",
        _ => "F"
    };
}
