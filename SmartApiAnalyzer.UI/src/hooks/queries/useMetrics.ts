import { useQuery } from "@tanstack/react-query";

import {
  getMetricsSummary,
  getTopCostMetrics,
} from "@/api/endpoints/metrics";

export const useMetricsSummary = () => {
  return useQuery({
    queryKey: ["metrics-summary"],
    queryFn: getMetricsSummary,
  });
};

export const useTopCostMetrics = () => {
  return useQuery({
    queryKey: ["top-cost-metrics"],
    queryFn: getTopCostMetrics,
  });
};