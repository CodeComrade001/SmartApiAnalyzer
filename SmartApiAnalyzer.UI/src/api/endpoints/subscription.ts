import { api } from "../client";

export const getSubscription = async () => {
  const response = await api.get(
    "/api/v1/subscription"
  );

  return response.data;
};

export const upgradeSubscription = async (
  data: {
    tier: string;
  }
) => {
  const response = await api.post(
    "/api/v1/subscription/upgrade",
    data
  );

  return response.data;
};

export const getUsage = async () => {
  const response = await api.get(
    "/api/v1/usage"
  );

  return response.data;
};