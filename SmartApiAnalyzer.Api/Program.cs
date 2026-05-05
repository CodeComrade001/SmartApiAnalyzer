using Application.UseCases.IngestLog;
using Application.Validators;

using FluentValidation;
using FluentValidation.AspNetCore;

using Infrastructure.Services;

using Microsoft.AspNetCore.Mvc;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.UseCases.Metrics;
using SmartApiAnalyzer.Infrastructure.queue;

var builder = WebApplication.CreateBuilder(args);


// =======================================================
// SERVICE REGISTRATION
// =======================================================


// -------------------------------------------------------
// 1. Controllers
// Registers API controllers
// -------------------------------------------------------
builder.Services.AddControllers();


// -------------------------------------------------------
// 2. FluentValidation
// Automatic request DTO validation
// -------------------------------------------------------
builder.Services
    .AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters();

// Scan assembly for all validators automatically
// builder.Services.AddValidatorsFromAssemblyContaining<IngestLogRequestValidator>();


// -------------------------------------------------------
// 3. Custom Validation Response Format
// Standardizes model validation errors
// -------------------------------------------------------
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
  options.InvalidModelStateResponseFactory = context =>
  {
    var errors = context.ModelState
          .Where(x => x.Value?.Errors.Count > 0)
          .Select(x => new
          {
            Field = x.Key,
            Errors = x.Value!.Errors
                  .Select(e => e.ErrorMessage)
          });

    return new BadRequestObjectResult(new
    {
      Success = false,
      Message = "Validation failed.",
      Errors = errors
    });
  };
});


// -------------------------------------------------------
// 4. Application Services
// Business logic layer
// -------------------------------------------------------
builder.Services.AddScoped<ILogService, LogService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddScoped<ISubscriptionService, SUbscriptionService>();

builder.Services.AddSingleton<IEventQueue, InMemoryEventQueue>();
builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();

builder.Services.AddHostedService<LogProcessingWorker>();

builder.Services.AddScoped<ICoordinator, AgentCoordinator>();

builder.Services.AddScoped<IAgent, SecurityAgent>();
// builder.AddScoped<IAgent, PerformanceAgent>();
// builder.AddScoped<IAgent, CostAgent>();

// -------------------------------------------------------
// 5. Use Cases
// Single responsibility workflows
// -------------------------------------------------------
builder.Services.AddScoped<IngestLogUseCase>();
builder.Services.AddScoped<GenerateMetricsUseCase>();


// -------------------------------------------------------
// 6. Background Queue Infrastructure
// Singleton because shared in-memory state
// -------------------------------------------------------
builder.Services.AddSingleton<IEventQueue, InMemoryEventQueue>();
builder.Services.AddSingleton<IMetricProcessor, MetricProcessor>();


// -------------------------------------------------------
// 7. Hosted Background Worker
// Runs continuously after app startup
// -------------------------------------------------------
builder.Services.AddHostedService<LogProcessingWorker>();


var app = builder.Build();


// =======================================================
// HTTP PIPELINE
// =======================================================


// -------------------------------------------------------
// Map controller endpoints
// -------------------------------------------------------
app.MapControllers();


// -------------------------------------------------------
// Start application
// -------------------------------------------------------
app.Run();