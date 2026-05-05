namespace Application.DTOs.EventsDTOs;

public class TaskStateDto
{
  public Guid TaskId { get; set; }
  public string PipelineName { get; set; } = "";
  public string Status { get; set; } = "";
  public List<AgentStepDto> Steps { get; set; } = new();
}

public class AgentStepDto
{
  public string AgentName { get; set; } = "";
  public string Status { get; set; } = "";
  public DateTime UpdatedAt { get; set; }
  public string? Error { get; set; }
}