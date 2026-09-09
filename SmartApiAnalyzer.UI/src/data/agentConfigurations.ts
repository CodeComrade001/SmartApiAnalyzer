import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BellRing,
  CircleDollarSign,
  CloudCog,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  Network,
  RadioTower,
  Route,
  ShieldCheck,
  Timer,
  Waypoints,
} from "lucide-react";
import type { AgentKey, AgentCategory } from "@/data/agentCatalog";
import type { DeploymentFieldGroup, DeploymentFieldValue } from "@/data/deploymentModules";

export interface AgentConfigurationDefinition {
  key: AgentKey;
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  defaultValues: Record<string, DeploymentFieldValue>;
  groups: DeploymentFieldGroup[];
}

const select = (label: string, value: string) => ({ label, value });

export const agentConfigurations: AgentConfigurationDefinition[] = [
  {
    key: "DomainHijack",
    title: "Domain Hijacking",
    eyebrow: "Security / DNS ownership",
    description: "Document the DNS and certificate signals that should be considered when checking for dangling domains.",
    icon: Network,
    accent: "pink",
    defaultValues: { enabled: true, checkCname: true, checkNs: true, lookbackDays: 30, notifyOwner: true },
    groups: [
      {
        id: "dns-signals",
        title: "DNS signals",
        description: "Keep ownership checks explicit so a future connector can map them to your DNS provider.",
        fields: [
          { id: "checkCname", label: "Check CNAME targets", type: "toggle" },
          { id: "checkNs", label: "Check nameserver delegation", type: "toggle" },
          { id: "lookbackDays", label: "DNS change lookback", type: "number", min: 1, max: 180, help: "Days of DNS history to retain as context." },
        ],
      },
      {
        id: "ownership-policy",
        title: "Ownership response",
        description: "Choose how a possible ownership gap should be routed once alerting is connected.",
        fields: [
          { id: "notifyOwner", label: "Notify service owner", type: "toggle" },
        ],
      },
    ],
  },
  {
    key: "SslTlsCheck",
    title: "SSL / TLS Check",
    eyebrow: "Security / transport policy",
    description: "Set the minimum transport posture and certificate window your API estate should meet.",
    icon: LockKeyhole,
    accent: "pink",
    defaultValues: { enabled: true, minimumTls: "1.2", expiryWindow: 21, checkHsts: true, allowSelfSigned: false },
    groups: [
      {
        id: "transport",
        title: "Transport baseline",
        description: "These values are retained as policy inputs for a future TLS inspection contract.",
        fields: [
          { id: "minimumTls", label: "Minimum TLS version", type: "select", options: [select("TLS 1.2", "1.2"), select("TLS 1.3 only", "1.3")] },
          { id: "expiryWindow", label: "Certificate expiry warning", type: "number", min: 1, max: 180, help: "Warn this many days before certificate expiry." },
          { id: "checkHsts", label: "Require HSTS", type: "toggle" },
          { id: "allowSelfSigned", label: "Allow self-signed certificates", type: "toggle" },
        ],
      },
    ],
  },
  {
    key: "SecurityHeaders",
    title: "Security Headers",
    eyebrow: "Security / browser boundary",
    description: "Choose which browser-facing headers should be present and how strictly their values are reviewed.",
    icon: ShieldCheck,
    accent: "pink",
    defaultValues: { enabled: true, requireCsp: true, requireHsts: true, requireFrameGuard: true, policyMode: "strict" },
    groups: [
      {
        id: "required-headers",
        title: "Required headers",
        description: "Keep the baseline focused on controls that protect browsers and embedded API consoles.",
        fields: [
          { id: "requireCsp", label: "Require Content-Security-Policy", type: "toggle" },
          { id: "requireHsts", label: "Require Strict-Transport-Security", type: "toggle" },
          { id: "requireFrameGuard", label: "Require frame protection", type: "toggle" },
        ],
      },
      {
        id: "review",
        title: "Review mode",
        description: "A future policy adapter can turn this into severity thresholds.",
        fields: [
          { id: "policyMode", label: "Header policy mode", type: "select", options: [select("Strict", "strict"), select("Advisory", "advisory")] },
        ],
      },
    ],
  },
  {
    key: "CredentialCheck",
    title: "Credential Check",
    eyebrow: "Security / secret exposure",
    description: "Define where credential patterns may be inspected and how a potential exposure should be handled.",
    icon: KeyRound,
    accent: "pink",
    defaultValues: { enabled: true, inspectHeaders: true, inspectBodies: true, redactMatches: true, sensitivity: "balanced" },
    groups: [
      {
        id: "inspection-surface",
        title: "Inspection surface",
        description: "Choose the response surfaces that will be included when a backend inspection adapter is available.",
        fields: [
          { id: "inspectHeaders", label: "Inspect response headers", type: "toggle" },
          { id: "inspectBodies", label: "Inspect response bodies", type: "toggle" },
          { id: "redactMatches", label: "Redact matched values", type: "toggle", help: "Keep provisional records safe to share with reviewers." },
        ],
      },
      {
        id: "sensitivity",
        title: "Detection sensitivity",
        description: "The sensitivity setting is saved locally and has no effect on the scan flow.",
        fields: [
          { id: "sensitivity", label: "Pattern sensitivity", type: "select", options: [select("Balanced", "balanced"), select("Broad", "broad"), select("Conservative", "conservative")] },
        ],
      },
    ],
  },
  {
    key: "CorsPolicy",
    title: "CORS Policy",
    eyebrow: "Security / origin access",
    description: "Capture the intended cross-origin boundary for public and authenticated endpoints.",
    icon: Waypoints,
    accent: "pink",
    defaultValues: { enabled: true, allowedOrigins: "https://app.example.com", allowCredentials: false, requirePreflight: true },
    groups: [
      {
        id: "origin-policy",
        title: "Origin policy",
        description: "List the origins that should be treated as trusted when the policy contract is connected.",
        fields: [
          { id: "allowedOrigins", label: "Allowed origins", type: "textarea", placeholder: "One origin per line, for example https://app.example.com" },
          { id: "allowCredentials", label: "Allow credentials", type: "toggle", help: "Only enable when browser credentials are required by the contract." },
          { id: "requirePreflight", label: "Require preflight for unsafe methods", type: "toggle" },
        ],
      },
    ],
  },
  {
    key: "RedirectChain",
    title: "Redirect Chain",
    eyebrow: "Validation / route continuity",
    description: "Set redirect hop limits and the protocol transitions that should be considered safe.",
    icon: Route,
    accent: "violet",
    defaultValues: { enabled: true, maxHops: 3, allowHttpToHttps: true, allowCrossDomain: false, flagLoops: true },
    groups: [
      {
        id: "chain-policy",
        title: "Chain policy",
        description: "Make redirect behavior predictable for endpoint consumers and release reviewers.",
        fields: [
          { id: "maxHops", label: "Maximum redirect hops", type: "number", min: 0, max: 15 },
          { id: "allowHttpToHttps", label: "Allow HTTP to HTTPS", type: "toggle" },
          { id: "allowCrossDomain", label: "Allow cross-domain redirects", type: "toggle" },
          { id: "flagLoops", label: "Flag redirect loops", type: "toggle" },
        ],
      },
    ],
  },
  {
    key: "LatencyPerformance",
    title: "Latency & Performance",
    eyebrow: "Performance / response time",
    description: "Set the latency windows and sampling preferences that define a healthy endpoint response.",
    icon: Gauge,
    accent: "cyan",
    defaultValues: { enabled: true, sampleCount: 20, p50Threshold: 200, p95Threshold: 500, p99Threshold: 1000, timeoutMs: 3000, includeTtfb: true, region: "global" },
    groups: [
      {
        id: "latency-baseline",
        title: "Latency baseline",
        description: "Make the future performance contract explicit without executing a request.",
        fields: [
          { id: "sampleCount", label: "Samples per endpoint", type: "number", min: 3, max: 100 },
          { id: "p50Threshold", label: "p50 threshold (ms)", type: "number", min: 1, max: 10000 },
          { id: "p95Threshold", label: "p95 threshold (ms)", type: "number", min: 1, max: 10000 },
          { id: "p99Threshold", label: "p99 threshold (ms)", type: "number", min: 1, max: 10000 },
          { id: "timeoutMs", label: "Timeout threshold (ms)", type: "number", min: 100, max: 120000 },
          { id: "includeTtfb", label: "Track time to first byte", type: "toggle" },
        ],
      },
      {
        id: "sampling",
        title: "Sampling location",
        description: "Choose the provisional perspective for latency comparisons.",
        fields: [
          { id: "region", label: "Sampling region", type: "select", options: [select("Global", "global"), select("North America", "north-america"), select("Europe", "europe"), select("Asia Pacific", "asia-pacific")] },
        ],
      },
    ],
  },
  {
    key: "Metrics",
    title: "Metrics Collection",
    eyebrow: "Performance / observability",
    description: "Choose the operational signals and retention window that should frame endpoint health.",
    icon: Activity,
    accent: "cyan",
    defaultValues: { enabled: true, collectErrors: true, collectTraffic: true, collectUtilization: false, collectLatencyPercentiles: true, aggregationWindow: "5m", errorRateThreshold: 1, retentionDays: 30 },
    groups: [
      {
        id: "signals",
        title: "Signals",
        description: "Select the provisional metric families for a future telemetry connector.",
        fields: [
          { id: "collectErrors", label: "Collect error rates", type: "toggle" },
          { id: "collectTraffic", label: "Collect request volume", type: "toggle" },
          { id: "collectUtilization", label: "Collect resource utilization", type: "toggle" },
          { id: "collectLatencyPercentiles", label: "Collect p50 / p95 / p99 latency", type: "toggle" },
        ],
      },
      {
        id: "retention",
        title: "Retention",
        description: "This browser-only value is a planning input, not a live telemetry setting.",
        fields: [
          { id: "retentionDays", label: "Retention window (days)", type: "number", min: 1, max: 365 },
          { id: "aggregationWindow", label: "Aggregation window", type: "select", options: [select("1 minute", "1m"), select("5 minutes", "5m"), select("15 minutes", "15m"), select("1 hour", "1h")] },
          { id: "errorRateThreshold", label: "Error-rate warning (%)", type: "number", min: 0, max: 100 },
        ],
      },
    ],
  },
  {
    key: "CostAnalysis",
    title: "Cost Analysis",
    eyebrow: "Performance / spend model",
    description: "Describe the billing context and cost signals that should be used for a future endpoint model.",
    icon: CircleDollarSign,
    accent: "cyan",
    defaultValues: { enabled: true, provider: "aws", includeEgress: true, includeCompute: true, currency: "USD", monthlyBudget: 10000, budgetAlertPercent: 80, sampleWindowDays: 30 },
    groups: [
      {
        id: "cost-sources",
        title: "Cost sources",
        description: "Keep model inputs visible before a billing connector is available.",
        fields: [
          { id: "provider", label: "Cloud provider", type: "select", options: [select("Amazon Web Services", "aws"), select("Google Cloud", "gcp"), select("Microsoft Azure", "azure")] },
          { id: "includeEgress", label: "Include egress", type: "toggle" },
          { id: "includeCompute", label: "Include compute", type: "toggle" },
          { id: "monthlyBudget", label: "Monthly budget", type: "number", min: 0, max: 100000000 },
          { id: "budgetAlertPercent", label: "Budget alert at (%)", type: "number", min: 1, max: 100 },
          { id: "sampleWindowDays", label: "Traffic sample window (days)", type: "number", min: 1, max: 365 },
        ],
      },
      {
        id: "currency",
        title: "Presentation",
        description: "Choose the display currency for a future cost report.",
        fields: [
          { id: "currency", label: "Display currency", type: "select", options: [select("USD", "USD"), select("EUR", "EUR"), select("GBP", "GBP")] },
        ],
      },
    ],
  },
  {
    key: "SecurityAgentEvaluation",
    title: "Security Evaluation",
    eyebrow: "Security / aggregate posture",
    description: "Set how individual security signals should be grouped into a provisional review posture.",
    icon: ShieldCheck,
    accent: "pink",
    defaultValues: { enabled: true, includeCritical: true, includeMedium: true, weighting: "balanced", reviewThreshold: 70 },
    groups: [
      {
        id: "evaluation-inputs",
        title: "Evaluation inputs",
        description: "Keep the aggregate evaluator's scope explicit and easy to revise.",
        fields: [
          { id: "includeCritical", label: "Include critical findings", type: "toggle" },
          { id: "includeMedium", label: "Include medium findings", type: "toggle" },
          { id: "weighting", label: "Signal weighting", type: "select", options: [select("Balanced", "balanced"), select("Risk-first", "risk-first"), select("Coverage-first", "coverage-first")] },
        ],
      },
      {
        id: "threshold",
        title: "Review threshold",
        description: "A future score below this value can request human review.",
        fields: [
          { id: "reviewThreshold", label: "Minimum review score", type: "number", min: 0, max: 100 },
        ],
      },
    ],
  },
  {
    key: "Alert",
    title: "Alert Configuration",
    eyebrow: "Alerting / notification policy",
    description: "Define the trigger threshold and notification route for future finding alerts.",
    icon: BellRing,
    accent: "amber",
    defaultValues: { enabled: true, severity: "high", channel: "email", digest: "immediate", owner: "" },
    groups: [
      {
        id: "trigger",
        title: "Trigger policy",
        description: "Choose which finding severity should create a notification candidate.",
        fields: [
          { id: "severity", label: "Minimum severity", type: "select", options: [select("Critical", "critical"), select("High", "high"), select("Medium", "medium"), select("Low", "low")] },
          { id: "digest", label: "Delivery cadence", type: "select", options: [select("Immediate", "immediate"), select("Hourly digest", "hourly"), select("Daily digest", "daily")] },
        ],
      },
      {
        id: "destination",
        title: "Destination",
        description: "This provisional destination is kept local until notification routing is connected.",
        fields: [
          { id: "channel", label: "Notification channel", type: "select", options: [select("Email", "email"), select("Webhook", "webhook"), select("Slack", "slack")] },
          { id: "owner", label: "Owner or destination", type: "text", placeholder: "security@yourcompany.com" },
        ],
      },
    ],
  },
];

export const agentConfigurationByKey = Object.fromEntries(
  agentConfigurations.map((definition) => [definition.key, definition]),
) as Record<AgentKey, AgentConfigurationDefinition>;

export function getAgentCategory(key: AgentKey): AgentCategory {
  const validation: AgentKey[] = ["RedirectChain"];
  const performance: AgentKey[] = ["LatencyPerformance", "Metrics", "CostAnalysis"];
  if (validation.includes(key)) return "validation";
  if (performance.includes(key)) return "performance";
  if (key === "Alert") return "alerting";
  return "security";
}