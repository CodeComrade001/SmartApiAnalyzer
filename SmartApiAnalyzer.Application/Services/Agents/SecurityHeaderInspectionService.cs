using SmartApiAnalyzer.Application.Services.Interface.Agent.Security;

namespace SmartApiAnalyzer.Application.Services.Agents;

public class SecurityHeaderInspectionService : ISecurityHeaderInspectionService
{
  public Task<SecurityHeaderResult> AnalyzeAsync(Uri uri, CancellationToken ct)
  {
    throw new NotImplementedException();
  }
}