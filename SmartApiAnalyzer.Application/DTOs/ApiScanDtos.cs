// =============================================
// DTOs
// File: Application/DTOs/ApiScan/ApiScanSchema.cs
// =============================================

namespace Application.DTOs.ApiScan;

public static class ApiScanSchema
{
  public sealed class StartApiScanRequest
  {
    public string DomainUrl { get; set; } = default!;
  }

  public sealed class ApiScanResultResponse
  {
    public Guid ScanId { get; set; }

    public string DomainUrl { get; set; } = default!;

    public List<EndpointResponse> Endpoints { get; set; }
        = new();
  }

  public sealed class EndpointResponse
  {
    public Guid EndpointId { get; set; }

    public string Path { get; set; } = default!;

    public List<string> SuggestedMethods { get; set; }
        = new();
  }
}