import { api } from "../client";

export const getMetricsSummary = async () => {
  const response = await api.get(
    "/api/v1/metrics/summary"
  );

  return response.data;
};

export const getEndpointMetrics = async () => {
  const response = await api.get(
    "/api/v1/metrics/endpoints"
  );

  return response.data;
};

export const getTopCostMetrics = async () => {
  const response = await api.get(
    "/api/v1/metrics/top-cost"
  );

  return response.data;
};

export const getDegradationMetrics = async () => {
  const response = await api.get(
    "/api/v1/metrics/degradation"
  );

  return response.data;
};