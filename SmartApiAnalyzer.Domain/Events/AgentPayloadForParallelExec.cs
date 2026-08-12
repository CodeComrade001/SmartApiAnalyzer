
using SmartApiAnalyzer.Domain.Models;

namespace SmartApiAnalyzer.Domain.Events;

public sealed record AgentWorkItem(
    Guid Id,
    RouteInputDto Route,
    object? Payload
)
{
  public string Endpoint => Route.Route;

  public string Method => Route.Methods.FirstOrDefault() ?? string.Empty;
}