import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Shield, Activity, Bell, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type AgentKey = | "DomainHijack" | "SslTlsCheck"
  | "SecurityHeaders" | "CredentialCheck" | "CorsPolicy" | "RedirectChain"
  | "LatencyPerformance" | "Metrics"
  | "CostAnalysis" | "SecurityAgentEvaluation" | "Alert";

export type AgentCategory = "validation" | "security" | "performance" | "alerting";
export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "PASS";

export interface AgentDef {
  key: AgentKey;
  label: string;
  category: AgentCategory;
  desc: string;
}

export interface Preset {
  id: string;
  label: string;
  desc: string;
  color: string;
  agents: AgentKey[];
}

export interface ScanResult {
  agent: AgentKey;
  label: string;
  status: FindingSeverity;
  findings: number;
  detail: string;
}

export const agentPriority: Record<AgentKey, number> = {
  DomainHijack: 2,
  SslTlsCheck: 3,
  SecurityHeaders: 4,
  CredentialCheck: 5,
  CorsPolicy: 6,
  RedirectChain: 7,
  LatencyPerformance: 10,
  Metrics: 11,
  CostAnalysis: 12,
  SecurityAgentEvaluation: 13,
  Alert: 20,
};

export const AGENTS: AgentDef[] = [
  {
    key: "RedirectChain", label: "Redirect Chain", category: "validation",
    desc: "Traces HTTP redirect chains and flags loops, excessive hops, and insecure redirects.",
  },
  {
    key: "DomainHijack", label: "Domain Hijacking", category: "security",
    desc: "Detects expired or dangling DNS records that could allow subdomain takeover attacks.",
  },
  {
    key: "SslTlsCheck", label: "SSL / TLS Check", category: "security",
    desc: "Audits certificate validity, cipher suites, protocol versions, and HSTS configuration.",
  },
  {
    key: "SecurityHeaders", label: "Security Headers", category: "security",
    desc: "Checks for CSP, X-Frame-Options, HSTS, X-Content-Type-Options, and Permissions-Policy.",
  },
  {
    key: "CredentialCheck", label: "Credential Check", category: "security",
    desc: "Scans public-facing responses for exposed credentials, tokens, or API keys.",
  },
  {
    key: "CorsPolicy", label: "CORS Policy", category: "security",
    desc: "Validates Cross-Origin Resource Sharing policies for overly-permissive configurations.",
  },
  {
    key: "SecurityAgentEvaluation", label: "Security Evaluation", category: "security",
    desc: "AI-driven evaluation aggregating all security signals into a unified risk score.",
  },
  {
    key: "LatencyPerformance", label: "Latency & Performance", category: "performance",
    desc: "Measures end-to-end latency, TTFB, and throughput across all selected endpoints.",
  },
  {
    key: "Metrics", label: "Metrics Collection", category: "performance",
    desc: "Collects request counts, error rates, and resource utilization metrics per endpoint.",
  },
  {
    key: "CostAnalysis", label: "Cost Analysis", category: "performance",
    desc: "Models cloud compute and egress cost per endpoint based on observed traffic patterns.",
  },
  {
    key: "Alert", label: "Alert Configuration", category: "alerting",
    desc: "Configures alert thresholds and notification channels for triggered findings.",
  },
];

export const PRESETS: Preset[] = [
  {
    id: "full", label: "Full Scan", color: "violet",
    desc: "All 14 agents — comprehensive security, performance, and validation audit.",
    agents: AGENTS.map((a) => a.key),
  },
  {
    id: "security", label: "Security Suite", color: "pink",
    desc: "7 security agents: CORS, headers, TLS, credentials, domain, mixed content, and evaluation.",
    agents: ["DomainHijack", "SslTlsCheck", "SecurityHeaders", "CredentialCheck", "CorsPolicy", "SecurityAgentEvaluation"],
  },
  {
    id: "performance", label: "Performance Suite", color: "cyan",
    desc: "Latency, rate limits, cost modelling, and metrics across all your endpoints.",
    agents: ["LatencyPerformance", "Metrics", "CostAnalysis"],
  },
];

