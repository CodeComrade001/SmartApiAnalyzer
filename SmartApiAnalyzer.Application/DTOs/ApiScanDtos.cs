// =============================================
// DTOs
// File: Application/DTOs/ApiScan/ApiScanSchema.cs
// =============================================

using SmartApiAnalyzer.Domain.Models;

namespace Application.DTOs.ApiScan;

public static class ApiScanSchema
{
  public sealed class StartApiScanRequest
  {
    public string DomainUrl { get; set; } = default!;
  }

  public sealed class AgentScanResponse
  {
    public Guid ScanId { get; set; }
    public string AgentName { get; set; } = default!;
    public string DomainUrl { get; set; } = default!;
    public object? AgentResult { get; set; }
  }

  public sealed class defaultApiResponse
  {
    public string Message { get; set; } = default!;
    public object? Data { get; set; }
    public bool Success { get; set; }
    public int StatusCode { get; set; }
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
    public string Path { get; set; } = default!;

    public List<string> SuggestedMethods { get; set; }
        = new();
  }

  public sealed class UpdateUrlEndpointsRequest
  {
    public Guid ScanId { get; set; }
    public List<RouteInputDto> RoutesAndEndpoints { get; set; } = new();
  }

  public sealed class StartApiScanExecutionRequest
  {
    public Guid ScanId { get; set; }
    public string DomainUrl { get; set; } = default!;
    public Boolean ScanRequest { get; set; } = false;
    public List<RouteInputDto> RoutesAndEndpoints { get; set; } = new();
  }

}