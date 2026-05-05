using Microsoft.AspNetCore.Mvc;
using Application.DTOs;
using Application.DTOs.Logs;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

namespace Api.Controllers;

[ApiController]
[Route("api/v1/logs")]
public class LogsController : ControllerBase
{
    private readonly ILogService _logService;

    public LogsController(ILogService logService)
    {
        _logService = logService;
    }

    [HttpPost("ingest")]
    public async Task<IActionResult> Ingest([FromBody] LogSchema.IngestLogRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var result = await _logService.IngestAsync(request);

        if (!result.Success)
            return BadRequest(result);

        return Accepted(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationRequest request)
    {
        var result = await _logService.GetAllAsync();

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest("Invalid Id");

        var result = await _logService.GetByIdAsync(id);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
}