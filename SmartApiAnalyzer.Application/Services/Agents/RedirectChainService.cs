using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class RedirectChainService : IRedirectChainService
{
    private readonly HttpClient _http;
    private readonly ILogger<RedirectChainService> _logger;

    private const int MaxHops = 15;
    private const int TimeoutSec = 10;

    public RedirectChainService(IHttpClientFactory factory, ILogger<RedirectChainService> logger)
    {
        // Named client must be configured with AllowAutoRedirect = false
        _http = factory.CreateClient("RedirectClient");
        _logger = logger;
    }

    public async Task<RedirectChainResult> AnalyzeAsync(Uri uri, CancellationToken ct)
    {
        var hops = new List<RedirectHop>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var current = uri;
        var hasLoop = false;
        var enforcesHttps = false;

        try
        {
            for (int step = 1; step <= MaxHops; step++)
            {
                if (!seen.Add(current.ToString()))
                {
                    hasLoop = true;
                    _logger.LogWarning("Redirect loop detected at hop {Step} for {Url}", step, current);
                    break;
                }

                using var req = new HttpRequestMessage(HttpMethod.Get, current);
                using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);

                var statusCode = (int)resp.StatusCode;
                var isRedirect = statusCode is >= 301 and <= 308;

                if (!isRedirect)
                {
                    // Terminal hop
                    hops.Add(new RedirectHop
                    {
                        Step = step,
                        FromUrl = current.ToString(),
                        ToUrl = current.ToString(),
                        StatusCode = statusCode,
                    });
                    break;
                }

                var locationHeader = resp.Headers.Location;
                if (locationHeader is null)
                {
                    _logger.LogWarning("Redirect at {Url} missing Location header", current);
                    break;
                }

                // Resolve relative redirect
                var next = locationHeader.IsAbsoluteUri
                    ? locationHeader
                    : new Uri(current, locationHeader);

                hops.Add(new RedirectHop
                {
                    Step = step,
                    FromUrl = current.ToString(),
                    ToUrl = next.ToString(),
                    StatusCode = statusCode,
                });

                // Detect HTTP→HTTPS upgrade
                if (current.Scheme == "http" && next.Scheme == "https")
                    enforcesHttps = true;

                current = next;
            }

            var finalUrl = hops.Count > 0 ? hops[^1].ToUrl : uri.ToString();
            var landsOnHttp = finalUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase);

            // If the input was HTTP and it landed on HTTPS, enforcesHttps = true
            if (uri.Scheme == "http" && finalUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                enforcesHttps = true;

            return new RedirectChainResult
            {
                Hops = hops,
                EnforcesHttps = enforcesHttps,
                HasRedirectLoop = hasLoop,
                LandsOnHttp = landsOnHttp,
                HopCount = hops.Count,
                FinalUrl = finalUrl,
                IsCritical = hasLoop || landsOnHttp,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "RedirectChain probe failed for {Host}", uri.Host);
            throw;
        }
    }
}
