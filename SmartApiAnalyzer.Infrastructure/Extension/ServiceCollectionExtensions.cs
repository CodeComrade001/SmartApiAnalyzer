using Microsoft.Extensions.DependencyInjection;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Infrastructure.Agents.Registry;

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


        // ── Pipeline infrastructure ───────────────────────────────────────────
        services.AddScoped<IAgentRegistry>(sp =>
            new AgentRegistry(sp.GetServices<IAgent>()));


        return services;
    }
}
