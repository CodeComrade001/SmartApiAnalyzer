namespace Application.DTOs.ApiScan;

public sealed class ApiEndpointDto
{
  public Guid EndpointId { get; init; }

  public string Path { get; init; } = string.Empty;

  public List<string> Methods { get; init; } = [];

  public bool RequiresAuthentication { get; init; }

  public bool IsPublic { get; init; }
}