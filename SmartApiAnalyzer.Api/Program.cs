using FluentValidation;
using Microsoft.OpenApi.Models;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using SmartApiAnalyzer.Api.Validators;
using SmartApiAnalyzer.Application.DependencyInjection;
using SmartApiAnalyzer.Infrastructure.DependencyInjection;

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


builder.Services
    .AddApplicationLayer()
    .AddInfrastructureLayer(builder.Configuration);

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

// builder.Services.Configure<ApiBehaviorOptions>(options =>
// {
//   options.SuppressModelStateInvalidFilter = true;
// });

builder.Services.AddCors(options =>
{
  options.AddPolicy("Development", policy =>
  {
    policy
          .WithOrigins(
              "http://localhost:5173"
          )
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials();
  });
});

// ======================================================
// BUILD APP
// ======================================================

var app = builder.Build();

if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseCors("Development");
// ======================================================
// HTTP PIPELINE
// ======================================================

app.MapControllers();

app.Run();