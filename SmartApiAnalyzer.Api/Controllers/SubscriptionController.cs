using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/subscribe")]
public class SubscriptionController : ControllerBase
{
  private readonly ISubscriptionService _subscriptionService;

  public SubscriptionController(ISubscriptionService subscriptionService)
  {
    _subscriptionService = subscriptionService;
  }

  [HttpGet("packages")]
  public async Task<IActionResult> GetSummary([FromQuery] PaginationRequest request)
  {
    var result = await _subscriptionService.GetSubscriptionPackageAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }

  [HttpGet("cancel")]
  public async Task<IActionResult> GetEndpoints([FromQuery] PaginationRequest request)
  {
    var result = await _subscriptionService.GetSubscriptionCancelAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }

  [HttpGet("history")]
  public async Task<IActionResult> GetTopCost([FromQuery] PaginationRequest request)
  {
    var result = await _subscriptionService.GetSubscriptionHistoryAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }

  [HttpGet("download-history")]
  public async Task<IActionResult> GetDegradation([FromQuery] PaginationRequest request)
  {
    var result = await _subscriptionService.GetSubScriptionHistoryDownloadAsync();

    if (!result.Success)
      return BadRequest(result);

    return Ok(result);
  }
}