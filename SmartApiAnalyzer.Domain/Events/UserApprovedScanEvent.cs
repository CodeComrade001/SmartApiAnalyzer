using SmartApiAnalyzer.Domain.Entities.Models.Result.AgentServiceResults;
using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Domain.Events;

public sealed class UserApprovedScanEvent
{
  public Guid EventId { get; }
  public Guid TenantId { get; }
  public string domainUrl { get; }
  public int StatusCode { get; }
  public double ResponseTimeMs { get; }
  public DateTime Timestamp { get; }


  public List<string> UserSelectedAgents { get; set; }
  // Resume / approval flow
  public Guid SessionId { get; set; }
  public List<RouteInputDto> ApprovedRoutesAndMethods { get; set; } = new();

  // Accumulated agent payloads — written by coordinator after each agent
  public Dictionary<string, Dictionary<string, object>> AgentPayloads { get; } = new();

  public UserApprovedScanEvent(
      Guid tenantId,
      string passedDomainUrl,
      List<RouteInputDto> approvedRoutesAndMethods,
      int statusCode,
      double responseTimeMs,
      DateTime timestamp,
      List<string> userSelectedAgents)
  {
    EventId = Guid.NewGuid();
    TenantId = tenantId;
    domainUrl = passedDomainUrl;
    StatusCode = statusCode;
    ResponseTimeMs = responseTimeMs;
    Timestamp = timestamp;
    ApprovedRoutesAndMethods = approvedRoutesAndMethods;
    UserSelectedAgents = userSelectedAgents;
  }

  public sealed record AgentWorkItem(
    Guid Id,
    string Endpoint,
    string Method,
    object? Payload)
  {

  };

  public List<AgentResult<object>> AgentResults { get; init; } = new();
}