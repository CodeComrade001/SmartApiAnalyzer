namespace SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Domain.Events;

public interface IMetricProcessor
{
  void Process(LogIngestedEvent logEvent);
}