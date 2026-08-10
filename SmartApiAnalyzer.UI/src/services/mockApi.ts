import { Endpoint, TimeSeriesDataPoint, Insight, KPIOverview } from "@/types";

const generateEndpoints = (): Endpoint[] => {
  const services = ["users", "orders", "auth", "payments", "inventory", "search"];
  const methods = ["GET", "POST", "PUT", "DELETE"];
  const endpoints: Endpoint[] = [];

  for (let i = 1; i <= 30; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const method = methods[Math.floor(Math.random() * methods.length)] as any;
    const path = `/api/${service}${Math.random() > 0.5 ? '/:id' : ''}${Math.random() > 0.7 ? '/details' : ''}`;

    let status: "healthy" | "degraded" | "down" = "healthy";
    const rand = Math.random();
    if (rand > 0.95) status = "down";
    else if (rand > 0.8) status = "degraded";

    endpoints.push({
      id: `ep-${i}`,
      path,
      method,
      service,
      avgLatency: Math.floor(Math.random() * 300) + 20,
      p95Latency: Math.floor(Math.random() * 800) + 100,
      errorRate: Number((Math.random() * (status === "down" ? 5 : status === "degraded" ? 2 : 0.5)).toFixed(2)),
      requestVolume: Math.floor(Math.random() * 1000000) + 1000,
      costScore: Math.floor(Math.random() * 100),
      status,
    });
  }
  return endpoints;
};

const generateTimeSeriesData = (): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Add some noise and spikes
    const isSpike = i === 12 || i === 5;
    const baseRequests = 50000 + Math.random() * 10000;
    const requests = isSpike ? baseRequests * 2.5 : baseRequests;

    data.push({
      timestamp: d.toISOString(),
      requests: Math.floor(requests),
      latency: Math.floor(isSpike ? 250 + Math.random() * 100 : 80 + Math.random() * 40),
      errorRate: Number((isSpike ? 1.5 + Math.random() : 0.1 + Math.random() * 0.3).toFixed(2)),
      cost: Math.floor(requests * 0.0001 + (isSpike ? 50 : 0)),
    });
  }
  return data;
};

const generateInsights = (endpoints: Endpoint[]): Insight[] => {
  return [
    {
      id: "in-1",
      type: "slow",
      endpointId: endpoints[0].id,
      metric: "p95 latency is 1.2s",
      trend: "+40% this week",
      recommendation: "Consider adding a caching layer for this endpoint.",
    },
    {
      id: "in-2",
      type: "degrading",
      endpointId: endpoints[1].id,
      metric: "Error rate rose to 2.4%",
      trend: "Started 2 days ago",
      recommendation: "Investigate downstream database timeouts.",
    },
    {
      id: "in-3",
      type: "costly",
      endpointId: endpoints[2].id,
      metric: "Cost score 98/100",
      trend: "Consistent high compute",
      recommendation: "Optimize payload size or paginate results.",
    },
  ];
};

const MOCK_ENDPOINTS = generateEndpoints();
const MOCK_TIME_SERIES = generateTimeSeriesData();
const MOCK_INSIGHTS = generateInsights(MOCK_ENDPOINTS);

export const mockApi = {
  getKPIs: (): KPIOverview => {
    return {
      totalRequests: 1420500,
      totalRequestsTrend: 12.5,
      avgLatency: 124,
      avgLatencyTrend: -4.2,
      errorRate: 0.12,
      errorRateTrend: 0.01,
      costScore: 84,
      costScoreTrend: 5.1,
      activeEndpoints: MOCK_ENDPOINTS.length,
    };
  },

  getTimeSeriesData: (): TimeSeriesDataPoint[] => {
    return MOCK_TIME_SERIES;
  },

  getEndpoints: (): Endpoint[] => {
    return MOCK_ENDPOINTS;
  },

  getInsights: (): Insight[] => {
    return MOCK_INSIGHTS;
  }
};
