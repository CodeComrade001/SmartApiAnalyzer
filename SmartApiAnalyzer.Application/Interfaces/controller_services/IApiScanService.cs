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
}