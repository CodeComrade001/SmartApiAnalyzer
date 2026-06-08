using System.Diagnostics;
using Application.DTOs.ApiScan;
using Application.DTOs.Common;
using Infrastructure.Common;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Domain.Events;
using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Application.Services;

public class ApiScanService : IApiScanService
{
  // private readonly IApiScanRepository _scanRepository;
  private readonly IGateKeeperAgent _gatekeeperAgent;
  private readonly IEventBus _eventBus;

  public ApiScanService(
      // IApiScanRepository scanRepository,
      IGateKeeperAgent gatekeeperAgent,
      IEventBus eventBus)
  {
    // _scanRepository = scanRepository;
    _gatekeeperAgent = gatekeeperAgent;
    _eventBus = eventBus;
  }

  public Task<ServiceResult<List<ApiScanSchema.ApiScanResultResponse>>> GetAllAsync()
  {
    throw new NotImplementedException();
  }

  public Task<ServiceResult<ApiScanSchema.ApiScanResultResponse>> GetByIdAsync(Guid id)
  {
    throw new NotImplementedException();
  }

  public async Task<ServiceResult<ApiScanSchema.ApiScanResultResponse>> IngestAsync(
          ApiScanSchema.StartApiScanRequest request,
          CancellationToken ct)
  {
    try
    {
      var stopwatch = Stopwatch.StartNew();

      // =========================================================
      // Create Scan Session Id
      // =========================================================

      var scanId = Guid.NewGuid();

      // =========================================================
      // Create Event
      // =========================================================

      var gateKeeperEvent = new GateKeeperIngestedEvent(
          scanId,
          request.DomainUrl,
          0,
          0,
          DateTime.UtcNow);

      // =========================================================
      // Execute Gatekeeper Agent
      // =========================================================

      var gatekeeperResult = await _gatekeeperAgent.ExecuteAsync(
          gateKeeperEvent,
          ct);
      Console.WriteLine($"GateKeeper Agent executed in {stopwatch.Elapsed.TotalSeconds} seconds with success: {gatekeeperResult.Success} found {gatekeeperResult.PayloadObject} endpoints.");
      // =========================================================
      // Validate Agent Result
      // =========================================================

      if (!gatekeeperResult.Success)
      {
        return ServiceResult<ApiScanSchema.ApiScanResultResponse>
            .Fail(gatekeeperResult.Message);
      }

      // =========================================================
      // Extract Payload
      // =========================================================

      if (!gatekeeperResult.Success)
      {
        return ServiceResult<ApiScanSchema.ApiScanResultResponse>
            .Fail(gatekeeperResult.Message);
      }

      if (gatekeeperResult.Payload == null)
      {
        return ServiceResult<ApiScanSchema.ApiScanResultResponse>
            .Fail(gatekeeperResult.Message);
      }

      var endpoints = gatekeeperResult.Payload.routesPayload;

      // =========================================================
      // Publish Event For Background Workers
      // =========================================================

      // await _eventBus.PublishAsync(
      //     gateKeeperEvent,
      //     ct);

      stopwatch.Stop();

      // =========================================================
      // Telemetry
      // =========================================================

      var telemetry = new ScanTelemetry
      {
        StatusCode = 200,
        ResponseTimeMs = stopwatch.Elapsed.TotalMilliseconds,
        Timestamp = DateTime.UtcNow
      };

      // =========================================================
      // Create Database Entity
      // =========================================================

      var scanSession = new ApiScanSession
      {
        Id = scanId,
        DomainUrl = request.DomainUrl,
        Status = ScanStatus.PendingApproval,
        Telemetry = telemetry,
        Endpoints = endpoints
      };

      // =========================================================
      // Save To Database
      // =========================================================

      // await _scanRepository.SaveAsync(scanSession, ct);

      // =========================================================
      // API Response
      // =========================================================

      var response = new ApiScanSchema.ApiScanResultResponse
      {
        ScanId = scanSession.Id,
        DomainUrl = scanSession.DomainUrl,

        Endpoints = scanSession.Endpoints
              .Select(e => new ApiScanSchema.EndpointResponse
              {
                Path = e.route,
                SuggestedMethods = e.methods
              })
              .ToList()
      };

      Console.WriteLine($"Scan {scanId} completed in {stopwatch.Elapsed.TotalSeconds} seconds with {endpoints.Count()} endpoints found.");
      return ServiceResult<ApiScanSchema.ApiScanResultResponse>
          .Ok(response);
    }
    catch (OperationCanceledException)
    {
      return ServiceResult<ApiScanSchema.ApiScanResultResponse>
          .Fail("Scan operation was cancelled");
    }
    catch (Exception ex)
    {
      AppLogger.Error(ex.ToString());

      return ServiceResult<ApiScanSchema.ApiScanResultResponse>
          .Fail("Scan failed");
    }
  }
}