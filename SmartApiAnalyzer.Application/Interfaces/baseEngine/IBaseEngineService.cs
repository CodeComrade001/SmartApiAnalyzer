
namespace SmartApiAnalyzer.Application.Services.Interface.BaseEngine;

public interface IBaseEngine
{
  Task<ReturnType> ExecuteAsync<ReturnType, T>(Guid id, T BaseEnginePayload);
}