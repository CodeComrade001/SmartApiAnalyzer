using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using SmartApiAnalyzer.Api.Validators;

namespace SmartApiAnalyzer.Api.DependencyInjection;

public static class ApiServiceRegistration
{
  public static IServiceCollection AddApiLayer(this IServiceCollection services)
  {
    services.AddControllers();

    services
        .AddFluentValidationAutoValidation()
        .AddFluentValidationClientsideAdapters();

    services.AddValidatorsFromAssemblyContaining<IngestLogValidator>();

    services.Configure<ApiBehaviorOptions>(options =>
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

    services.AddSwaggerGen(c =>
    {
      c.SwaggerDoc("v1",
              new OpenApiInfo
              {
                Title = "SmartApiAnalyzer API",
                Version = "v1"
              });
    });

    return services;
  }
}