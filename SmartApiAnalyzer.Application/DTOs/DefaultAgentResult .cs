public interface DefaultAgentResult
{
  string AgentName { get; set; }

  string Message { get; set; }

  TimeSpan Elapsed { get; set; }
}
