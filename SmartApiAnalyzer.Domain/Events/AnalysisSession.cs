public class AnalysisSession
{
  public Guid Id { get; set; }

  public string Url { get; set; } = default!;

  public string Status { get; set; } = "PendingApproval";

  public string PayloadJson { get; set; } = default!;

  public DateTime CreatedAt { get; set; }
}