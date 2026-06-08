namespace SmartApiAnalyzer.Domain.Entities.Payload;

public sealed class GateKeeperPayload
{
  public string domainUrl { get; set; } = string.Empty;
  public string host { get; set; } = string.Empty;
  public string scheme { get; set; } = string.Empty;
  public int port { get; set; }
  public List<EndpointRouteDto> routesPayload { get; init; } = new();
  public int endpointCount { get; set; }
  public double threatScore { get; set; }
  public bool safe { get; set; }
}

public sealed class EndpointRouteDto
{
  public string route { get; set; } = default!;

  public List<string> methods { get; set; } = new();
}