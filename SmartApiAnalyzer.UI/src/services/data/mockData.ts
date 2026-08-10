import { TimeSeriesDataPoint, KPIOverview, WebsiteApiGroup } from "@/types";

/* ─────────────────────────────────────────────────────────
   Existing exports (preserved)
───────────────────────────────────────────────────────── */

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

export const mockWebsiteApis: WebsiteApiGroup[] = [
  {
    id: "site-1",
    websiteUrl: "https://company-one.com",
    discoveredAt: "2026-05-25",
    endpoints: [
      { id: "ep-1", inferredPath: "https://api.company-one.com/v1/users", correctedPath: "", method: "GET", confidence: 92, selected: true, status: "verified" },
      { id: "ep-2", inferredPath: "https://api.company-one.com/v1/orders", correctedPath: "", method: "POST", confidence: 76, selected: false, status: "unverified" },
    ],
  },
  {
    id: "site-2",
    websiteUrl: "https://shop.example.io",
    discoveredAt: "2026-05-25",
    endpoints: [
      { id: "ep-3", inferredPath: "https://backend.shop.example.io/cart", correctedPath: "", method: "GET", confidence: 88, selected: true, status: "verified" },
    ],
  },
  {
    id: "site-3",
    websiteUrl: "https://api.example.com",
    discoveredAt: "2026-05-25",
    endpoints: [
      { id: "ep-4", inferredPath: "https://demo.shop.example.io/cart", correctedPath: "", method: "GET", confidence: 88, selected: true, status: "verified" },
    ],
  },
  {
    id: "site-4",
    websiteUrl: "https://python.example.com",
    discoveredAt: "2026-05-25",
    endpoints: [
      { id: "ep-5", inferredPath: "https://python.shop.example.io/cart", correctedPath: "", method: "GET", confidence: 88, selected: true, status: "verified" },
    ],
  },
  {
    id: "site-5",
    websiteUrl: "https://java.example.com",
    discoveredAt: "2026-05-25",
    endpoints: [
      { id: "ep-6", inferredPath: "https://java.shop.example.io/cart", correctedPath: "", method: "GET", confidence: 88, selected: true, status: "verified" },
    ],
  },
];

export const mockInsights = [
  { id: "in-1", type: "slow", metric: "p95 latency is 1.2s", trend: "+40% this week", recommendation: "Add caching to GET /api/users/:id" },
  { id: "in-2", type: "degrading", metric: "Error rate rose to 2.4%", trend: "Started 2 days ago", recommendation: "Check downstream database pool saturation" },
  { id: "in-3", type: "costly", metric: "Cost score 98/100", trend: "Consistent high compute", recommendation: "Paginate responses and compress payloads" },
];

/* ─────────────────────────────────────────────────────────
   Extended types for agent scan payload
───────────────────────────────────────────────────────── */

