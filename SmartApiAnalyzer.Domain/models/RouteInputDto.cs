// =============================================
// File: Domain/Models/RouteInputDto.cs
// =============================================
namespace SmartApiAnalyzer.Domain.Models;

public sealed class RouteInputDto
{
  public string Route { get; set; } = default!;

  public List<string> Methods { get; set; } = new();
}