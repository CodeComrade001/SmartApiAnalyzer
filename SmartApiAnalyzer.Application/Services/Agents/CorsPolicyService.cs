using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Application.Services.Agents;


public sealed class CorsPolicyService : ICorsPolicyService
{
    private readonly HttpClient _http;
    private readonly ILogger<CorsPolicyService> _logger;

    private const string AttackerOrigin = "https://evil-attacker.example.com";

    public CorsPolicyService(IHttpClientFactory factory, ILogger<CorsPolicyService> logger)
    {
        _http = factory.CreateClient("CorsClient");
        _logger = logger;
    }

    public async Task<CorsPolicyResult> AnalyzeAsync(Uri uri, CancellationToken ct)
    {
        try
        {
            // Send a cross-origin GET with an attacker-controlled Origin header
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            req.Headers.TryAddWithoutValidation("Origin", AttackerOrigin);

            using var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);

            var acao = GetHeader(resp, "Access-Control-Allow-Origin");
            var acac = GetHeader(resp, "Access-Control-Allow-Credentials");
            var acam = GetHeader(resp, "Access-Control-Allow-Methods");
            var acah = GetHeader(resp, "Access-Control-Allow-Headers");

            var allowsWildcard = acao == "*";
            var allowsCredentials = acac.Equals("true", StringComparison.OrdinalIgnoreCase);
            var wildcardWithCredentials = allowsWildcard && allowsCredentials;

            // Reflection: server echoes back the attacker Origin verbatim
            var reflectsArbitraryOrigin =
                !allowsWildcard &&
                string.Equals(acao, AttackerOrigin, StringComparison.OrdinalIgnoreCase);

            var isMisconfigured = wildcardWithCredentials || reflectsArbitraryOrigin ||
                                  (allowsWildcard && !string.IsNullOrEmpty(acac));

            var summary = BuildSummary(
                allowsWildcard, allowsCredentials, wildcardWithCredentials, reflectsArbitraryOrigin);

            return new CorsPolicyResult
            {
                AllowsWildcardOrigin = allowsWildcard,
                AllowsCredentials = allowsCredentials,
                WildcardWithCredentials = wildcardWithCredentials,
                ReflectsArbitraryOrigin = reflectsArbitraryOrigin,
                AllowOriginHeader = acao,
                AllowMethodsHeader = acam,
                AllowHeadersHeader = acah,
                IsMisconfigured = isMisconfigured,
                Summary = summary,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "CORS probe failed for {Host}", uri.Host);
            throw;
        }
    }

    private static string GetHeader(HttpResponseMessage resp, string name)
    {
        if (resp.Headers.TryGetValues(name, out var values))
            return string.Join(", ", values);
        return string.Empty;
    }

    private static string BuildSummary(
        bool wildcard, bool credentials, bool wildcardWithCred, bool reflects)
    {
        if (wildcardWithCred)
            return "Critical: wildcard origin (*) combined with credentials=true. " +
                   "Any origin can make credentialed cross-origin requests.";

        if (reflects)
            return "High: server reflects arbitrary Origin header in ACAO response. " +
                   "Effectively equivalent to wildcard for targeted attackers.";

        if (wildcard)
            return "Medium: wildcard ACAO (*) — unauthenticated cross-origin reads permitted.";

        if (credentials)
            return "Info: credentials allowed but origin is restricted.";

        return "CORS policy is acceptable.";
    }
}
