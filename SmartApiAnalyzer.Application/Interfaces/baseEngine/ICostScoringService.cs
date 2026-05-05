namespace SmartApiAnalyzer.Application.Services.Interface.BaseEngine;

public interface ICostScoringService
{
  double CalculateCostScore(int latency, double errorRate, long frequency);
}