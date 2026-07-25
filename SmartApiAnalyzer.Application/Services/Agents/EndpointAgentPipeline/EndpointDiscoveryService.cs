using Microsoft.Extensions.Logging;
using SmartApiAnalyzer.Application.Interfaces.endpointAgentPipeline_Interface;
using SmartApiAnalyzer.Application.Services.Interface.Agents;
using SmartApiAnalyzer.Domain.Entities.Models.Result.EndpointPipelineResultContext;
using SmartApiAnalyzer.Domain.Enums;

namespace SmartApiAnalyzer.Application.Services.Agents;

public sealed class EndpointDiscoveryService : IEndpointDiscoveryService
{
    private readonly IEnumerable<IDiscoveryStrategy> _discoveryStrategies;
    private readonly IEndpointVerifier _endpointVerifier;
    private readonly IMethodDetector _methodDetector;
    private readonly IEndpointIntelligence _endpointIntelligence;
    private readonly IEndpointModelBuilder _endpointModelBuilder;
    private readonly ILogger<EndpointDiscoveryService> _logger;

    public EndpointDiscoveryService(
        IEnumerable<IDiscoveryStrategy> discoveryStrategies,
        IEndpointVerifier endpointVerifier,
        IMethodDetector methodDetector,
        IEndpointIntelligence endpointIntelligence,
        IEndpointModelBuilder endpointModelBuilder,
        ILogger<EndpointDiscoveryService> logger)
    {
        _discoveryStrategies = discoveryStrategies;
        _endpointVerifier = endpointVerifier;
        _methodDetector = methodDetector;
        _endpointIntelligence = endpointIntelligence;
        _endpointModelBuilder = endpointModelBuilder;
        _logger = logger;
    }

