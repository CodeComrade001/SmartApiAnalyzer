// =============================================
// Services
// File: Infrastructure/Services/SubscriptionService.cs
// =============================================
using Application.DTOs.Common;
using Application.DTOs.Metrics;
using SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

namespace SmartApiAnalyzer.Application.Services;

public class SUbscriptionService : ISubscriptionService
{
  public async Task<ServiceResult<SubscriptionSchema.SelectPackage>> GetSubscriptionPackageAsync()
  {
    var data = new SubscriptionSchema.SelectPackage
    {
      Id = "12450",
      PackageName = "182",
    };

    return await Task.FromResult(
        ServiceResult<SubscriptionSchema.SelectPackage>.Ok(data)
    );
  }

  public async Task<ServiceResult<List<SubscriptionSchema.CancelPackageSubscription>>> GetSubscriptionCancelAsync()
  {
    var data = new SubscriptionSchema.CancelPackageSubscription
    {
      Id = "12450",
      PackageName = "182",
    };

    return await Task.FromResult(
        ServiceResult<List<SubscriptionSchema.CancelPackageSubscription>>.Ok(new List<SubscriptionSchema.CancelPackageSubscription> { data })
    );
  }

  public async Task<ServiceResult<List<SubscriptionSchema.History>>> GetSubscriptionHistoryAsync()
  {
    var data = new SubscriptionSchema.History
    {
      Id = "12450",
    };

    return await Task.FromResult(
        ServiceResult<List<SubscriptionSchema.History>>.Ok(new List<SubscriptionSchema.History> { data })
    );
  }

  public async Task<ServiceResult<List<SubscriptionSchema.DownloadHistory>>> GetSubScriptionHistoryDownloadAsync()
  {
    var data = new SubscriptionSchema.DownloadHistory
    {
      Id = "12450",
    };

    return await Task.FromResult(
        ServiceResult<List<SubscriptionSchema.DownloadHistory>>.Ok(new List<SubscriptionSchema.DownloadHistory> { data })
    );
  }
}