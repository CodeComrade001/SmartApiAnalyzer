using Microsoft.Extensions.DependencyInjection;
using SmartApiAnalyzer.Application.Services;
using SmartApiAnalyzer.Application.Services.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Infrastructure.Services;

namespace SmartApiAnalyzer.Application.DependencyInjection;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationLayer(
        this IServiceCollection services)
    {
        // ======================================================
        // APPLICATION SERVICES
        // ======================================================

        services.AddScoped<ILogService, LogService>();

        services.AddScoped<IMetricsService, MetricsService>();

        services.AddScoped<ISubscriptionService, SUbscriptionService>();

        services.AddScoped<IMetricProcessor, MetricProcessor>();

        // ======================================================
        // AGENTS HELPER DI
        // ======================================================
        services.AddScoped<IAgentSelector, AgentSelector>();
        services.AddScoped<ICredentialExposureService, CredentialExposureService>();
        services.AddScoped<ILatencyInspectionService, LatencyInspectionService>();
        services.AddScoped<IThreatIntelService, ThreatIntelService>();
        services.AddScoped<IEndpointDiscoveryService, EndpointDiscoveryService>();
        services.AddScoped<ISecurityHeaderService, SecurityHeadersService>();
        services.AddScoped<IAlertDispatchService, AlertDispatchService>();
        services.AddScoped<ICorsPolicyService, CorsPolicyService>();
        services.AddScoped<IRedirectChainService, RedirectChainService>();
        services.AddScoped<IDomainHijackService, DomainHijackService>();
        services.AddScoped<ISslTlsCheckService, SslTlsCheckService>();
        services.AddScoped<IUrlValidationService, UrlValidationService>();

        // ======================================================
        // USE CASES
        // ======================================================
        services.AddScoped<IRealtimeNotifier, RealtimeNotifier>();
        // services.AddScoped<IIngestLogUseCase, IngestLogUseCase>();

        return services;
    }
}