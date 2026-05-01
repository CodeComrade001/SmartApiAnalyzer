import { z } from "zod";

export interface Endpoint {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  requestVolume: number;
  costScore: number;
  status: "healthy" | "degraded" | "down";
  service: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  requests: number;
  latency: number;
  errorRate: number;
  cost: number;
}

export interface Insight {
  id: string;
  type: "slow" | "degrading" | "costly";
  endpointId: string;
  metric: string;
  trend: string;
  recommendation: string;
}

export interface KPIOverview {
  totalRequests: number;
  totalRequestsTrend: number;
  avgLatency: number;
  avgLatencyTrend: number;
  errorRate: number;
  errorRateTrend: number;
  costScore: number;
  costScoreTrend: number;
  activeEndpoints: number;
}
