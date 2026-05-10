public interface ICredentialExposureService
{
  Task<CredentialExposureResult> AnalyzeAsync(
      Uri uri,
      CancellationToken ct);
}

public sealed class CredentialExposureResult
{
  public bool HasLoginForm { get; set; }
  public bool UsesHttps { get; set; }

  public bool CookieSecure { get; set; }
  public bool CookieHttpOnly { get; set; }
  public bool CookieSameSite { get; set; }

  public bool ExposedSecretsFound { get; set; }

  public bool IsCriticalRisk { get; set; }

  public int RiskScore { get; set; }

  public List<string> MissingHeaders { get; set; } = new();
}