export interface AgentLogEntry {
  ts: number;     // ms offset from scan start
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface AgentScanResult {
  agentKey: string;
  agentLabel: string;
  category: "validation" | "security" | "performance" | "alerting";
  status: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "PASS";
  findings: number;
  detail: string;
  duration: number;
  logs: AgentLogEntry[];
}

export interface MockScanPayload {
  scanId: string;
  startedAt: string;
  completedAt: string;
  targets: string[];
  totalDuration: number;
  agentResults: AgentScanResult[];
}

export interface InsightFinding {
  id: string;
  agentKey: string;
  agentLabel: string;
  category: "validation" | "security" | "performance" | "alerting";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  affectedTargets: string[];
  recommendation: string;
  effort: "Low" | "Medium" | "High";
  savingsPerMonth?: string;
  cveRef?: string;
}

/* ─────────────────────────────────────────────────────────
   Mock scan payload — simulates backend WebSocket stream
───────────────────────────────────────────────────────── */

export const mockScanPayload: MockScanPayload = {
  scanId: "scan-demo-001",
  startedAt: "2026-05-27T11:30:00Z",
  completedAt: "2026-05-27T11:30:44Z",
  targets: [
    "https://api.company-one.com/v1/users",
    "https://api.company-one.com/v1/orders",
    "https://backend.shop.example.io/cart",
  ],
  totalDuration: 44120,
  agentResults: [
    {
      agentKey: "UrlValidationAndEndpoints", agentLabel: "URL Validation & Endpoints",
      category: "validation", status: "PASS", findings: 0, duration: 1240,
      detail: "3 of 3 targets reachable. No dead endpoints detected.",
      logs: [
        { ts: 0, level: "info", message: "Starting endpoint crawl..." },
        { ts: 320, level: "info", message: "Probing https://api.company-one.com/v1/users" },
        { ts: 580, level: "success", message: "HTTP 200 — endpoint reachable" },
        { ts: 780, level: "info", message: "Probing https://api.company-one.com/v1/orders" },
        { ts: 1000, level: "success", message: "HTTP 200 — endpoint reachable" },
        { ts: 1100, level: "info", message: "Probing https://backend.shop.example.io/cart" },
        { ts: 1240, level: "success", message: "All 3 targets validated successfully" },
      ],
    },
    {
      agentKey: "RedirectChain", agentLabel: "Redirect Chain",
      category: "validation", status: "LOW", findings: 1, duration: 1350,
      detail: "3-hop redirect chain on /v1/orders adds ~60ms per request.",
      logs: [
        { ts: 0, level: "info", message: "Tracing redirect chains on all targets..." },
        { ts: 450, level: "success", message: "/v1/users — no redirects detected" },
        { ts: 900, level: "warning", message: "/v1/orders — 3-hop chain: HTTP → HTTPS → www → api" },
        { ts: 1200, level: "info", message: "/cart — single hop, HTTPS direct" },
        { ts: 1350, level: "success", message: "No redirect loops found" },
      ],
    },
    {
      agentKey: "DomainHijack", agentLabel: "Domain Hijacking",
      category: "security", status: "PASS", findings: 0, duration: 980,
      detail: "DNS records clean. No hijack vectors detected.",
      logs: [
        { ts: 0, level: "info", message: "Resolving DNS records for all domains..." },
        { ts: 320, level: "info", message: "Checking for dangling CNAME entries..." },
        { ts: 650, level: "success", message: "company-one.com — DNS A records match origin IPs" },
        { ts: 980, level: "success", message: "No dangling subdomain records found" },
      ],
    },
    {
      agentKey: "SslTlsCheck", agentLabel: "SSL / TLS Check",
      category: "security", status: "PASS", findings: 0, duration: 1800,
      detail: "TLS 1.3 enforced, certificate valid until 2027-03-14, no weak ciphers.",
      logs: [
        { ts: 0, level: "info", message: "Initiating TLS handshake with api.company-one.com..." },
        { ts: 400, level: "success", message: "TLS 1.3 negotiated" },
        { ts: 800, level: "success", message: "Certificate: *.company-one.com valid until 2027-03-14" },
        { ts: 1200, level: "success", message: "No weak cipher suites detected (RC4, DES, EXPORT — clean)" },
        { ts: 1800, level: "success", message: "OCSP stapling enabled — no revocation issues" },
      ],
    },
    {
      agentKey: "SecurityHeaders", agentLabel: "Security Headers",
      category: "security", status: "HIGH", findings: 3, duration: 2100,
      detail: "3 headers missing: HSTS (HIGH), Content-Security-Policy, X-Frame-Options.",
      logs: [
        { ts: 0, level: "info", message: "Fetching HTTP response headers from all targets..." },
        { ts: 500, level: "success", message: "X-Content-Type-Options: nosniff — present" },
        { ts: 800, level: "warning", message: "X-Frame-Options — header absent on all routes" },
        { ts: 1200, level: "warning", message: "Content-Security-Policy — not configured" },
        { ts: 1700, level: "error", message: "Strict-Transport-Security (HSTS) — missing [HIGH]" },
        { ts: 2100, level: "info", message: "3 header issues found across targets" },
      ],
    },
    {
      agentKey: "CredentialCheck", agentLabel: "Credential Check",
      category: "security", status: "CRITICAL", findings: 1, duration: 3200,
      detail: "API key found in response body of GET /v1/users — rotate immediately.",
      logs: [
        { ts: 0, level: "info", message: "Scanning response bodies for credential patterns..." },
        { ts: 600, level: "info", message: "Checking for API keys in response JSON..." },
        { ts: 1200, level: "info", message: "Checking Authorization headers for leaks..." },
        { ts: 1800, level: "error", message: "CRITICAL: 'api_key' field exposed in GET /v1/users body" },
        { ts: 2400, level: "warning", message: "Potential debug token visible in X-Debug-Token header" },
        { ts: 3200, level: "error", message: "1 critical credential exposure confirmed — rotate NOW" },
      ],
    },
    {
      agentKey: "CorsPolicy", agentLabel: "CORS Policy",
      category: "security", status: "MEDIUM", findings: 2, duration: 1600,
      detail: "Wildcard CORS + credentials allowed on /v1/users — MEDIUM severity.",
      logs: [
        { ts: 0, level: "info", message: "Sending OPTIONS preflight requests..." },
        { ts: 500, level: "warning", message: "Access-Control-Allow-Origin: * on /v1/users (wildcard)" },
        { ts: 900, level: "warning", message: "Access-Control-Allow-Credentials: true with wildcard — risky" },
        { ts: 1300, level: "success", message: "/v1/orders — restrictive CORS policy" },
        { ts: 1600, level: "success", message: "/cart — restrictive CORS policy" },
      ],
    },
    {
      agentKey: "MixedContent", agentLabel: "Mixed Content",
      category: "security", status: "PASS", findings: 0, duration: 1100,
      detail: "No mixed content detected across all targets.",
      logs: [
        { ts: 0, level: "info", message: "Scanning for HTTP resources on HTTPS pages..." },
        { ts: 400, level: "success", message: "No HTTP script or stylesheet sources found" },
        { ts: 800, level: "success", message: "No HTTP image or media sources found" },
        { ts: 1100, level: "success", message: "All referenced assets served over HTTPS" },
      ],
    },
    {
      agentKey: "SecurityAgentEvaluation", agentLabel: "Security Evaluation",
      category: "security", status: "HIGH", findings: 2, duration: 1500,
      detail: "Aggregate security score: 52/100. Credential exposure + CORS wildcard require immediate action.",
      logs: [
        { ts: 0, level: "info", message: "Aggregating security signals from all agents..." },
        { ts: 500, level: "warning", message: "2 critical/high paths identified" },
        { ts: 1000, level: "error", message: "Credential exposure: CRITICAL impact on data integrity" },
        { ts: 1500, level: "warning", message: "Security posture score: 52/100 — action required" },
      ],
    },
    {
      agentKey: "RateLimitProbe", agentLabel: "Rate Limit Probe",
      category: "performance", status: "MEDIUM", findings: 1, duration: 4200,
      detail: "/v1/orders has no rate limiting — potential DDoS and abuse vector.",
      logs: [
        { ts: 0, level: "info", message: "Sending burst requests to probe rate limits..." },
        { ts: 700, level: "success", message: "/v1/users — 100 req/min limit enforced (HTTP 429 returned)" },
        { ts: 1600, level: "warning", message: "/v1/orders — no X-RateLimit-* headers returned" },
        { ts: 2400, level: "error", message: "/v1/orders — 500 req/min flood returned HTTP 200 — no throttle" },
        { ts: 3200, level: "success", message: "/cart — 50 req/min limit enforced" },
        { ts: 4200, level: "info", message: "1 endpoint with no rate limiting detected" },
      ],
    },
    {
      agentKey: "LatencyPerformance", agentLabel: "Latency & Performance",
      category: "performance", status: "HIGH", findings: 2, duration: 5600,
      detail: "/v1/orders p95 = 1,840ms — severe tail latency. Likely missing DB index.",
      logs: [
        { ts: 0, level: "info", message: "Running 50 cold-start requests per endpoint..." },
        { ts: 1100, level: "success", message: "/v1/users — p50: 88ms, p95: 142ms — within threshold" },
        { ts: 2200, level: "error", message: "/v1/orders — p95: 1,840ms — exceeds 1,000ms threshold" },
        { ts: 3300, level: "error", message: "/v1/orders — p99: 3,200ms — severe tail latency" },
        { ts: 4400, level: "success", message: "/cart — p95: 210ms — acceptable" },
        { ts: 5600, level: "info", message: "2 endpoints with latency degradation found" },
      ],
    },
    {
      agentKey: "Metrics", agentLabel: "Metrics Collection",
      category: "performance", status: "PASS", findings: 0, duration: 2200,
      detail: "Full observability stack active — Prometheus, health checks, and tracing detected.",
      logs: [
        { ts: 0, level: "info", message: "Checking observability endpoints..." },
        { ts: 700, level: "success", message: "Prometheus /metrics endpoint — active" },
        { ts: 1300, level: "success", message: "Health check /health — HTTP 200, 12ms" },
        { ts: 2200, level: "success", message: "X-Request-ID tracing headers detected" },
      ],
    },
    {
      agentKey: "CostAnalysis", agentLabel: "Cost Analysis",
      category: "performance", status: "MEDIUM", findings: 2, duration: 3800,
      detail: "N+1 query pattern + oversized responses. Est. $1,240/mo in preventable waste.",
      logs: [
        { ts: 0, level: "info", message: "Estimating per-request compute cost from trace data..." },
        { ts: 950, level: "warning", message: "/v1/orders — avg response: 18KB (recommend pagination < 5KB)" },
        { ts: 1900, level: "warning", message: "/v1/users — N+1 query pattern detected (14 DB calls per request)" },
        { ts: 2850, level: "success", message: "/cart — response size optimal at 1.2KB" },
        { ts: 3800, level: "info", message: "Estimated unnecessary cost: ~$1,240/month" },
      ],
    },
    {
      agentKey: "Alert", agentLabel: "Alert Configuration",
      category: "alerting", status: "LOW", findings: 1, duration: 900,
      detail: "Missing latency threshold alert on /v1/orders despite documented p95 > 1,800ms.",
      logs: [
        { ts: 0, level: "info", message: "Reviewing alert rules and notification channels..." },
        { ts: 300, level: "success", message: "Error rate alerts configured — threshold: > 1%" },
        { ts: 600, level: "warning", message: "No p95 latency alert on /v1/orders — gap detected" },
        { ts: 900, level: "info", message: "Recommendation: add alert for p95 > 1,000ms on orders" },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────
   Insight findings — detailed per-finding breakdown
   shown on the Insights / Scan Report tab
───────────────────────────────────────────────────────── */

export const mockInsightFindings: InsightFinding[] = [
  {
    id: "f-01",
    agentKey: "CredentialCheck", agentLabel: "Credential Check",
    category: "security", severity: "CRITICAL",
    title: "API key exposed in GET /v1/users response body",
    description:
      "The JSON response from GET /v1/users includes an 'api_key' field with a live production credential. Any authenticated client or intercepting proxy can extract and reuse this key to make arbitrary API calls.",
    affectedTargets: ["https://api.company-one.com/v1/users"],
    recommendation:
      "1. Rotate the exposed API key immediately. 2. Audit access logs for the past 30 days for unauthorized usage. 3. Remove credential fields from response serializers. 4. Add a secrets-scanning step to your CI pipeline.",
    effort: "Low",
    cveRef: "CWE-200",
  },
  {
    id: "f-02",
    agentKey: "SecurityHeaders", agentLabel: "Security Headers",
    category: "security", severity: "HIGH",
    title: "Strict-Transport-Security (HSTS) header missing",
    description:
      "HSTS is not configured on any of the scanned routes. Without it, browsers will not enforce HTTPS, making users vulnerable to SSL-stripping attacks on public networks.",
    affectedTargets: [
      "https://api.company-one.com/v1/users",
      "https://api.company-one.com/v1/orders",
      "https://backend.shop.example.io/cart",
    ],
    recommendation:
      "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' to all HTTPS responses. Register on the HSTS preload list for maximum coverage.",
    effort: "Low",
    cveRef: "CWE-319",
  },
  {
    id: "f-03",
    agentKey: "LatencyPerformance", agentLabel: "Latency & Performance",
    category: "performance", severity: "HIGH",
    title: "p95 latency of 1,840ms on POST /v1/orders",
    description:
      "Tail latency on the orders endpoint is 12× higher than the recommended 150ms threshold. Root cause analysis points to a full-table scan on the orders table — likely a missing composite index.",
    affectedTargets: ["https://api.company-one.com/v1/orders"],
    recommendation:
      "Add a composite index on orders(user_id, created_at DESC). Instrument slow-query logging on your DB to confirm. Consider read-replica offloading for report-style queries.",
    effort: "Medium",
    savingsPerMonth: "$420/mo compute",
    cveRef: undefined,
  },
  {
    id: "f-04",
    agentKey: "CorsPolicy", agentLabel: "CORS Policy",
    category: "security", severity: "MEDIUM",
    title: "Wildcard CORS origin with credentials on /v1/users",
    description:
      "Access-Control-Allow-Origin is set to '*' while Access-Control-Allow-Credentials is 'true'. Most browsers block this combination, but some older clients do not — allowing cross-origin requests to read authenticated responses.",
    affectedTargets: ["https://api.company-one.com/v1/users"],
    recommendation:
      "Replace the wildcard with a strict allowlist of known origins (e.g. 'https://app.company-one.com'). Never combine wildcard with credentials.",
    effort: "Low",
    cveRef: "CWE-942",
  },
  {
    id: "f-05",
    agentKey: "RateLimitProbe", agentLabel: "Rate Limit Probe",
    category: "performance", severity: "MEDIUM",
    title: "No rate limiting on POST /v1/orders",
    description:
      "The orders endpoint accepted 500 requests/min without returning HTTP 429 or any throttle headers. This makes it trivially abusable for credential stuffing, inventory abuse, or DDoS amplification.",
    affectedTargets: ["https://api.company-one.com/v1/orders"],
    recommendation:
      "Implement token-bucket rate limiting (e.g. 60 req/min per authenticated user). Return standard 429 + Retry-After headers. Consider CAPTCHA for unauthenticated paths.",
    effort: "Medium",
  },
  {
    id: "f-06",
    agentKey: "CostAnalysis", agentLabel: "Cost Analysis",
    category: "performance", severity: "MEDIUM",
    title: "N+1 query pattern causing 14 DB round-trips per /v1/users request",
    description:
      "Trace data shows each call to GET /v1/users triggers 14 sequential database queries — a classic N+1 pattern. At current traffic (42K req/day) this is 588K unnecessary DB calls per day.",
    affectedTargets: ["https://api.company-one.com/v1/users"],
    recommendation:
      "Refactor the ORM query to use eager loading (e.g. SELECT … JOIN or DataLoader pattern). Verify with EXPLAIN ANALYZE before and after.",
    effort: "Medium",
    savingsPerMonth: "$780/mo DB compute",
  },
  {
    id: "f-07",
    agentKey: "RedirectChain", agentLabel: "Redirect Chain",
    category: "validation", severity: "LOW",
    title: "3-hop redirect chain adds ~60ms to every /v1/orders request",
    description:
      "Traffic flows HTTP → HTTPS → www.company-one.com → api.company-one.com before reaching the API. Each hop adds a network round-trip.",
    affectedTargets: ["https://api.company-one.com/v1/orders"],
    recommendation:
      "Update your DNS / load balancer to point directly to the API origin. Remove intermediate redirects. Update all internal clients to use the direct HTTPS URL.",
    effort: "Low",
  },
  {
    id: "f-08",
    agentKey: "Alert", agentLabel: "Alert Configuration",
    category: "alerting", severity: "LOW",
    title: "No latency alert configured for /v1/orders",
    description:
      "Despite p95 latency exceeding 1,800ms, there are no alert rules for this endpoint. Degradations could go undetected for hours in production.",
    affectedTargets: ["https://api.company-one.com/v1/orders"],
    recommendation:
      "Add a p95 > 1,000ms alert routed to your on-call channel. Set a warning at 500ms and a critical at 1,000ms. Use your existing Prometheus/Alertmanager stack.",
    effort: "Low",
  },
];
