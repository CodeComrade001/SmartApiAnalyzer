using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class SecurityHeadersService : ISecurityHeaderService
{
    private readonly HttpClient _http;
    private readonly ILogger<SecurityHeadersService> _logger;

    // Header name → weight in score (total possible = 100)
    private static readonly IReadOnlyDictionary<string, int> _headerWeights =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["Strict-Transport-Security"] = 25,
            ["Content-Security-Policy"] = 25,
            ["X-Frame-Options"] = 15,
            ["X-Content-Type-Options"] = 15,
            ["Referrer-Policy"] = 10,
            ["Permissions-Policy"] = 10,
        };

    public SecurityHeadersService(IHttpClientFactory factory, ILogger<SecurityHeadersService> logger)
    {
        _http = factory.CreateClient("SecurityHeadersClient");
        _logger = logger;
    }

    public async Task<SecurityHeadersResult> AnalyzeAsync(Uri uri, CancellationToken ct)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);

            var headers = resp.Headers
                .Concat(resp.Content.Headers)
                .GroupBy(h => h.Key, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => string.Join(", ", g.SelectMany(x => x.Value)),
                    StringComparer.OrdinalIgnoreCase);

            var missing = new List<string>();
            var present = new Dictionary<string, string>();
            int score = 0;

            foreach (var (header, weight) in _headerWeights)
            {
                if (headers.TryGetValue(header, out var value))
                {
                    present[header] = value;
                    score += weight;
                }
                else
                {
                    missing.Add(header);
                }
            }

            var hasXss = headers.ContainsKey("X-XSS-Protection");
            var grade = ScoreToGrade(score);

            return new SecurityHeadersResult
            {
                HasHsts = headers.ContainsKey("Strict-Transport-Security"),
                HasCsp = headers.ContainsKey("Content-Security-Policy"),
                HasXFrameOptions = headers.ContainsKey("X-Frame-Options"),
                HasXContentTypeOpts = headers.ContainsKey("X-Content-Type-Options"),
                HasReferrerPolicy = headers.ContainsKey("Referrer-Policy"),
                HasPermissionsPolicy = headers.ContainsKey("Permissions-Policy"),
                HasXssProtection = hasXss,
                MissingHeaders = missing,
                PresentHeaders = present,
                Score = score,
                Grade = grade,
                IsCritical = score < 50,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "SecurityHeaders probe failed for {Host}", uri.Host);
            throw;
        }
    }

    private static string ScoreToGrade(int score) => score switch
    {
        >= 90 => "A+",
        >= 75 => "A",
        >= 60 => "B",
        >= 50 => "C",
        >= 35 => "D",
        _ => "F"
    };
}
