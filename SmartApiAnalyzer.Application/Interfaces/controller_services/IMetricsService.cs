// =============================================
// Interfaces
// File: Application/Interfaces/IMetricsService.cs
// =============================================
using Application.DTOs.Common;
using Application.DTOs.Metrics;

namespace SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

public interface IMetricsService
{
  Task<ServiceResult<MetricsSchema.SummaryResponse>> GetSummaryAsync();

  Task<ServiceResult<List<MetricsSchema.EndpointMetricResponse>>> GetEndpointsAsync();

  Task<ServiceResult<List<MetricsSchema.TopCostResponse>>> GetTopCostAsync();

  Task<ServiceResult<List<MetricsSchema.DegradationResponse>>> GetDegradationAsync();
}