// =============================================
// Services
// File: Infrastructure/Services/MetricsService.cs
// =============================================
using Application.DTOs.Common;
using Application.DTOs.Metrics;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
namespace SmartApiAnalyzer.Application.Services;

public class MetricsService : IMetricsService
{
    // private readonly EndpointAnalyzerEngine endpointAnalyzerEngine;


    public async Task<ServiceResult<MetricsSchema.SummaryResponse>> GetSummaryAsync()
    {
        var data = new MetricsSchema.SummaryResponse
        {
            TotalRequests = 12450,
            AverageLatency = 182,
            ErrorRate = 1.7,
            ActiveEndpoints = 14
        };

        return await Task.FromResult(
            ServiceResult<MetricsSchema.SummaryResponse>.Ok(data)
        );
    }

    public async Task<ServiceResult<List<MetricsSchema.EndpointMetricResponse>>> GetEndpointsAsync()
    {
        var data = new List<MetricsSchema.EndpointMetricResponse>
        {
            new()
            {
                Endpoint = "/api/orders",
                TotalRequests = 5400,
                AverageLatency = 210,
                P95Latency = 390,
                ErrorRate = 2.1
            },
            new()
            {
                Endpoint = "/api/users",
                TotalRequests = 3000,
                AverageLatency = 90,
                P95Latency = 180,
                ErrorRate = 0.6
            }
        };

        return await Task.FromResult(
            ServiceResult<List<MetricsSchema.EndpointMetricResponse>>.Ok(data)
        );
    }

    public async Task<ServiceResult<List<MetricsSchema.TopCostResponse>>> GetTopCostAsync()
    {
        var data = new List<MetricsSchema.TopCostResponse>
        {
            new() { Endpoint = "/api/reports", CostScore = 97 },
            new() { Endpoint = "/api/orders", CostScore = 84 }
        };

        return await Task.FromResult(
            ServiceResult<List<MetricsSchema.TopCostResponse>>.Ok(data)
        );
    }

    public async Task<ServiceResult<List<MetricsSchema.DegradationResponse>>> GetDegradationAsync()
    {
        var data = new List<MetricsSchema.DegradationResponse>
        {
            new()
            {
                Endpoint = "/api/orders",
                PreviousLatency = 120,
                CurrentLatency = 240,
                DegradationPercent = 100
            }
        };

        return await Task.FromResult(
            ServiceResult<List<MetricsSchema.DegradationResponse>>.Ok(data)
        );
    }
}