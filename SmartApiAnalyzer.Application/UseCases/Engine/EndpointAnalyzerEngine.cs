using SmartApiAnalyzer.Application.Services.Interface.BaseEngine;

namespace SmartApiAnalyzer.Application.UseCases.Engine;

public class EndpointAnalyzerEngine : IBaseEngine
{


  public Task<ReturnType> ExecuteAsync<ReturnType, T>(Guid id, T BaseEnginePayload)
  {
    throw new NotImplementedException();
  }

}