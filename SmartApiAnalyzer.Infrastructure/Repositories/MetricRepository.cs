using SmartApiAnalyzer.Domain.Entities;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;
// using SmartApiAnalyzer.Infrastructure.Persistence;

namespace SmartApiAnalyzer.Infrastructure.Repositories;

public class MetricRepository : ILogRepository
{
  // private readonly AppDbContext _db;

  // public MetricRepository(AppDbContext db)
  // {
  //   _db = db;
  // }

  public async Task AddAsync(LogEntry log)
  {
    // _db.Logs.Add(log);
    // await _db.SaveChangesAsync();
    throw new NotImplementedException();
  }

  public Task<List<LogEntry>> GetByTenantAsync(string tenantId)
  {
    throw new NotImplementedException();
  }
}