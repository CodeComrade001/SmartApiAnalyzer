// =============================================
// Enums
// File: Domain/Enums/ScanStatus.cs
// =============================================

namespace SmartApiAnalyzer.Domain.Enums;

public enum ScanStatus
{
  PendingApproval = 1,
  Approved = 2,
  Processing = 3,
  Completed = 4,
  Failed = 5
}