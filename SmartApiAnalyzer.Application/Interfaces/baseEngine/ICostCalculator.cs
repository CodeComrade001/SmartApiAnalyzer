namespace SmartApiAnalyzer.Application.Services.Interface.BaseEngine;

public interface ICostCalculator
{
    double CalculateCost(double latency, int frequency, double errorRate);
}