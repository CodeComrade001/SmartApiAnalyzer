using Microsoft.Extensions.DependencyInjection;
using SmartApiAnalyzer.Application.Services;
using SmartApiAnalyzer.Application.Services.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Infrastructure.Agents.EndpointAgentPipeline;

namespace SmartApiAnalyzer.Application.DependencyInjection;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationLayer(
        this IServiceCollection services)
    {
        // ======================================================
        // APPLICATION SERVICES
        // ======================================================

        services.AddScoped<IApiScanService, ApiScanService>();

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
        // EndpointHelpers HELPER DI
        // ======================================================
        services.AddScoped<IEndpointVerifier, EndpointVerifier>();
        services.AddScoped<IMethodDetector, MethodDetector>();
        services.AddScoped<IEndpointIntelligence, EndpointIntelligence>();
        services.AddScoped<IEndpointModelBuilder, EndpointModelBuilder>();

        // ======================================================
        // EndpointHelpers DiscoveryStrategies HELPER DI
        // ======================================================
        services.AddScoped<IDiscoveryStrategy, CommonRouteStrategy>();
        services.AddScoped<IDiscoveryStrategy, SwaggerStrategy>();
        services.AddScoped<IDiscoveryStrategy, SitemapStrategy>();
        services.AddScoped<IDiscoveryStrategy, RobotsStrategy>();
        services.AddScoped<IDiscoveryStrategy, JavascriptStrategy>();
        services.AddScoped<IDiscoveryStrategy, HtmlStrategy>();
        services.AddScoped<IDiscoveryStrategy, GraphQLStrategy>();
        services.AddScoped<IDiscoveryStrategy, DocsStrategy>();

        services.AddSignalR();

        return services;
    }
}