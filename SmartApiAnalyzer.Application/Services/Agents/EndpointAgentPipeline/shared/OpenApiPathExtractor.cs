using System.Text.Json;

namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

internal static class OpenApiPathExtractor
{
  private static readonly string[] HttpVerbs =
      ["get", "post", "put", "delete", "patch", "options", "head", "trace"];

  /// <summary>
  /// Returns null if the document isn't a recognizable OpenAPI/Swagger document
  /// (missing "swagger"/"openapi" marker or a "paths" object). Callers must treat
  /// null as "not a spec" rather than "empty spec".
  /// </summary>
  public static List<(string Path, List<string> Methods)>? TryExtractPaths(JsonElement root)
  {
    var isOpenApiFamily = root.TryGetProperty("swagger", out _) || root.TryGetProperty("openapi", out _);
    if (!isOpenApiFamily) return null;

    if (!root.TryGetProperty("paths", out var pathsElement) || pathsElement.ValueKind != JsonValueKind.Object)
      return null;

    var results = new List<(string, List<string>)>();
    foreach (var pathProperty in pathsElement.EnumerateObject())
    {
      results.Add((pathProperty.Name, ExtractMethods(pathProperty.Value)));
    }
    return results;
  }

  private static List<string> ExtractMethods(JsonElement pathItem)
  {
    if (pathItem.ValueKind != JsonValueKind.Object) return [];
    var found = new List<string>();
    foreach (var verb in HttpVerbs)
    {
      if (pathItem.TryGetProperty(verb, out _)) found.Add(verb.ToUpperInvariant());
    }
    return found;
  }
}