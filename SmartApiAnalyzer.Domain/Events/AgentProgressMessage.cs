namespace SmartApiAnalyzer.Domain.Events;

public class AgentProgressMessage
{
  public Guid ScanId { get; set; }

  public string AgentName { get; set; }

  public string Status { get; set; }

  public string Message { get; set; }

  public bool Success { get; set; }

  public object? Payload { get; set; }

  public DateTime Timestamp { get; set; }
}