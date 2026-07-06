

namespace SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;

public interface ITemporaryInMemoryStorage<T>
{
  bool StoreScanResult(string key, T value);

  T? GetScanResult(string key);

  bool RemoveScanResult(string key);

  int Count();

  void Clear();
}