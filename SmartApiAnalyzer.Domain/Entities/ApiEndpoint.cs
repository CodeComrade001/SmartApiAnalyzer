namespace SmartApiAnalyzer.Domain.Entities;

public sealed class ApiEndpoint
{
  public Guid Id { get; set; }

  public string Path { get; set; } = string.Empty;

  public List<string> Methods { get; set; } = [];

  // =========================================================
  // Security Metadata
  // =========================================================

  public bool RequiresAuthentication { get; set; }

  public bool IsPublic { get; set; }

  // =========================================================
  // Discovery Metadata
  // =========================================================

  public bool IsDeprecated { get; set; }

  public bool IsInternal { get; set; }

  // =========================================================
  // Telemetry / Intelligence
  // =========================================================

  public double RiskScore { get; set; }

  public double CostScore { get; set; }

  public DateTime DiscoveredAt { get; set; } = DateTime.UtcNow;

  // =========================================================
  // Relationship
  // =========================================================

  public Guid ScanSessionId { get; set; }

  public ApiScanSession? ScanSession { get; set; }
}