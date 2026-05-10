namespace SmartApiAnalyzer.Application.Services.Interface.Agent.Security;

public interface ISslTlsInspectionService
{
  Task<SslTlsInspectionResult> AnalyzeAsync(
      Uri uri,
      CancellationToken ct);
}

public sealed class SslTlsInspectionResult
{
  public bool ValidCertificate { get; set; }
  public DateTimeOffset ExpiresAt { get; set; }
  public int DaysRemaining { get; set; }
  public string Protocol { get; set; } = "";
}