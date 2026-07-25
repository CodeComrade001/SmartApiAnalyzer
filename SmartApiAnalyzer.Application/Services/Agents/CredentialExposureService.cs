using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class CredentialExposureService : ICredentialExposureService
{
    private readonly HttpClient _http;
    private readonly ILogger<CredentialExposureService> _logger;

    // Patterns for secrets commonly leaked in HTML/JS
    private static readonly IReadOnlyList<(string Label, Regex Pattern)> _secretPatterns =
        new List<(string, Regex)>
        {
            ("AWS Access Key",    new Regex(@"AKIA[0-9A-Z]{16}", RegexOptions.Compiled)),
            ("AWS Secret Key",    new Regex(@"(?i)aws.{0,20}?['\""]\s*([A-Za-z0-9/+=]{40})['\""]\s*", RegexOptions.Compiled)),
            ("GitHub Token",      new Regex(@"ghp_[A-Za-z0-9]{36}", RegexOptions.Compiled)),
            ("Google API Key",    new Regex(@"AIza[0-9A-Za-z\-_]{35}", RegexOptions.Compiled)),
            ("Private Key PEM",   new Regex(@"-----BEGIN (RSA |EC )?PRIVATE KEY-----", RegexOptions.Compiled)),
            ("Bearer Token",      new Regex(@"(?i)bearer\s+[A-Za-z0-9\-_]{20,}", RegexOptions.Compiled)),
            ("Basic Auth Header", new Regex(@"(?i)authorization:\s*basic\s+[A-Za-z0-9+/=]{10,}", RegexOptions.Compiled)),
            ("Password Field",    new Regex(@"(?i)password\s*[:=]\s*['""][^'""]{6,}['""]", RegexOptions.Compiled)),
            ("DB Connection Str", new Regex(@"(?i)(mysql|postgres|mongodb|sqlserver):\/\/[^\s'""<>]+", RegexOptions.Compiled)),
            ("Slack Token",       new Regex(@"xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32}", RegexOptions.Compiled)),
            ("Stripe Secret",     new Regex(@"sk_(live|test)_[0-9a-zA-Z]{24}", RegexOptions.Compiled)),
            ("Twilio Token",      new Regex(@"(?i)twilio.{0,20}?['\""]\s*[0-9a-f]{32}['\""]\s*", RegexOptions.Compiled)),
        };

    // Known security headers relevant to credential endpoints
    private static readonly string[] _requiredHeaders =
    {
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "Content-Security-Policy",
        "Cache-Control"
    };

    public CredentialExposureService(IHttpClientFactory factory, ILogger<CredentialExposureService> logger)
    {
        _http = factory.CreateClient("CredentialClient");
        _logger = logger;
    }

    public async Task<CredentialExposureResult> AnalyzeAsync(Uri uri, CancellationToken ct)
    {
        try
        {
            using var resp = await _http.GetAsync(uri, HttpCompletionOption.ResponseContentRead, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);

            var respHeaders = resp.Headers
                .Concat(resp.Content.Headers)
                .ToDictionary(h => h.Key, h => string.Join(", ", h.Value),
                    StringComparer.OrdinalIgnoreCase);

            // ── 1. Login form detection ────────────────────────────────────
            var hasLoginForm = DetectLoginForm(body);

            // ── 2. Cookie security inspection ─────────────────────────────
            var cookieSecure = false;
            var cookieHttpOnly = false;
            var cookieSameSite = "None";

            if (resp.Headers.TryGetValues("Set-Cookie", out var cookies))
            {
                foreach (var cookie in cookies)
                {
                    var parts = cookie.Split(';').Select(p => p.Trim()).ToList();
                    cookieSecure = cookieSecure || parts.Any(p => p.Equals("Secure", StringComparison.OrdinalIgnoreCase));
                    cookieHttpOnly = cookieHttpOnly || parts.Any(p => p.Equals("HttpOnly", StringComparison.OrdinalIgnoreCase));
                    var ss = parts.FirstOrDefault(p => p.StartsWith("SameSite=", StringComparison.OrdinalIgnoreCase));
                    if (ss is not null) cookieSameSite = ss.Split('=', 2)[1].Trim();
                }
            }

            // ── 3. Missing security headers ────────────────────────────────
            var missingHeaders = _requiredHeaders
                .Where(h => !respHeaders.ContainsKey(h))
                .ToList();

            // ── 4. Secret scanning (body + response) ──────────────────────
            var exposedTypes = new List<string>();
            foreach (var (label, pattern) in _secretPatterns)
            {
                if (pattern.IsMatch(body))
                    exposedTypes.Add(label);
            }
            var exposedSecretsFound = exposedTypes.Count > 0;

            // ── 5. Risk scoring ────────────────────────────────────────────
            double risk = 0;

            if (hasLoginForm && uri.Scheme != "https") risk += 40;
            if (!cookieSecure && hasLoginForm) risk += 15;
            if (!cookieHttpOnly && hasLoginForm) risk += 10;
            if (cookieSameSite == "None") risk += 10;
            risk += missingHeaders.Count * 5;
            if (exposedSecretsFound) risk += 30 * exposedTypes.Count;

            risk = Math.Min(risk, 100);

            return new CredentialExposureResult
            {
                HasLoginForm = hasLoginForm,
                UsesHttps = uri.Scheme == "https",
                CookieSecure = cookieSecure,
                CookieHttpOnly = cookieHttpOnly,
                CookieSameSite = !string.Equals(cookieSameSite, "None", StringComparison.OrdinalIgnoreCase),
                MissingHeaders = missingHeaders,
                ExposedSecretsFound = exposedSecretsFound,
                ExposedSecretTypes = exposedTypes,
                RiskScore = risk,
                IsCriticalRisk = risk >= 70 || exposedSecretsFound,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "CredentialExposure probe failed for {Host}", uri.Host);
            throw;
        }
    }

    private static bool DetectLoginForm(string html)
    {
        // Presence of <input type="password"> within a <form> is definitive
        var hasPasswordInput = Regex.IsMatch(html,
            @"<input[^>]*type\s*=\s*['""]password['""][^>]*>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        return hasPasswordInput;
    }
}
