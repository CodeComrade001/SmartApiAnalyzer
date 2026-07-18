using System.Collections.Concurrent;
using SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;

namespace SmartApiAnalyzer.Infrastructure.TempFiles.TemporaryInMemoryStorage;

public class TemporaryInMemoryStorage<T> : ITemporaryInMemoryStorage<T>
{
  private const int MAX_STORAGE = 100;

  private readonly ConcurrentDictionary<string, T> _storage =
      new ConcurrentDictionary<string, T>();

  public bool StoreScanResult(Guid tenancyReceivedId, string agentName, T value)
  {
    if (_storage.Count >= MAX_STORAGE)
      return false;

    var key = $"{tenancyReceivedId}:{agentName}";
    return _storage.TryAdd(key, value);
  }

  public T? GetScanResult(Guid tenancyReceivedId, string agentName)

  {
    var key = $"{tenancyReceivedId}:{agentName}";
    _storage.TryGetValue(key, out var value);
    return value;
  }

  public bool RemoveScanResult(Guid tenancyReceivedId, string agentName)
  {
    var key = $"{tenancyReceivedId}:{agentName}";
    return _storage.TryRemove(key, out _);
  }

  public int Count(Guid tenancyReceivedId)
  {
    return _storage.Count(AbandonedMutexException => AbandonedMutexException.Key.StartsWith($"{tenancyReceivedId}:"));
  }

  public void Clear(Guid tenancyReceivedId)
  {
    var keysToRemove = _storage.Keys.Where(key => key.StartsWith($"{tenancyReceivedId}:")).ToList();
    foreach (var key in keysToRemove)
    {
      _storage.TryRemove(key, out _);
    }
  }
}

