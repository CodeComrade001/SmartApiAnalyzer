using Application.DTOs.Common;
using Application.DTOs.Metrics;

namespace SmartApiAnalyzer.Application.Services.Interface.ControllerServices;

public interface ISubscriptionService
{
  Task<ServiceResult<SubscriptionSchema.SelectPackage>> GetSubscriptionPackageAsync();

  Task<ServiceResult<List<SubscriptionSchema.CancelPackageSubscription>>> GetSubscriptionCancelAsync();

  Task<ServiceResult<List<SubscriptionSchema.History>>> GetSubscriptionHistoryAsync();

  Task<ServiceResult<List<SubscriptionSchema.DownloadHistory>>> GetSubScriptionHistoryDownloadAsync();
}