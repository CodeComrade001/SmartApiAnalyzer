// =============================================
// Interfaces
// File: Application/Interfaces/ILogService.cs
// =============================================
using Application.DTOs.Common;
using Application.DTOs.Logs;

namespace SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

public interface ILogService
{
  Task<ServiceResult<string>> IngestAsync(LogSchema.IngestLogRequest request);
  Task<ServiceResult<List<LogSchema.LogResponse>>> GetAllAsync();
  Task<ServiceResult<LogSchema.LogResponse>> GetByIdAsync(Guid id);
}