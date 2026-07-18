export interface WebsiteApiGroup {
  id: string;
  websiteUrl: string;
  discoveredAt: string;

  endpoints: ApiEndpoint[];

  isSaved?: boolean;
  hasChanges?: boolean;
}


export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];


export interface ApiEndpoint {
  id: string;

  inferredPath: string;

  correctedPath?: string;

  method: HttpMethod;

  confidence: number;

  selected: boolean;

  status:
  | "unverified"
  | "verified"
  | "ignored" |
  "healthy" | "degraded" | "down";
}

// export interface Endpoint {
//   id: string;
//   path: string;
//   method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
//   avgLatency: number;
//   p95Latency: number;
//   errorRate: number;
//   requestVolume: number;
//   costScore: number;
//   status: "healthy" | "degraded" | "down";
//   service: string;
// }

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
