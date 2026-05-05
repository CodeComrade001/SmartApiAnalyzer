// =============================================
// Services
// File: Infrastructure/Services/LogService.cs
// =============================================
using Application.DTOs.Common;
using Application.DTOs.Logs;
using Infrastructure.Common;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;
using SmartApiAnalyzer.Domain.Events;

namespace Infrastructure.Services;

public class LogService : ILogService
{
  private readonly ILogRepository _logRepository;
  private readonly IEventBus _eventBus;

  public LogService(
      ILogRepository logRepository,
      IEventBus eventBus)
  {
    _logRepository = logRepository;
    _eventBus = eventBus;
  }

  public Task<ServiceResult<List<LogSchema.LogResponse>>> GetAllAsync()
  {
    throw new NotImplementedException();
  }

  public Task<ServiceResult<LogSchema.LogResponse>> GetByIdAsync(Guid id)
  {
    throw new NotImplementedException();
  }

  public async Task<ServiceResult<string>> IngestAsync(
      LogSchema.IngestLogRequest request)
  {
    try
    {
      var log = new LogSchema.LogResponse
      {
        Id = Guid.NewGuid(),
        Endpoint = request.Endpoint,
        StatusCode = request.StatusCode,
        ResponseTimeMs = request.ResponseTimeMs,
        Timestamp = request.Timestamp
      };

      // _logs.Add(log);

      await _eventBus.PublishAsync(
          new LogIngestedEvent(
              log.Id,
              log.Endpoint,
              log.StatusCode,
              log.ResponseTimeMs,
              log.Timestamp
          ));

      return ServiceResult<string>.Ok("Log ingested successfully");
    }
    catch (Exception ex)
    {
      AppLogger.Error(ex.Message);

      return ServiceResult<string>.Fail(
          "Error ingesting log"
      );
    }
  }
}