namespace SmartApiAnalyzer.Application.Services.Interface.Agent.Security;

public interface ISecurityHeaderInspectionService
{
  Task<SecurityHeaderResult> AnalyzeAsync(
      Uri uri,
      CancellationToken ct);
}

public sealed class SecurityHeaderResult
{
  public bool HasHsts { get; set; }
  public bool HasCsp { get; set; }
  public bool HasXFrameOptions { get; set; }
  public bool HasNoSniff { get; set; }

  public List<string> MissingHeaders { get; set; } = new();
}