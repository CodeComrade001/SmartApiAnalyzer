// =============================================
// DTOs
// File: Application/DTOs/Common/ServiceResult.cs
// =============================================
namespace Application.DTOs.Common;

public class ServiceResult<T>
{
  public bool Success { get; set; }
  public string Message { get; set; } = string.Empty;
  public T? Data { get; set; }

  public static ServiceResult<T> Ok(T data, string message = "Success")
      => new()
      {
        Success = true,
        Message = message,
        Data = data
      };

  public static ServiceResult<T> Fail(string message)
      => new()
      {
        Success = false,
        Message = message,
        Data = default
      };
}