// =============================================
// Interfaces
// File: Application/Interfaces/ILogService.cs
// =============================================
using Application.DTOs.ApiScan;
using Application.DTOs.Common;

namespace SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

public interface IApiScanService
{
  Task<ServiceResult<ApiScanSchema.ApiScanResultResponse>> IngestAsync(
          ApiScanSchema.StartApiScanRequest request,
          CancellationToken ct
          );
  Task<ServiceResult<List<ApiScanSchema.ApiScanResultResponse>>> GetAllAsync();
  Task<ServiceResult<ApiScanSchema.ApiScanResultResponse>> GetByIdAsync(Guid id);
  Task<ServiceResult<ApiScanSchema.defaultApiResponse>> UpdateUrlEndpointsAsync(Guid id, ApiScanSchema.UpdateUrlEndpointsRequest request, CancellationToken ct);

  // this endpoint return response is not known yet, so we will use the defaultApiResponse as a placeholder for now.
  Task<ServiceResult<ApiScanSchema.AgentScanResponse>> StartApiScanExecutionAsync(ApiScanSchema.StartApiScanExecutionRequest request, CancellationToken ct);
}