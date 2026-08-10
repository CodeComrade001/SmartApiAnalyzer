namespace SmartApiAnalyzer.Domain.Constants;

public static class DiscoveryStrategyTypeExtensions
{
  public static string ToSystemName(this DiscoveryStrategyType type)
      => type switch
      {
        DiscoveryStrategyType.CommonRoute___Strategy => "CommonRoute",
        DiscoveryStrategyType.GraphQL___Strategy => "GraphQL",
        DiscoveryStrategyType.Html__Strategy => "Html",
        DiscoveryStrategyType.Javascript__Strategy => "Javascript",
        DiscoveryStrategyType.Robots__Strategy => "Robots",
        DiscoveryStrategyType.Sitemap_Strategy => "Sitemap",
        DiscoveryStrategyType.Swagger__Strategy => "Swagger",
        DiscoveryStrategyType.Doc__Strategy => "Docs",
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unregistered DiscoveryStrategyType."),
      };

  /// <summary>
  /// The strategy's execution priority, derived directly from the enum's underlying value.
  /// This is the ONLY place Priority should ever be read from — strategies no longer
  /// declare their own Priority property (see IDiscoveryStrategy).
  /// </summary>
}

public enum DiscoveryStrategyType
{
  Doc__Strategy = 1,
  Swagger__Strategy = 2,
  GraphQL___Strategy = 3,
  Robots__Strategy = 4,
  Sitemap_Strategy = 5,
  Javascript__Strategy = 6,
  Html__Strategy = 7,
  CommonRoute___Strategy = 8,
}