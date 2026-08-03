using Microsoft.AspNetCore.SignalR;

public sealed class ScanHub : Hub
{
  public override async Task OnConnectedAsync()
  {
    await base.OnConnectedAsync();
  }

  public async Task JoinScan(string scanId)
  {
    await Groups.AddToGroupAsync(
        Context.ConnectionId,
        scanId);
  }

  public async Task LeaveScan(string scanId)
  {
    await Groups.RemoveFromGroupAsync(
        Context.ConnectionId,
        scanId);
  }
}