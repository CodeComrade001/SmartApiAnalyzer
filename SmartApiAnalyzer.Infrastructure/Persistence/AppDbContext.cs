using Microsoft.EntityFrameworkCore;
using SmartApiAnalyzer.Domain.Entities;

namespace SmartApiAnalyzer.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<LogEntry> Logs => Set<LogEntry>();
    public DbSet<EndpointMetrics> Metrics => Set<EndpointMetrics>();
}