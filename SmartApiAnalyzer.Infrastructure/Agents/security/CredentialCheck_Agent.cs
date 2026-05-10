using System.Diagnostics;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Constants;
using SmartApiAnalyzer.Domain.Entities.Models;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;

namespace SmartApiAnalyzer.Infrastructure.Agents;

public sealed class CredentialCheck_Agent : IAgent
{
  private readonly ICredentialExposureService _credentialService;

  // public CredentialCheck_Agent(
  //     ICredentialExposureService credentialService)
  // {
  //   _credentialService = credentialService;
  // }

  public string Name => AgentType.CredentialCheck.ToSystemName();

  public int Priority => 2;

  public async Task<AgentResult> ExecuteAsync(
      LogIngestedEvent evt,
      CancellationToken ct)
  {
    var sw = Stopwatch.StartNew();

    try
    {
      ct.ThrowIfCancellationRequested();

      var rawUrl = evt.Endpoint?.Trim();

      if (string.IsNullOrWhiteSpace(rawUrl))
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "URL is required.",
            sw.Elapsed);
      }

      if (!Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri))
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "Invalid URL.",
            sw.Elapsed);
      }

      var result = await _credentialService.AnalyzeAsync(uri, ct);

      var payload = new Dictionary<string, object>
      {
        ["HasLoginForm"] = result.HasLoginForm,
        ["UsesHttps"] = result.UsesHttps,
        ["CookieSecure"] = result.CookieSecure,
        ["CookieHttpOnly"] = result.CookieHttpOnly,
        ["CookieSameSite"] = result.CookieSameSite,
        ["MissingSecurityHeaders"] = result.MissingHeaders,
        ["ExposedSecretsFound"] = result.ExposedSecretsFound,
        ["RiskScore"] = result.RiskScore
      };

      if (result.IsCriticalRisk)
      {
        return AgentRequestFactory.CriticalStop(
            Name,
            "Credential exposure risk detected.",
            sw.Elapsed);
      }

      return AgentRequestFactory.Ok(
          Name,
          "Credential posture check completed.",
          sw.Elapsed,
          payload);
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
      throw;
    }
    catch (Exception ex)
    {
      return AgentRequestFactory.CriticalStop(
          Name,
          $"Credential check failed: {ex.GetType().Name}: {ex.Message}",
          sw.Elapsed);
    }
    finally
    {
      sw.Stop();
    }
  }
}