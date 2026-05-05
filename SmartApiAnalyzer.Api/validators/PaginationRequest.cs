// ======================================================
// 2. OPTIONAL QUERY REQUEST DTOs (cleanest solution)
// If later you add filters/pagination
// ======================================================

namespace Application.DTOs;

public class PaginationRequest
{
  public int Page { get; set; } = 1;
  public int PageSize { get; set; } = 25;
}