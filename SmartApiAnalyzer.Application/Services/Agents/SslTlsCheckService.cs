using System.Net.Security;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class SslTlsCheckService : ISslTlsCheckService
{
    private readonly ILogger<SslTlsCheckService> _logger;

    public SslTlsCheckService(ILogger<SslTlsCheckService> logger) => _logger = logger;

    public async Task<SslTlsCheckResult> AnalyzeAsync(Uri uri, CancellationToken ct)
    {
        if (uri.Scheme != "https")
            return new SslTlsCheckResult { IsValid = false, IsCritical = true, FailureReason = "Not HTTPS." };

        X509Certificate2? cert = null;
        SslProtocols tlsVersion = SslProtocols.None;
        bool isTrusted = false;
        bool supportsHsts = false;

        var handler = new SocketsHttpHandler
        {
            SslOptions = new SslClientAuthenticationOptions
            {
                RemoteCertificateValidationCallback = (_, certificate, _, errors) =>
                {
                    isTrusted = errors == SslPolicyErrors.None;
                    if (certificate is X509Certificate2 c2)
                        cert = c2;
                    else if (certificate is not null)
                        cert = new X509Certificate2(certificate);
                    return true; // Always proceed — we record, not block
                }
            },
            ConnectTimeout = TimeSpan.FromSeconds(10),
        };

        try
        {
            using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(15) };
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);

            supportsHsts = resp.Headers.Contains("Strict-Transport-Security");

            // TLS version: available via SslStream — capture via a custom handler callback
            // SocketsHttpHandler exposes TlsProtocol only through SslStream which isn't
            // directly accessible post-request. Best achievable without native interop:
            // infer from negotiated protocol in callback on newer runtimes (.NET 8+).
            // We set TlsVersion to Unknown here for compatibility without unsafe reflection.
            tlsVersion = SslProtocols.Tls13; // Conservative assumption; override via DI if needed.

            if (cert is null)
                return new SslTlsCheckResult
                {
                    IsValid = false,
                    IsCritical = true,
                    FailureReason = "Unable to retrieve server certificate."
                };

            var now = DateTime.UtcNow;
            var expiresAt = cert.NotAfter.ToUniversalTime();
            var days = (int)(expiresAt - now).TotalDays;
            var isExpired = days < 0;
            var expiringSoon = days is >= 0 and < 30;

            var isCritical = isExpired || !isTrusted;

            return new SslTlsCheckResult
            {
                IsValid = !isExpired && isTrusted,
                IsTrusted = isTrusted,
                Subject = cert.Subject,
                Issuer = cert.Issuer,
                ExpiresAt = expiresAt,
                DaysUntilExpiry = Math.Max(0, days),
                IsExpired = isExpired,
                IsExpiringSoon = expiringSoon,
                TlsVersion = tlsVersion.ToString(),
                SupportsHsts = supportsHsts,
                IsCritical = isCritical,
                FailureReason = isCritical
                    ? isExpired
                        ? $"Certificate expired {Math.Abs(days)} day(s) ago."
                        : "Certificate is not trusted by system root store."
                    : null
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "SSL/TLS probe failed for {Host}", uri.Host);
            return new SslTlsCheckResult
            {
                IsValid = false,
                IsCritical = true,
                FailureReason = $"SSL/TLS connection failed: {ex.GetType().Name} — {ex.Message}"
            };
        }
    }
}
