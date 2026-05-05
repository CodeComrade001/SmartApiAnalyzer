using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/metrics")]
public class MetricsController : ControllerBase
{
  private readonly IMetricsService _metricsService;

  public MetricsController(IMetricsService metricsService)
  {
    _metricsService = metricsService;
  }

  [HttpGet("summary")]
  public async Task<IActionResult> GetSummary()
  {
    var result = await _metricsService.GetSummaryAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }

  [HttpGet("endpoints")]
  public async Task<IActionResult> GetEndpoints([FromQuery] PaginationRequest request)
  {
    var result = await _metricsService.GetEndpointsAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }

  [HttpGet("top-cost")]
  public async Task<IActionResult> GetTopCost([FromQuery] PaginationRequest request)
  {
    var result = await _metricsService.GetTopCostAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }

  [HttpGet("degradation")]
  public async Task<IActionResult> GetDegradation([FromQuery] PaginationRequest request)
  {
    var result = await _metricsService.GetDegradationAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }
}