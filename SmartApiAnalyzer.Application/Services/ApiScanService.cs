using System.Diagnostics;
using Application.DTOs.ApiScan;
using Application.DTOs.Common;
using Infrastructure.Common;
using SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;
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
  public readonly ITemporaryInMemoryStorage<ApiScanSchema.ApiScanResultResponse> _temporaryStorage;

  public ApiScanService(
      // IApiScanRepository scanRepository,
      IGateKeeperAgent gatekeeperAgent,
      ITemporaryInMemoryStorage<ApiScanSchema.ApiScanResultResponse> temporaryStorage,
      IEventBus eventBus)
  {
    // _scanRepository = scanRepository;
    _temporaryStorage = temporaryStorage;
    _gatekeeperAgent = gatekeeperAgent;
    _eventBus = eventBus;
  }

  /*//////////////////////////////////////////////////////////////
                            HELPER METHODS
    //////////////////////////////////////////////////////////////*/

  private Boolean verifyUserGuid(Guid id)
  {
    return id != Guid.Empty;
  }
  private Boolean verifyUpdateUrlPayload(ApiScanSchema.UpdateUrlEndpointsRequest receivedEndpoints)
  {
    var endpoints = receivedEndpoints.RoutesAndEndpoints;

    if (endpoints == null || endpoints.Count == 0)
    {
      return false;
    }

    // foreach (var endpoint in endpoints)
    // {
    //   if (string.IsNullOrWhiteSpace(endpoint.Path) || endpoint.SuggestedMethods == null || endpoint.SuggestedMethods.Count == 0)
    //   {
    //     return false;
    //   }
    // }

    return true;
  }



  /*//////////////////////////////////////////////////////////////
                              MAIN METHODS 
      //////////////////////////////////////////////////////////////*/
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

      var storageResult = _temporaryStorage.StoreScanResult(scanId, "IngestAsync Function", response);

      if (!storageResult)
      {
        return ServiceResult<ApiScanSchema.ApiScanResultResponse>
            .Fail("Failed to store scan result in temporary storage.");
      }

      // =========================================================
      // API Response
      // =========================================================

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

  public async Task<ServiceResult<ApiScanSchema.AgentScanResponse>> StartApiScanExecutionAsync(ApiScanSchema.StartApiScanExecutionRequest request, CancellationToken ct)
  {

    var isUserGuidVerified = verifyUserGuid(request.ScanId);
    if (!isUserGuidVerified) return ServiceResult<ApiScanSchema.AgentScanResponse>.Fail("Invalid Scan Id");
    var isScanRequestTrue = request.ScanRequest;
    if (!isScanRequestTrue) return ServiceResult<ApiScanSchema.AgentScanResponse>.Confirmed("Agent Execution not initiated by user");

    try
    {

      var userApprovedEvent = new UserApprovedScanEvent(
              request.ScanId,
              request.DomainUrl,
              request.RoutesAndEndpoints,
              0,
              0,
              DateTime.UtcNow,
              request.Agents);

      await _eventBus.PublishAsync(userApprovedEvent, ct);

      var isDatabaseUpdated = _temporaryStorage.StoreScanResult(request.ScanId, "StartApiScanExecutionAsync function", new ApiScanSchema.ApiScanResultResponse()); // mock the database update result
      if (!isDatabaseUpdated) return ServiceResult<ApiScanSchema.AgentScanResponse>.Fail("Scan execution failed");


      return ServiceResult<ApiScanSchema.AgentScanResponse>.Confirmed("Scan execution started successfully");
    }
    catch (OperationCanceledException)
    {
      return ServiceResult<ApiScanSchema.AgentScanResponse>
          .Fail("Start Agent Execution operation was cancelled");
    }
    catch (Exception ex)
    {
      AppLogger.Error(ex.ToString());

      return ServiceResult<ApiScanSchema.AgentScanResponse>
          .Fail("Scan failed");
    }
  }


  public async Task<ServiceResult<ApiScanSchema.defaultApiResponse>> UpdateUrlEndpointsAsync(Guid id, ApiScanSchema.UpdateUrlEndpointsRequest request, CancellationToken ct)
  {
    var isUserGuidVerified = verifyUserGuid(request.ScanId);
    if (!isUserGuidVerified) return ServiceResult<ApiScanSchema.defaultApiResponse>.Fail("Invalid Scan Id");
    var isScanRequestTrue = verifyUpdateUrlPayload(request);
    if (!isScanRequestTrue) return ServiceResult<ApiScanSchema.defaultApiResponse>.Fail("Invalid endpoints payload");

    try
    {

      var isDatabaseUpdated = _temporaryStorage.StoreScanResult(request.ScanId, "UpdateUrlEndpointsAsync Function", new ApiScanSchema.ApiScanResultResponse()); // mock the database update result
      if (!isDatabaseUpdated) return ServiceResult<ApiScanSchema.defaultApiResponse>.Fail("Failed to update URL endpoints");

      return ServiceResult<ApiScanSchema.defaultApiResponse>.Ok(new ApiScanSchema.defaultApiResponse());
    }
    catch (OperationCanceledException)
    {
      return ServiceResult<ApiScanSchema.defaultApiResponse>
          .Fail("Update URL endpoints operation was cancelled");
    }
    catch (Exception ex)
    {
      AppLogger.Error(ex.ToString());

      return ServiceResult<ApiScanSchema.defaultApiResponse>
          .Fail("Update URL endpoints failed");
    }

  }

}