using Domain.Entities;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;
using SmartApiAnalyzer.Infrastructure.Persistence;

namespace SmartApiAnalyzer.Infrastructure.Repositories;

public class MetricRepository : ILogRepository
{
  private readonly AppDbContext _db;

  public MetricRepository(AppDbContext db)
  {
    _db = db;
  }

  public async Task AddAsync(LogEntry log)
  {
    _db.Logs.Add(log);
    // await _db.SaveChangesAsync();
  }

  public async Task<List<LogEntry>> GetByTenantAsync(string tenantId)
  {
    return await _db.Logs
        .Where(x => x.TenantId == tenantId)
        .ToListAsync();
  }
}