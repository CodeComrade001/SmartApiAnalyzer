using Application.DTOs.ApiScan;
using SmartApiAnalyzer.Domain.Entities;

namespace Application.Mappers;

public static class ApiEndpointMapper
{
  public static ApiEndpointDto ToDto(this ApiEndpoint endpoint)
  {
    return new ApiEndpointDto
    {
      EndpointId = endpoint.Id,
      Path = endpoint.Path,
      Methods = endpoint.Methods.ToList(),
      RequiresAuthentication = endpoint.RequiresAuthentication,
      IsPublic = endpoint.IsPublic
    };
  }

  public static List<ApiEndpointDto> ToDtoList(
      this IEnumerable<ApiEndpoint> endpoints)
  {
    return endpoints
        .Select(ToDto)
        .ToList();
  }
}