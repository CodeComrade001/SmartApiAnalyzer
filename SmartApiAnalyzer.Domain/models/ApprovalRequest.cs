// =============================================
// File: Domain/Models/ApprovalRequest.cs
// =============================================
namespace SmartApiAnalyzer.Domain.Models;

public sealed class ApprovalRequest
{
  public Guid TenantId { get; set; }

  public List<RouteInputDto> Routes { get; set; } = new();
}