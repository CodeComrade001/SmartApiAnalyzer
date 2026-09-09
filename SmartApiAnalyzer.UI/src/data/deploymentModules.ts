import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownUp,
  Ban,
  Boxes,
  Cable,
  CircleGauge,
  FileQuestion,
  GitPullRequest,
  TimerReset,
} from "lucide-react";

export type DeploymentFieldValue = string | number | boolean;
export type DeploymentFieldType = "text" | "number" | "select" | "toggle" | "textarea";

export interface DeploymentFieldOption {
  label: string;
  value: string;
}

export interface DeploymentField {
  id: string;
  label: string;
  type: DeploymentFieldType;
  help?: string;
  placeholder?: string;
  options?: DeploymentFieldOption[];
  min?: number;
  max?: number;
}

export interface DeploymentFieldGroup {
  id: string;
  title: string;
  description: string;
  fields: DeploymentField[];
}

export interface DeploymentModule {
  key: string;
  slug: string;
  navLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  defaultValues: Record<string, DeploymentFieldValue>;
  groups: DeploymentFieldGroup[];
}

const providerOptions: DeploymentFieldOption[] = [
  { label: "GitHub pull requests", value: "github" },
  { label: "GitLab merge requests", value: "gitlab" },
  { label: "Bitbucket pull requests", value: "bitbucket" },
];

const environmentOptions: DeploymentFieldOption[] = [
  { label: "Production", value: "production" },
  { label: "Staging", value: "staging" },
  { label: "Both environments", value: "both" },
];

