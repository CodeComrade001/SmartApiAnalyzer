// ============================================================
// FILE: Infrastructure/Common/AppLogger.cs
// Global logger helper similar to console.log() in JavaScript
// Usage:
// AppLogger.Log("Hello");
// AppLogger.Success("Saved");
// AppLogger.Warn("Check input");
// AppLogger.Error("Something failed");
// ============================================================

namespace Infrastructure.Common;

public static class AppLogger
{
  private static readonly object _lock = new();

  // --------------------------------------------------------
  // Standard log
  // --------------------------------------------------------
  public static void Log(string message)
  {
    Write("LOG", message, ConsoleColor.White);
  }

  // --------------------------------------------------------
  // Success log
  // --------------------------------------------------------
  public static void Success(string message)
  {
    Write("SUCCESS", message, ConsoleColor.Green);
  }

  // --------------------------------------------------------
  // Warning log
  // --------------------------------------------------------
  public static void Warn(string message)
  {
    Write("WARN", message, ConsoleColor.Yellow);
  }

  // --------------------------------------------------------
  // Error log
  // --------------------------------------------------------
  public static void Error(string message)
  {
    Write("ERROR", message, ConsoleColor.Red);
  }

  // --------------------------------------------------------
  // Info log
  // --------------------------------------------------------
  public static void Info(string message)
  {
    Write("INFO", message, ConsoleColor.Cyan);
  }

  // --------------------------------------------------------
  // Internal writer
  // --------------------------------------------------------
  private static void Write(string level, string message, ConsoleColor color)
  {
    lock (_lock)
    {
      var previousColor = Console.ForegroundColor;

      Console.ForegroundColor = color;

      Console.WriteLine(
          $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] [{level}] {message}"
      );

      Console.ForegroundColor = previousColor;
    }
  }
}