    public async Task<EndpointDiscoveryResult> DiscoverAsync(Uri website, CancellationToken cancellationToken)
    {
        var stageResults = new List<PipelineStageResult>();
        var pipelineStopwatch = System.Diagnostics.Stopwatch.StartNew();
        var context = new EndpointPipelineContext { Website = website };

        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            //-----------------------------------------
            // Stage 1 — Endpoint Discovery (never fatal; per-strategy isolation)
            //-----------------------------------------
            stageResults.Add(await RunDiscoveryStageAsync(context, cancellationToken));

            if (context.Candidates.Count == 0)
            {
                _logger.LogWarning("No candidate endpoints discovered for {Website}.", website);
                return await BuildFinalResultAsync(context, PipelineStatus.Completed, stageResults,
                    "No endpoints were discovered by any strategy.", cancellationToken);
            }

            var seeStrategyResult = context;

            //-----------------------------------------
            // Stage 2 — Endpoint Verification (FATAL if it fails)
            //-----------------------------------------
            var verifyResult = await SafeRunStageAsync("EndpointVerification",
                () => _endpointVerifier.VerifyAsync(context, cancellationToken), cancellationToken);
            stageResults.Add(verifyResult);

            if (!verifyResult.Success)
            {
                _logger.LogError("Endpoint verification failed for {Website}: {Message}", website, verifyResult.Message);
                return await BuildFinalResultAsync(context, PipelineStatus.Failed, stageResults, verifyResult.Message, cancellationToken);
            }

            var degraded = false;
            var endpointVerificationResult = context;

            //-----------------------------------------
            // Stage 3 — HTTP Method Detection (degrade, don't abort)
            //-----------------------------------------
            var methodResult = await SafeRunStageAsync("MethodDetection",
                () => _methodDetector.DetectAsync(context, cancellationToken), cancellationToken);
            stageResults.Add(methodResult);
            degraded |= !methodResult.Success;

            var methodVerificationResult = context;
            //-----------------------------------------
            // Stage 4 — Endpoint Intelligence (degrade, don't abort)
            //-----------------------------------------
            var intelligenceResult = await SafeRunStageAsync("EndpointIntelligence",
                () => _endpointIntelligence.EnrichAsync(context, cancellationToken), cancellationToken);
            stageResults.Add(intelligenceResult);
            degraded |= !intelligenceResult.Success;

            var endpointIntelligenceResult = context;
            //-----------------------------------------
            // Stage 5 — Final Model
            //-----------------------------------------
            var finalStatus = degraded ? PipelineStatus.PartiallyCompleted : PipelineStatus.Completed;
            var buildFinalResult = await BuildFinalResultAsync(context, finalStatus, stageResults, null, cancellationToken);

            var stage5Result = stageResults;
            return buildFinalResult;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Endpoint discovery pipeline was cancelled for {Website}.", website);
            return await BuildFinalResultAsync(context, PipelineStatus.Cancelled, stageResults, "The operation was cancelled.", CancellationToken.None);
        }
        catch (Exception ex)
        {
            // Every stage above defends itself. Reaching here means something outside the
            // expected failure surface broke — treat as critical, not routine.
            _logger.LogCritical(ex, "Endpoint discovery pipeline failed unexpectedly for {Website}.", website);

            try
            {
                return await BuildFinalResultAsync(context, PipelineStatus.Failed, stageResults,
                    $"Unexpected pipeline failure: {ex.Message}", CancellationToken.None);
            }
            catch (Exception buildEx)
            {
                _logger.LogCritical(buildEx, "Failed to build failure result for {Website}.", website);
                return new EndpointDiscoveryResult
                {
                    Website = website,
                    Status = PipelineStatus.Failed,
                    Endpoints = [],
                    Statistics = context.Statistics,
                    StageResults = stageResults,
                    FailureReason = $"Unexpected pipeline failure: {ex.Message}",
                };
            }
        }
        finally
        {
            context.Statistics.Duration = pipelineStopwatch.Elapsed;
        }
    }

    private async Task<PipelineStageResult> RunDiscoveryStageAsync(EndpointPipelineContext context, CancellationToken cancellationToken)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var strategiesExecuted = 0;
        var strategiesFailed = 0;
        var strategies = _discoveryStrategies?.ToList() ?? [];

        if (strategies.Count == 0)
            return PipelineStageResult.Fail("EndpointDiscovery", "No discovery strategies are registered.", null, stopwatch.Elapsed);

        foreach (var strategy in strategies.OrderBy(s => s.Priority))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var strategyStopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                var discovered = await strategy.DiscoverAsync(context.Website, cancellationToken);

                // Defend against a strategy returning null instead of an empty sequence.
                var materialized = discovered?.Where(c => c is not null).ToList() ?? [];

                context.Candidates.AddRange(materialized);
                context.Statistics.StrategyResults[strategy.Name.ToString()] = materialized.Count;
                strategiesExecuted++;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                strategiesFailed++;
                context.Statistics.StrategyResults[strategy.Name.ToString()] = 0;
                _logger.LogWarning(ex, "Discovery strategy '{Strategy}' failed and was skipped.", strategy.Name);
            }
            finally
            {
                context.Statistics.StrategyDurations[strategy.Name.ToString()] = strategyStopwatch.Elapsed;
            }
        }

        context.Statistics.StrategiesExecuted = strategiesExecuted;
        context.Statistics.CandidateEndpointsFound = context.Candidates.Count;

        var message = strategiesFailed == 0
            ? $"All {strategiesExecuted} discovery strategy(ies) executed successfully, {context.Candidates.Count} candidate(s) found."
            : $"{strategiesExecuted} of {strategies.Count} strategy(ies) executed successfully ({strategiesFailed} failed), {context.Candidates.Count} candidate(s) found.";

        // Discovery is never fatal, even at zero successes — an empty result is a valid,
        // reportable outcome. The caller decides how to proceed based on candidate count.
        return PipelineStageResult.Ok("EndpointDiscovery", message, stopwatch.Elapsed);
    }

    private async Task<PipelineStageResult> SafeRunStageAsync(
        string stageName, Func<Task<PipelineStageResult>> stage, CancellationToken cancellationToken)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var result = await stage();
            // Defend against a stage implementation returning null despite the interface contract.
            return result ?? PipelineStageResult.Fail(stageName, $"Stage '{stageName}' returned no result.", null, stopwatch.Elapsed);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Pipeline stage '{Stage}' threw an unhandled exception.", stageName);
            return PipelineStageResult.Fail(stageName, $"Stage '{stageName}' failed with an unhandled exception.", ex.Message, stopwatch.Elapsed);
        }
    }

    private async Task<EndpointDiscoveryResult> BuildFinalResultAsync(
        EndpointPipelineContext context, PipelineStatus status,
        List<PipelineStageResult> stageResults, string? failureReason, CancellationToken cancellationToken)
    {
        try
        {
            return await _endpointModelBuilder.BuildAsync(context, status, stageResults, failureReason, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "Model builder threw while assembling the final result for {Website}.", context.Website);
            return new EndpointDiscoveryResult
            {
                Website = context.Website,
                Status = PipelineStatus.Failed,
                Endpoints = [],
                Statistics = context.Statistics,
                StageResults = stageResults,
                FailureReason = failureReason ?? $"Model building failed: {ex.Message}",
            };
        }
    }

}