export const categoryMeta: Record<AgentCategory, {
  label: string; icon: LucideIcon; color: string; bg: string; border: string;
}> = {
  validation: { label: "Validation", icon: CheckCircle2, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  security: { label: "Security", icon: Shield, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  performance: { label: "Performance", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  alerting: { label: "Alerting", icon: Bell, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

export const presetColorMap: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
  pink: "from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400",
  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
};

export const severityConfig: Record<FindingSeverity, {
  label: string; color: string; bg: string; icon: LucideIcon;
}> = {
  CRITICAL: { label: "Critical", color: "text-pink-400", bg: "from-pink-500/20 to-pink-500/5 border-pink-500/30", icon: AlertTriangle },
  HIGH: { label: "High", color: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5 border-amber-500/30", icon: AlertCircle },
  MEDIUM: { label: "Medium", color: "text-cyan-400", bg: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30", icon: Info },
  LOW: { label: "Low", color: "text-muted-foreground", bg: "from-muted/20 to-muted/5 border-border/30", icon: Info },
  PASS: { label: "Pass", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30", icon: CheckCircle2 },
};



export enum agentKeyPriority {
  UrlValidationAndEndpoints = 1,   // Gatekeeper — runs first, always
  DomainHijack = 2,   // DNS takeover / dangling CNAME
  SslTlsCheck = 3,   // Certificate validity + TLS version
  SecurityHeaders = 4,   // HSTS, CSP, X-Frame-Options, etc.
  CredentialCheck = 5,   // Login form posture, cookies, exposed secrets
  CorsPolicy = 6,   // CORS misconfiguration
  RedirectChain = 7,   // HTTP→HTTPS redirect, loop detection
  MixedContent = 8,   // HTTP resources on HTTPS pages
  RateLimitProbe = 9,   // Rate limiting enforcement probe
  LatencyPerformance = 10,  // TTFB + total latency
  Metrics = 11,  // Status code, error rate, perf grade
  CostAnalysis = 12,  // Cost score from latency + error signals
  SecurityAgentEvaluation = 13,  // Aggregate security verdict (runs last of security tier)
  Alert = 20,  // Notification dispatch — always final
}

export const MOCK_RESULTS: ScanResult[] = [
  { agent: "SslTlsCheck", label: "SSL / TLS Check", status: "MEDIUM", findings: 2, detail: "TLS 1.0 still enabled on the API. Certificate expires in 14 days — renew soon to avoid downtime." },
  { agent: "SecurityHeaders", label: "Security Headers", status: "HIGH", findings: 3, detail: "Missing Content-Security-Policy, X-Frame-Options, and Permissions-Policy. These headers protect against XSS and clickjacking attacks." },
  { agent: "DomainHijack", label: "Domain Hijacking", status: "PASS", findings: 0, detail: "No dangling DNS records or vulnerable subdomains detected." },
  { agent: "CredentialCheck", label: "Credential Check", status: "CRITICAL", findings: 1, detail: "Potential API key exposed in /api/v1/config response body. Rotate this key immediately and audit access logs." },
  { agent: "CorsPolicy", label: "CORS Policy", status: "HIGH", findings: 1, detail: "Access-Control-Allow-Origin: * set on authenticated routes. This allows any site to make cross-origin requests using user credentials." },
  { agent: "RedirectChain", label: "Redirect Chain", status: "PASS", findings: 0, detail: "No redirect loops or chains exceeding 3 hops detected." },
  { agent: "LatencyPerformance", label: "Latency & Performance", status: "LOW", findings: 1, detail: "p95 latency at 620ms on GET /api/v1/users — slightly above the 500ms recommended threshold." },
  { agent: "Metrics", label: "Metrics Collection", status: "PASS", findings: 0, detail: "Metrics baseline established. Average TTFB: 142ms across all scanned endpoints." },
  { agent: "CostAnalysis", label: "Cost Analysis", status: "LOW", findings: 1, detail: "Estimated $38/month for current traffic patterns — within normal range but trending upward over the past 7 days." },
  { agent: "SecurityAgentEvaluation", label: "Security Evaluation", status: "HIGH", findings: 2, detail: "Aggregate security score: 52/100. Two critical paths require immediate attention: exposed credentials and CORS wildcard on auth routes." },
  { agent: "Alert", label: "Alert Configuration", status: "PASS", findings: 0, detail: "Alert rules configured and routed to the default notification channel successfully." },
];
