// =============================================
// Models
// File: Domain/Models/ScanTelemetry.cs
// =============================================

namespace SmartApiAnalyzer.Domain.Models;

public sealed class ScanTelemetry
{
  public int StatusCode { get; set; }

  public double ResponseTimeMs { get; set; }

  public DateTime Timestamp { get; set; }
}