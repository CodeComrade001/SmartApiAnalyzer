// SmartApiAnalyzer.Infrastructure/Agents/EndpointDiscovery/Shared/EndpointPathNormalizer.cs
namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

internal static class EndpointPathNormalizer
{
  private static readonly string[] StaticAssetExtensions =
  [
      ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff", ".woff2",
        ".ttf", ".eot", ".ico", ".map", ".webp", ".mp4", ".mp3", ".pdf"
  ];

  public static string Normalize(string rawPath)
  {
    if (string.IsNullOrWhiteSpace(rawPath)) return "/";
    var path = rawPath.Trim();

    if (Uri.TryCreate(path, UriKind.Absolute, out var abs))
    {
      path = abs.AbsolutePath;
    }

    var cutIndex = path.IndexOfAny(['?', '#']);
    if (cutIndex >= 0) path = path[..cutIndex];

    if (!path.StartsWith('/')) path = "/" + path;
    if (path.Length > 1 && path.EndsWith('/')) path = path.TrimEnd('/');

    return path;
  }

  public static bool LooksLikeStaticAsset(string path)
  {
    var ext = Path.GetExtension(path);
    return !string.IsNullOrEmpty(ext) &&
           StaticAssetExtensions.Contains(ext, StringComparer.OrdinalIgnoreCase);
  }
}