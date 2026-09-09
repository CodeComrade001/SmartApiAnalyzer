

namespace SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;

public interface ITemporaryInMemoryStorage<T>
{
  bool StoreScanResult(Guid tenancyReceivedId, string agentName, T result);

  T? GetScanResult(Guid tenancyReceivedId, string agentName);

  T? GetSUserResult(Guid tenancyReceivedId);

  bool GetIfUserExist(Guid tenancyReceivedId);

  bool RemoveScanResult(Guid tenancyReceivedId, string agentName);

  int Count(Guid tenancyReceivedId);

  void Clear(Guid tenancyReceivedId);
}