namespace Application.DTOs.Metrics;

public static class SubscriptionSchema
{
  public class SelectPackage
  {
    // public Guid Id { get; set; }
    // temp testing :::: remove later
    public required string Id { get; set; }
    // temp testing :::: remove later
    public required string PackageName { get; set; } //note that packageId will be sent as the package name
  }

  public class CancelPackageSubscription
  {
    // public Guid Id { get; set; }
    // temp testing :::: remove later
    public required string Id { get; set; }
    // temp testing :::: remove later
    public required string PackageName { get; set; }
  }

  public class History
  {
    // public Guid Id { get; set; }
    // temp testing :::: remove later
    public required string Id { get; set; }
    // temp testing :::: remove later
  }

  public class DownloadHistory
  {
    // public Guid Id { get; set; }
    // temp testing :::: remove later
    public required string Id { get; set; }
    // temp testing :::: remove later
  }
}