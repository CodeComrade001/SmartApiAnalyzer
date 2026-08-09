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
    private static readonly Guid GlobalGuid = Guid.Parse("12345678-1234-1234-1234-123456789ABC");

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

    [HttpGet("user/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        Console.WriteLine($"Received Id: {id}");
        Console.WriteLine($"GetById was HIT ========");

        if (id == Guid.Empty)
            return BadRequest("Invalid Id");

        Console.WriteLine($"Id wad verified successful ");
        var result = await _ApiScanService.GetByIdAsync(id);

        Console.WriteLine($"result after getByIdAsync: {result}");
        if (!result.Success)
            return NotFound(result);

        Console.WriteLine($"successful result after getByIdAsync: {result.Data}");
        return Ok(result);
    }

    [HttpPatch("update-endpoint")]
    public async Task<IActionResult> UpdateUrlEndpoints(ApiScanSchema.UpdateUrlEndpointsRequest request, CancellationToken ct)
    {

        var result = await _ApiScanService.UpdateUrlEndpointsAsync(GlobalGuid, request, ct);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost("start-scan")]
    public async Task<IActionResult> UrlExecutionButton(List<ApiScanSchema.StartApiScanExecutionRequest> request, CancellationToken ct)
    {
        Console.WriteLine("START SCAN HIT");
        // if (request.ScanId == Guid.Empty)
        //     return BadRequest("Invalid Id");

        var result = await _ApiScanService.StartApiScanExecutionAsync(request, ct);

        Console.WriteLine($"Success = {result.Success}");
        Console.WriteLine($"Message = {result.Message}");
        // if (!result.Success)
        //     return NotFound(result);

        return Ok(result);
    }
}