using Application.DTOs;
using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;

namespace Application.UseCases.IngestLog;

public class IngestLogUseCase
{
    private readonly ILogRepository _repo;

    public IngestLogUseCase(ILogRepository repo)
    {
        _repo = repo;
    }

    public async Task ExecuteAsync(Guid tenantId, IngestLogRequest request)
    {
        var log = new LogEntry
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Endpoint = request.Endpoint,
            // Method = request.Method,
            StatusCode = request.StatusCode,
            ResponseTimeMs = request.ResponseTimeMs,
            TimestampUtc = DateTime.UtcNow
        };

        // await _repo.AddAsync(log);

        // Later → publish event

    }
}