
using Application.DTOs.EventsDTOs;

namespace SmartApiAnalyzer.Application.Services.Interface.Events;

public interface ITaskStateStore
{
  Task CreateAsync(
      Guid taskId,
      string pipelineName,
      CancellationToken ct = default);

  Task MarkStartedAsync(
      Guid taskId,
      string agentName,
      CancellationToken ct = default);

  Task MarkCompletedAsync(
      Guid taskId,
      string agentName,
      CancellationToken ct = default);

  Task MarkFailedAsync(
      Guid taskId,
      string agentName,
      string reason,
      CancellationToken ct = default);

  Task MarkPipelineCompletedAsync(
      Guid taskId,
      CancellationToken ct = default);

  Task<TaskStateDto?> GetAsync(
      Guid taskId,
      CancellationToken ct = default);
}