import { Endpoint, TimeSeriesDataPoint, KPIOverview } from "@/types";

export const mockKpis: KPIOverview = {
  totalRequests: 1420500,
  totalRequestsTrend: 12.5,
  avgLatency: 124,
  avgLatencyTrend: -4.2,
  errorRate: 0.12,
  errorRateTrend: 0.01,
  costScore: 84,
  costScoreTrend: 5.1,
  activeEndpoints: 30,
};

export const mockTimeSeries: TimeSeriesDataPoint[] = [
  { timestamp: "2026-04-01", requests: 42000, latency: 110, errorRate: 0.1, cost: 90 },
  { timestamp: "2026-04-02", requests: 51000, latency: 130, errorRate: 0.2, cost: 110 },
  { timestamp: "2026-04-03", requests: 47000, latency: 118, errorRate: 0.1, cost: 102 },
  { timestamp: "2026-04-04", requests: 62000, latency: 170, errorRate: 0.4, cost: 138 },
];

export const mockEndpoints: Endpoint[] = [
  {
    id: "1",
    path: "/api/users",
    method: "GET",
    service: "users",
    avgLatency: 88,
    p95Latency: 180,
    errorRate: 0.08,
    requestVolume: 540000,
    costScore: 42,
    status: "healthy",
  },
];

export const mockInsights = [
  {
    id: "in-1",
    type: "slow",
    metric: "p95 latency is 1.2s",
    trend: "+40% this week",
    recommendation: "Add caching to GET /api/users/:id",
  },
  {
    id: "in-2",
    type: "degrading",
    metric: "Error rate rose to 2.4%",
    trend: "Started 2 days ago",
    recommendation: "Check downstream database pool saturation",
  },
  {
    id: "in-3",
    type: "costly",
    metric: "Cost score 98/100",
    trend: "Consistent high compute",
    recommendation: "Paginate responses and compress payloads",
  },
];