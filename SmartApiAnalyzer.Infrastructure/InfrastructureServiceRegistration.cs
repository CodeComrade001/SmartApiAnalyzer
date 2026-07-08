using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartApiAnalyzer.Application.Interfaces.Temp_interfaces;
using SmartApiAnalyzer.Application.Services;

using SmartApiAnalyzer.Application.Services.Agents;
using SmartApiAnalyzer.Application.Services.Interface.Agents;

using SmartApiAnalyzer.Application.Services.Interface.Events;

using SmartApiAnalyzer.Application.Services.Interface.RepositoriesInterface;

using SmartApiAnalyzer.Infrastructure.Agents;
using SmartApiAnalyzer.Infrastructure.Agents.Registry;

using SmartApiAnalyzer.Infrastructure.queue;

using SmartApiAnalyzer.Infrastructure.Repositories;
using SmartApiAnalyzer.Infrastructure.Services;
using SmartApiAnalyzer.Infrastructure.TempFiles.TemporaryInMemoryStorage;

using SmartAPiAnalyzer.Infrastructure.Coordination;

namespace SmartApiAnalyzer.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureLayer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        RegisterRepositories(services);

        RegisterEventSystem(services);

        RegisterCoordination(services);

        RegisterAgents(services);

        RegisterAgentServices(services);

        RegisterBackgroundWorkers(services);

        RegisterHttpClients(services);

        RegisterTemporaryStorage(services);

        return services;
    }

    // ======================================================
    // REPOSITORIES
    // ======================================================

    private static void RegisterRepositories(
        IServiceCollection services)
    {
        services.AddScoped<ILogRepository, LogRepository>();
    }

    // ======================================================
    // EVENT SYSTEM
    // ======================================================

    private static void RegisterEventSystem(
        IServiceCollection services)
    {
        services.AddSingleton<IEventQueue, InMemoryEventQueue>();

        services.AddSingleton<IEventBus, InMemoryEventBus>();
    }

    // ======================================================
    // COORDINATION
    // ======================================================

    private static void RegisterCoordination(
        IServiceCollection services)
    {
        services.AddScoped<IRealtimeNotifier, RealtimeNotifier>();

        services.AddScoped<IAgentRegistry, AgentRegistry>();

        services.AddScoped<ICoordinator, AgentCoordinator>();

        services.AddScoped<IAgentSelector, AgentSelector>();
    }

    // ======================================================
    // AGENTS
    // ======================================================

    private static void RegisterAgents(
        IServiceCollection services)
    {
        // services.AddScoped<AgentRequestFactory>();

        services.AddScoped<IAgent, Security_Agent>();

        services.AddScoped<IAgent, CostAnalysis_Agent>();

        services.AddScoped<IGateKeeperAgent, GateKeeper_Agent>();

        services.AddScoped<IAgent, SecurityHeaders_Agent>();

        services.AddScoped<IAgent, LatencyPerformance_Agent>();

        services.AddScoped<IAgent, Metrics_Agent>();

        services.AddScoped<IAgent, CredentialCheck_Agent>();
    }

    // ======================================================
    // AGENT SERVICES
    // ======================================================

    private static void RegisterAgentServices(
        IServiceCollection services)
    {
        services.AddScoped<ICredentialExposureService,
            CredentialExposureService>();

        services.AddScoped<ILatencyInspectionService,
            LatencyInspectionService>();

        services.AddScoped<ISecurityHeaderService,
            SecurityHeadersService>();

        services.AddScoped<IThreatIntelService,
            ThreatIntelService>();

        services.AddScoped<IEndpointDiscoveryService,
            EndpointDiscoveryService>();
    }

    // ======================================================
    // BACKGROUND WORKERS
    // ======================================================

    private static void RegisterBackgroundWorkers(
        IServiceCollection services)
    {
        services.AddHostedService<LogProcessingWorker>();
    }

    // ======================================================
    // HTTP CLIENTS
    // ======================================================

    private static void RegisterHttpClients(
        IServiceCollection services)
    {
        services.AddHttpClient();
    }

    private static void RegisterTemporaryStorage(
    IServiceCollection services)
    {
        services.AddSingleton(
            typeof(ITemporaryInMemoryStorage<>),
            typeof(TemporaryInMemoryStorage<>));
    }
}