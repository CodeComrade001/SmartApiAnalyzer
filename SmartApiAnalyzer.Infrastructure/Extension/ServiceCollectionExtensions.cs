using Microsoft.Extensions.DependencyInjection;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Application.Services.Agents;
using SmartApiAnalyzer.Infrastructure.Agents;
using SmartApiAnalyzer.Infrastructure.Agents.Registry;
using SmartApiAnalyzer.Infrastructure.Services;
using SmartAPiAnalyzer.Infrastructure.Coordination;

namespace SmartApiAnalyzer.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSmartApiAnalyzerInfrastructure(
        this IServiceCollection services)
    {
        // ── Named HTTP clients ────────────────────────────────────────────────
        services.AddHttpClient("CredentialExposure", c => c.Timeout = TimeSpan.FromSeconds(15));
        services.AddHttpClient("LatencyInspection", c => c.Timeout = TimeSpan.FromSeconds(15));
        services.AddHttpClient("SecurityHeaders", c => c.Timeout = TimeSpan.FromSeconds(10));
        services.AddHttpClient("DomainHijack", c => c.Timeout = TimeSpan.FromSeconds(10));
        services.AddHttpClient("CorsPolicy", c => c.Timeout = TimeSpan.FromSeconds(10));
        services.AddHttpClient("RedirectChain", c => c.Timeout = TimeSpan.FromSeconds(20))
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                AllowAutoRedirect = false, // RedirectChainService follows manually
                MaxConnectionsPerServer = 2
            });

        // ── Analysis services ─────────────────────────────────────────────────
        // Application-layer services (user's original placement preserved)
        services.AddScoped<ICredentialExposureService, CredentialExposureService>();
        services.AddScoped<ILatencyInspectionService, LatencyInspectionService>();

        // Infrastructure-layer services
        services.AddScoped<ISecurityHeadersService, SecurityHeadersService>();
        services.AddScoped<IDomainHijackService, DomainHijackService>();
        services.AddScoped<ICorsPolicyService, CorsPolicyService>();
        services.AddScoped<IRedirectChainService, RedirectChainService>();
        services.AddScoped<ISslTlsCheckService, SslTlsCheckService>();
        services.AddScoped<IAlertDispatchService, AlertDispatchService>();

        // ── Agent pipeline ────────────────────────────────────────────────────
        // Registration order is irrelevant — AgentRegistry sorts by Priority.
        services.AddScoped<IAgent, UrlValidationAndEndpointGeneration_Agent>(); // Priority  1
        services.AddScoped<IAgent, CredentialCheck_Agent>();                    // Priority  2
        services.AddScoped<IAgent, DomainHijack_Agent>();                       // Priority  3
        services.AddScoped<IAgent, SecurityHeaders_Agent>();                    // Priority  4
        services.AddScoped<IAgent, SslTlsCheck_Agent>();                        // Priority  5
        services.AddScoped<IAgent, CorsPolicy_Agent>();                         // Priority  6
        services.AddScoped<IAgent, RedirectChain_Agent>();                      // Priority  7
        services.AddScoped<IAgent, Metrics_Agent>();                             // Priority  8
        services.AddScoped<IAgent, LatencyPerformance_Agent>();                  // Priority  9
        services.AddScoped<IAgent, CostAnalysis_Agent>();                        // Priority 10
        services.AddScoped<IAgent, SecurityAgentEvaluation_Agent>();             // Priority 11
        services.AddScoped<IAgent, Alert_Agent>();                               // Priority 20

        // ── Pipeline infrastructure ───────────────────────────────────────────
        services.AddScoped<IAgentRegistry>(sp =>
            new AgentRegistry(sp.GetServices<IAgent>()));

        services.AddScoped<IAgentSelector, AgentSelector>();
        services.AddScoped<ICoordinator, AgentCoordinator>();

        return services;
    }
}