export const deploymentModules: DeploymentModule[] = [
  {
    key: "deployment-risk-assessment",
    slug: "risk-assessment",
    navLabel: "Deployment Risk Assessment",
    title: "Deployment Risk Assessment",
    eyebrow: "01 / change signal",
    description: "Define the signals that should be collected before a change is considered safe to promote.",
    icon: AlertTriangle,
    defaultValues: { enabled: true, environment: "production", riskWindow: 14, includeOwnership: true, includeRuntime: true },
    groups: [
      {
        id: "signal-sources",
        title: "Signal sources",
        description: "Choose which context is available to the provisional risk model.",
        fields: [
          { id: "environment", label: "Target environment", type: "select", options: environmentOptions },
          { id: "riskWindow", label: "Lookback window", type: "number", min: 1, max: 90, help: "Days of operational history to consider." },
          { id: "includeOwnership", label: "Include service ownership", type: "toggle", help: "Use code owners and on-call ownership as context." },
          { id: "includeRuntime", label: "Include runtime signals", type: "toggle", help: "Leave enabled to account for recent errors and latency." },
        ],
      },
      {
        id: "review-policy",
        title: "Review policy",
        description: "Keep this threshold visible to reviewers until a backend policy is connected.",
        fields: [
          { id: "reviewNote", label: "Reviewer note", type: "textarea", placeholder: "What should reviewers check before promoting this change?" },
        ],
      },
    ],
  },
  {
    key: "dependency-change-impact",
    slug: "dependency-impact",
    navLabel: "Dependency & Change Impact",
    title: "Dependency & Change Impact",
    eyebrow: "02 / graph context",
    description: "Set the dependency graph boundaries used to frame which services may be affected by a change.",
    icon: Cable,
    defaultValues: { enabled: true, depth: 2, includeTransitive: true, includeSharedData: true, provider: "github" },
    groups: [
      {
        id: "graph-boundary",
        title: "Graph boundary",
        description: "Tune how far impact context should travel across service relationships.",
        fields: [
          { id: "depth", label: "Dependency depth", type: "number", min: 1, max: 6, help: "Direct dependencies start at depth one." },
          { id: "includeTransitive", label: "Include transitive dependencies", type: "toggle" },
          { id: "includeSharedData", label: "Include shared data stores", type: "toggle", help: "Include queues, databases, and shared schemas." },
        ],
      },
      {
        id: "change-source",
        title: "Change source",
        description: "Keep provider selection separate from the future graph integration.",
        fields: [
          { id: "provider", label: "Change provider", type: "select", options: providerOptions },
          { id: "repositoryScope", label: "Repository scope", type: "text", placeholder: "platform/*" },
        ],
      },
    ],
  },
  {
    key: "cross-system-readiness",
    slug: "cross-system-readiness",
    navLabel: "Cross-System Deployment Readiness",
    title: "Cross-System Deployment Readiness",
    eyebrow: "03 / coordination",
    description: "Specify the systems that must be accounted for when a release crosses service boundaries.",
    icon: Boxes,
    defaultValues: { enabled: false, environment: "production", timeoutMinutes: 30, requireOwners: true, systems: "" },
    groups: [
      {
        id: "system-map",
        title: "System map",
        description: "Describe the minimum footprint for this readiness check.",
        fields: [
          { id: "systems", label: "Systems to coordinate", type: "textarea", placeholder: "payments-api\nledger-worker\ncustomer-events", help: "One service, queue, or data product per line." },
          { id: "environment", label: "Environment", type: "select", options: environmentOptions },
          { id: "requireOwners", label: "Require an owner per system", type: "toggle" },
        ],
      },
      {
        id: "coordination-window",
        title: "Coordination window",
        description: "Make the expected response window explicit for future integrations.",
        fields: [
          { id: "timeoutMinutes", label: "Response window", type: "number", min: 5, max: 240, help: "Minutes allowed for each system to acknowledge a release." },
        ],
      },
    ],
  },
  {
    key: "change-collision",
    slug: "change-collision",
    navLabel: "Change Collision Detection",
    title: "Change Collision Detection",
    eyebrow: "04 / merge pressure",
    description: "Configure how overlapping changes should be surfaced before they compete for the same production surface.",
    icon: Ban,
    defaultValues: { enabled: true, lookaheadHours: 48, comparePaths: true, compareOwners: true, severity: "medium" },
    groups: [
      {
        id: "collision-window",
        title: "Collision window",
        description: "Choose how much of the release calendar is considered active.",
        fields: [
          { id: "lookaheadHours", label: "Lookahead window", type: "number", min: 1, max: 336, help: "Hours of planned changes to compare." },
          { id: "comparePaths", label: "Compare changed paths", type: "toggle" },
          { id: "compareOwners", label: "Compare service owners", type: "toggle" },
        ],
      },
      {
        id: "collision-policy",
        title: "Collision policy",
        description: "Set the lowest collision severity worth calling out to a reviewer.",
        fields: [
          { id: "severity", label: "Minimum severity", type: "select", options: [
            { label: "Low and above", value: "low" },
            { label: "Medium and above", value: "medium" },
            { label: "High only", value: "high" },
          ] },
        ],
      },
    ],
  },
  {
    key: "deployment-ordering",
    slug: "deployment-ordering",
    navLabel: "Deployment Ordering",
    title: "Deployment Ordering",
    eyebrow: "05 / release sequence",
    description: "Set the guardrails for an intentional rollout order without simulating or executing a deployment.",
    icon: ArrowDownUp,
    defaultValues: { enabled: true, strategy: "dependency-first", pauseMinutes: 10, requireExplicitOrder: true, order: "" },
    groups: [
      {
        id: "sequence-policy",
        title: "Sequence policy",
        description: "Keep ordering rules human-readable while the orchestration contract is pending.",
        fields: [
          { id: "strategy", label: "Ordering strategy", type: "select", options: [
            { label: "Dependencies first", value: "dependency-first" },
            { label: "Risk lowest first", value: "risk-first" },
            { label: "Explicit service order", value: "explicit" },
          ] },
          { id: "requireExplicitOrder", label: "Require an explicit order", type: "toggle", help: "Prevent ambiguous sequences from appearing ready." },
          { id: "order", label: "Preferred order", type: "textarea", placeholder: "schema-migrations\npayments-api\ncheckout-web", help: "One deployable per line." },
        ],
      },
      {
        id: "pause-policy",
        title: "Pause policy",
        description: "Document the pause between stages for a future rollout planner.",
        fields: [
          { id: "pauseMinutes", label: "Stage pause", type: "number", min: 0, max: 240, help: "Minutes between sequential stages." },
        ],
      },
    ],
  },
  {
    key: "pr-context",
    slug: "pr-context",
    navLabel: "Production Context Missing from the PR",
    title: "Production Context Missing from the PR",
    eyebrow: "06 / reviewer context",
    description: "Decide which production details should be requested when a pull request does not carry enough context.",
    icon: FileQuestion,
    defaultValues: { enabled: true, provider: "github", requireRollback: true, requireTraffic: false, promptTemplate: "Describe the production behavior this change may alter." },
    groups: [
      {
        id: "missing-context",
        title: "Missing context rules",
        description: "Choose the production notes that should be requested from authors.",
        fields: [
          { id: "requireRollback", label: "Require rollback notes", type: "toggle" },
          { id: "requireTraffic", label: "Require traffic context", type: "toggle" },
          { id: "promptTemplate", label: "Reviewer prompt", type: "textarea", placeholder: "Add the production context a reviewer needs." },
        ],
      },
      {
        id: "pull-request-source",
        title: "Pull request source",
        description: "This selection is stored locally until a repository connector is available.",
        fields: [
          { id: "provider", label: "Pull request provider", type: "select", options: providerOptions },
        ],
      },
    ],
  },
  {
    key: "failure-prediction",
    slug: "failure-prediction",
    navLabel: "Deployment Failure Prediction",
    title: "Deployment Failure Prediction",
    eyebrow: "07 / leading indicators",
    description: "Set the operational history and confidence floor that a future failure prediction service should use.",
    icon: CircleGauge,
    defaultValues: { enabled: false, historyDays: 30, confidence: "review", includeIncidents: true, includeRollbacks: true },
    groups: [
      {
        id: "prediction-inputs",
        title: "Prediction inputs",
        description: "Select the leading indicators that should be considered later.",
        fields: [
          { id: "historyDays", label: "History window", type: "number", min: 7, max: 365, help: "Days of history available to a future model." },
          { id: "includeIncidents", label: "Include incident history", type: "toggle" },
          { id: "includeRollbacks", label: "Include rollback history", type: "toggle" },
        ],
      },
      {
        id: "confidence-policy",
        title: "Confidence policy",
        description: "Keep predictions advisory until a human review contract exists.",
        fields: [
          { id: "confidence", label: "Action threshold", type: "select", options: [
            { label: "Flag for review", value: "review" },
            { label: "Require approval", value: "approval" },
            { label: "Informational only", value: "info" },
          ] },
        ],
      },
    ],
  },
  {
    key: "workaround-expiration",
    slug: "workaround-expiration",
    navLabel: "Temporary Workaround & Technical-Debt Expiration",
    title: "Temporary Workaround & Technical-Debt Expiration",
    eyebrow: "08 / debt clock",
    description: "Make temporary release exceptions visible and give them an explicit expiration owner and window.",
    icon: TimerReset,
    defaultValues: { enabled: true, defaultDays: 30, requireOwner: true, warnDays: 7, tracker: "release-notes" },
    groups: [
      {
        id: "expiration-policy",
        title: "Expiration policy",
        description: "Set the default clock for temporary exceptions.",
        fields: [
          { id: "defaultDays", label: "Default expiration", type: "number", min: 1, max: 365, help: "Days before a workaround is considered expired." },
          { id: "warnDays", label: "Warning lead time", type: "number", min: 1, max: 90, help: "Days before expiration to notify the owner." },
          { id: "requireOwner", label: "Require an accountable owner", type: "toggle" },
        ],
      },
      {
        id: "tracking",
        title: "Tracking location",
        description: "Choose where a future integration should look for exception records.",
        fields: [
          { id: "tracker", label: "Tracking location", type: "select", options: [
            { label: "Release notes", value: "release-notes" },
            { label: "Issue tracker", value: "issue-tracker" },
            { label: "Repository metadata", value: "repository" },
          ] },
        ],
      },
    ],
  },
  {
    key: "readiness-permission",
    slug: "readiness-permission",
    navLabel: "Deployment Readiness vs Deployment Permission",
    title: "Deployment Readiness vs Deployment Permission",
    eyebrow: "09 / policy boundary",
    description: "Keep operational readiness distinct from the permission to deploy, with a clear local policy boundary.",
    icon: GitPullRequest,
    defaultValues: { enabled: true, readinessOwner: "service-owner", permissionOwner: "release-manager", blockOnMissing: true, notes: "" },
    groups: [
      {
        id: "ownership-boundary",
        title: "Ownership boundary",
        description: "Name the roles responsible for evidence and authorization separately.",
        fields: [
          { id: "readinessOwner", label: "Readiness owner", type: "select", options: [
            { label: "Service owner", value: "service-owner" },
            { label: "On-call engineer", value: "on-call" },
            { label: "Release captain", value: "release-captain" },
          ] },
          { id: "permissionOwner", label: "Permission owner", type: "select", options: [
            { label: "Release manager", value: "release-manager" },
            { label: "Change approver", value: "change-approver" },
            { label: "Service owner", value: "service-owner" },
          ] },
          { id: "blockOnMissing", label: "Block when evidence is missing", type: "toggle" },
        ],
      },
      {
        id: "boundary-notes",
        title: "Boundary notes",
        description: "Leave a short operational note for the team that will own this policy.",
        fields: [
          { id: "notes", label: "Policy note", type: "textarea", placeholder: "Readiness is evidence. Permission is authorization." },
        ],
      },
    ],
  },
];

