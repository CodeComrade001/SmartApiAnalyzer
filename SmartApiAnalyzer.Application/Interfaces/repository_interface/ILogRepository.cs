
using Domain.Entities;

namespace SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;

public interface ILogRepository
{
    Task AddAsync(LogEntry log);
    Task<List<LogEntry>> GetByTenantAsync(string tenantId);
}