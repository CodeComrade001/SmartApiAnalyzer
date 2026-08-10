// =============================================
// Entities
// File: Domain/Entities/DiscoveredEndpoint.cs
// =============================================

namespace SmartApiAnalyzer.Domain.Entities;

public sealed class DiscoveredEndpoint
{
  public Guid Id { get; set; }

  public string Path { get; set; } = default!;

  public List<string> Methods { get; set; }
      = new();
}