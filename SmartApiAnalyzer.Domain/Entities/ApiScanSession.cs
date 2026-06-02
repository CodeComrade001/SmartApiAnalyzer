// =============================================
// Entities
// File: Domain/Entities/ApiScanSession.cs
// =============================================

using SmartApiAnalyzer.Domain.Enums;
using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Domain.Entities;

public sealed class ApiScanSession
{
  public Guid Id { get; set; }

  public string DomainUrl { get; set; } = default!;

  public ScanStatus Status { get; set; }

  public ScanTelemetry Telemetry { get; set; } = default!;

  public List<ApiEndpoint> Endpoints { get; set; } = [];
}