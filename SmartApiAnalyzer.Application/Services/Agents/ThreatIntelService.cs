using SmartApiAnalyzer.Application.Services.Interface.Agent.Security;
using SmartApiAnalyzer.Domain.Entities.Models;
using System.Net;
using System.Net.Sockets;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class ThreatIntelService : IThreatIntelService
{
  private const int MALICIOUS_THRESHOLD = 70;

  public async Task<ThreatAnalysisResult> AnalyzeAsync(Uri target, CancellationToken ct)
  {
    ct.ThrowIfCancellationRequested();

    var score = 0;
    var reasons = new List<string>();

    // 1. Basic domain heuristics
    if (IsSuspiciousDomain(target.Host))
    {
      score += 30;
      reasons.Add("Suspicious domain pattern detected");
    }

    // 2. IP resolution check
    try
    {
      var ips = await Dns.GetHostAddressesAsync(target.Host, ct);

      if (ips.Length == 0)
      {
        score += 40;
        reasons.Add("Domain does not resolve to IP");
      }
      else
      {
        foreach (var ip in ips)
        {
          if (IPAddress.IsLoopback(ip))
          {
            score += 80;
            reasons.Add("Loopback address detected");
          }

          if (IsPrivateIp(ip))
          {
            score += 20;
            reasons.Add("Private/internal IP detected");
          }
        }
      }
    }
    catch
    {
      score += 50;
      reasons.Add("DNS resolution failed");
    }

    // 3. Protocol risk scoring
    if (target.Scheme == Uri.UriSchemeHttp)
    {
      score += 10;
      reasons.Add("Unencrypted HTTP usage");
    }

    // 4. Final classification
    var isMalicious = score >= MALICIOUS_THRESHOLD;

    return new ThreatAnalysisResult
    {
      IsMalicious = isMalicious,
      Score = score,
      Reason = reasons
    };
  }

  private static bool IsSuspiciousDomain(string host)
  {
    var suspiciousPatterns = new[]
    {
            "login", "secure", "verify", "update-account", "bank"
        };

    return suspiciousPatterns.Any(p =>
        host.Contains(p, StringComparison.OrdinalIgnoreCase));
  }

  private static bool IsPrivateIp(IPAddress ip)
  {
    var bytes = ip.GetAddressBytes();

    return ip.AddressFamily switch
    {
      AddressFamily.InterNetwork =>
          bytes[0] == 10 ||
          (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
          (bytes[0] == 192 && bytes[1] == 168),

      _ => false
    };
  }
}