export const deploymentModuleBySlug = Object.fromEntries(
  deploymentModules.map((module) => [module.slug, module]),
) as Record<string, DeploymentModule>;

export const deploymentModuleByKey = Object.fromEntries(
  deploymentModules.map((module) => [module.key, module]),
) as Record<string, DeploymentModule>;

export const agentScanContextModule: DeploymentModule = {
  key: "agent-scan-context",
  slug: "agent-scan-context",
  navLabel: "Agent Scan Context",
  title: "Agent Scan Context",
  eyebrow: "scan / context",
  description: "Keep optional release context beside an agent scan without changing how targets or agents execute.",
  icon: GitPullRequest,
  defaultValues: { enabled: false, releaseName: "", environment: "production", changeWindow: "standard" },
  groups: [
    {
      id: "scan-context",
      title: "Optional release context",
      description: "These values are stored locally and do not alter the existing scan behavior.",
      fields: [
        { id: "releaseName", label: "Release label", type: "text", placeholder: "e.g. checkout-2025.04" },
        { id: "environment", label: "Environment", type: "select", options: environmentOptions },
        { id: "changeWindow", label: "Change window", type: "select", options: [
          { label: "Standard change", value: "standard" },
          { label: "Elevated change", value: "elevated" },
          { label: "Emergency change", value: "emergency" },
        ] },
      ],
    },
  ],
};