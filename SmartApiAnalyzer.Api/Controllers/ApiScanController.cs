using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using Application.DTOs.ApiScan;

namespace Api.Controllers;

[ApiController]
[Route("api/v1")]
public class ApiScanController : ControllerBase
{
    private readonly IApiScanService _ApiScanService;

    public ApiScanController(IApiScanService logService)
    {
        _ApiScanService = logService;
    }

    [HttpPost("ingest")]
    public async Task<IActionResult> Ingest([FromBody] ApiScanSchema.StartApiScanRequest request, CancellationToken ct)
    {
        Console.WriteLine(request);

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var result = await _ApiScanService.IngestAsync(request, ct);
        Console.WriteLine(result);

        var debugger = result;

        if (!result.Success)
            return BadRequest(result);

        return Accepted(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllDomain([FromQuery] PaginationRequest request)
    {
        var result = await _ApiScanService.GetAllAsync();

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest("Invalid Id");

        var result = await _ApiScanService.GetByIdAsync(id);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPatch("update-endpoint")]
    public async Task<IActionResult> UpdateUrlEndpoints(ApiScanSchema.UpdateUrlEndpointsRequest request, CancellationToken ct)
    {
        if (request.ScanId == Guid.Empty)
            return BadRequest("Invalid Id");


        var result = await _ApiScanService.UpdateUrlEndpointsAsync(request.ScanId, request, ct);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost("start-scan")]
    public async Task<IActionResult> UrlExecutionButton(ApiScanSchema.StartApiScanExecutionRequest request, CancellationToken ct)
    {
        if (request.ScanId == Guid.Empty)
            return BadRequest("Invalid Id");

        var result = await _ApiScanService.StartApiScanExecutionAsync(request, ct);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
}