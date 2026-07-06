using System.Collections.Concurrent;
using SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;

namespace SmartApiAnalyzer.Infrastructure.TempFiles.TemporaryInMemoryStorage;

public class TemporaryInMemoryStorage<T> : ITemporaryInMemoryStorage<T>
{
  private const int MAX_STORAGE = 100;

  private readonly ConcurrentDictionary<string, T> _storage =
      new ConcurrentDictionary<string, T>();

  public bool StoreScanResult(string key, T value)
  {
    if (_storage.Count >= MAX_STORAGE)
      return false;

    return _storage.TryAdd(key, value);
  }

  public T? GetScanResult(string key)
  {
    _storage.TryGetValue(key, out var value);
    return value;
  }

  public bool RemoveScanResult(string key)
  {
    return _storage.TryRemove(key, out _);
  }

  public int Count()
  {
    return _storage.Count;
  }

  public void Clear()
  {
    _storage.Clear();
  }
}

