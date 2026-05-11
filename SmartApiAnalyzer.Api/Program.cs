using FluentValidation;
using Microsoft.OpenApi.Models;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using SmartApiAnalyzer.Api.Validators;
using SmartApiAnalyzer.Application.Services;
using SmartApiAnalyzer.Application.Services.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Agent.Metric;
using SmartApiAnalyzer.Application.Services.Interface.Agent.Security;
using SmartApiAnalyzer.Application.Services.Interface.Agent.Web;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;
using SmartApiAnalyzer.Infrastructure.Agents;
using SmartApiAnalyzer.Infrastructure.Agents.Factory;
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
builder.Services.AddScoped<IMetricProcessor, MetricProcessor>();



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
// AGENTS HELPER DI
// ======================================================
builder.Services.AddScoped<IAgentSelector, AgentSelector>();
builder.Services.AddScoped<ICredentialExposureService, CredentialExposureService>();
builder.Services.AddScoped<ILatencyInspectionService, LatencyInspectionService>();
builder.Services.AddScoped<ISecurityHeaderInspectionService, SecurityHeaderInspectionService>();
builder.Services.AddScoped<IThreatIntelService, ThreatIntelService>();
builder.Services.AddScoped<IEndpointDiscoveryService, EndpointDiscoveryService>();


// ======================================================
// USE CASES
// ======================================================




// ======================================================
// BACKGROUND WORKER
// ======================================================

builder.Services.AddHostedService<LogProcessingWorker>();

// ======================================================
// SWAGGER UI
// ======================================================
builder.Services.AddSwaggerGen(c =>
{
  c.SwaggerDoc("v1", new OpenApiInfo { Title = "sMART_API_ANALYZER API", Version = "v1" });

  // 🔹 Add JWT support in Swagger
  c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Name = "Authorization",
    Type = SecuritySchemeType.ApiKey,
    Scheme = "Bearer",
    BearerFormat = "JWT",
    In = ParameterLocation.Header,
    Description = "Enter 'Bearer <your token>'"
  });

  c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// ======================================================
// BUILD APP
// ======================================================

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

// ======================================================
// HTTP PIPELINE
// ======================================================

app.MapControllers();

app.Run();