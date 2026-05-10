using Application.UseCases.IngestLog;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartApiAnalyzer.Api.Validators;
using SmartApiAnalyzer.Application.Services;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;
using SmartApiAnalyzer.Application.UseCases.Metrics;
using SmartApiAnalyzer.Infrastructure.Agents;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;
using SmartApiAnalyzer.Infrastructure.Persistence;
using SmartApiAnalyzer.Infrastructure.queue;
using SmartApiAnalyzer.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ======================================================
// CORE FRAMEWORK SERVICES
// ======================================================

builder.Services.AddControllers();
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlServer(
//         builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services
    .AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters();

builder.Services.AddValidatorsFromAssemblyContaining<IngestLogValidator>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
  options.InvalidModelStateResponseFactory = context =>
  {
    var errors = context.ModelState
          .Where(x => x.Value?.Errors.Count > 0)
          .Select(x => new
          {
            Field = x.Key,
            Errors = x.Value!.Errors.Select(e => e.ErrorMessage)
          });

    return new BadRequestObjectResult(new
    {
      Success = false,
      Message = "Validation failed.",
      Errors = errors
    });
  };
});



// ======================================================
// APPLICATION SERVICES
// ======================================================

builder.Services.AddScoped<ILogService, LogService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddScoped<ISubscriptionService, SUbscriptionService>();



// ======================================================
// REPOSITORIES
// ======================================================

builder.Services.AddScoped<ILogRepository, LogRepository>();



// ======================================================
// EVENT SYSTEM
// ======================================================

builder.Services.AddSingleton<IEventQueue, InMemoryEventQueue>();
builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();



// ======================================================
// REALTIME + AGENT INFRASTRUCTURE
// ======================================================

builder.Services.AddSingleton<IRealtimeNotifier, RealtimeNotifier>();
builder.Services.AddScoped<IAgentRegistry, AgentRegistry>();
builder.Services.AddScoped<ICoordinator, AgentCoordinator>();



// ======================================================
// AGENTS
// ======================================================
builder.Services.AddScoped<AgentRequestFactory>();
builder.Services.AddScoped<IAgent, Security_Agent>();
builder.Services.AddScoped<IAgent, CostAnalysis_Agent>();
builder.Services.AddScoped<IAgent, UrlValidationAndEndpointGeneration_Agent>();
builder.Services.AddScoped<IAgent, SecurityHeaders_Agent>();
builder.Services.AddScoped<IAgent, LatencyPerformance_Agent>();
builder.Services.AddScoped<IAgent, Metrics_Agent>();
builder.Services.AddScoped<IAgent, CredentialCheck_Agent>();



// ======================================================
// USE CASES
// ======================================================

builder.Services.AddScoped<IngestLogUseCase>();
builder.Services.AddScoped<GenerateMetricsUseCase>();



// ======================================================
// BACKGROUND WORKER
// ======================================================

builder.Services.AddHostedService<LogProcessingWorker>();



// ======================================================
// BUILD APP
// ======================================================

var app = builder.Build();



// ======================================================
// HTTP PIPELINE
// ======================================================

app.MapControllers();

app.Run();