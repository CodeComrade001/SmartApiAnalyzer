using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Agent.Web;
using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;

namespace SmartApiAnalyzer.Infrastructure.Services;

// ══════════════════════════════════════════════════════════════════════════════
// UrlValidationService
// ══════════════════════════════════════════════════════════════════════════════

public sealed class UrlValidationService : IUrlValidationService
{
    private readonly ILogger<UrlValidationService> _logger;

    private static readonly HashSet<string> _privateRanges = new(StringComparer.Ordinal)
    {
        "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
        "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
        "fc", "fd"  // IPv6 ULA prefix check (startswith)
    };

    public UrlValidationService(ILogger<UrlValidationService> logger) => _logger = logger;

    public async Task<UrlValidationResult> ValidateAsync(Uri uri, CancellationToken ct)
    {
        try
        {
            var addresses = await Dns.GetHostAddressesAsync(uri.Host, ct);
            var ip = addresses.FirstOrDefault()?.ToString() ?? string.Empty;
            var isLoopback = addresses.Any(a => IPAddress.IsLoopback(a));
            var isPrivate = IsPrivateIp(ip);

            if (isLoopback || isPrivate)
            {
                return new UrlValidationResult
                {
                    IsValid = false,
                    IsHttps = uri.Scheme == "https",
                    Scheme = uri.Scheme,
                    Host = uri.Host,
                    DnsResolvable = true,
                    ResolvedIp = ip,
                    IsPrivateIp = isPrivate,
                    IsLoopback = isLoopback,
                    FailureReason = isLoopback
                        ? "Loopback addresses are not permitted."
                        : "Private/internal IP ranges are not permitted."
                };
            }

            return new UrlValidationResult
            {
                IsValid = true,
                IsHttps = uri.Scheme == "https",
                Scheme = uri.Scheme,
                Host = uri.Host,
                DnsResolvable = true,
                ResolvedIp = ip,
                IsPrivateIp = false,
                IsLoopback = false,
            };
        }
        catch (SocketException ex)
        {
            _logger.LogDebug(ex, "DNS resolution failed for {Host}", uri.Host);
            return new UrlValidationResult
            {
                IsValid = false,
                Scheme = uri.Scheme,
                Host = uri.Host,
                DnsResolvable = false,
                FailureReason = $"DNS resolution failed: {ex.Message}"
            };
        }
    }

    private static bool IsPrivateIp(string ip)
    {
        if (string.IsNullOrEmpty(ip)) return false;
        foreach (var prefix in _privateRanges)
            if (ip.StartsWith(prefix, StringComparison.Ordinal))
                return true;
        return false;
    }
}
