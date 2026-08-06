using SmartApiAnalyzer.Application.Services.Interface.Events;
using SmartApiAnalyzer.Domain.Events;

namespace SmartApiAnalyzer.Application.Services;

using Microsoft.AspNetCore.SignalR;

public sealed class RealtimeNotifier : IRealtimeNotifier
{
  private readonly IHubContext<ScanHub> _hub;

  public RealtimeNotifier(
      IHubContext<ScanHub> hub)
  {
    _hub = hub;
  }

  public async Task NotifyAsync(
      AgentProgressMessage message,
      UserApprovedScanEvent? evt = null,
      CancellationToken ct = default)
  {
    await _hub
           .Clients
           .Group(message.ScanId.ToString())
           .SendAsync(
               "AgentProgress",
               message,
               ct);

    Console.WriteLine($"Turbo Log  ~ RealtimeNotifier ~ NotifyAsync ~ message:||| agentName: {message.AgentName} ||||| scanId : {message.ScanId} ||||| agentMessage:  {message.Message}");

  }
}

