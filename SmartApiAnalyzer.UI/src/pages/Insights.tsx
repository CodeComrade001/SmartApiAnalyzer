import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Sparkles, Cpu, Database, Layers, Zap, ArrowUpRight, Lightbulb,
  Clock, TrendingDown, AlertTriangle, Shield, ShieldCheck,
  ShieldAlert, ChevronDown, CheckCircle2, AlertCircle, Info,
  Play, Target, Calendar, Timer, Bot, ExternalLink,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { mockApi } from "@/services/mockApi";
import { useScan } from "@/context/ScanContext";
import { mockScanPayload, mockInsightFindings } from "@/services/data/mockData";
import { categoryMeta, severityConfig } from "@/data/agentCatalog";
import type { FindingSeverity, AgentCategory } from "@/data/agentCatalog";

/* ─── motion ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

/* ─── existing insights config ─── */
const insightConfig: Record<string, { icon: any; title: string; tint: string }> = {
  slow: { icon: Clock, title: "Slow endpoints", tint: "from-[hsl(var(--brand-cyan))]/20 to-transparent text-[hsl(var(--brand-cyan))]" },
  degrading: { icon: TrendingDown, title: "Degrading performance", tint: "from-[hsl(var(--brand-pink))]/20 to-transparent text-[hsl(var(--brand-pink))]" },
  costly: { icon: AlertTriangle, title: "High-cost endpoints", tint: "from-[hsl(var(--brand-amber))]/20 to-transparent text-[hsl(var(--brand-amber))]" },
};

const aiRecommendations = [
  { type: "Cache", icon: Database, title: "Add edge cache to GET /api/users/:id", desc: "78% of calls return identical payloads within 5-minute windows. Cache TTL of 300s would reduce origin load by ~62%.", impact: "$2,340/mo", effort: "Low", tint: "violet" },
  { type: "Batch", icon: Layers, title: "Batch event ingestion at /api/events", desc: "1.2M individual writes per day. Switching to bulk inserts of 100 would cut DB CPU by 41%.", impact: "$1,820/mo", effort: "Medium", tint: "cyan" },
  { type: "Index", icon: Cpu, title: "Add composite index on orders(user_id, created_at)", desc: "GET /api/orders/search scans 4.2M rows. Index would bring p95 from 840ms → 90ms.", impact: "$960/mo", effort: "Low", tint: "pink" },
  { type: "Deprecate", icon: Zap, title: "Sunset GET /api/v1/legacy/feed", desc: "Only 0.4% of clients still call this. Remove after 30-day notice for instant savings.", impact: "$640/mo", effort: "Low", tint: "amber" },
];

const tintMap: Record<string, string> = {
  violet: "bg-[hsl(var(--brand-violet))]/15 text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet))]/30",
  cyan: "bg-[hsl(var(--brand-cyan))]/15 text-[hsl(var(--brand-cyan))] border-[hsl(var(--brand-cyan))]/30",
  pink: "bg-[hsl(var(--brand-pink))]/15 text-[hsl(var(--brand-pink))] border-[hsl(var(--brand-pink))]/30",
  amber: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30",
};

const effortColor: Record<string, string> = {
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  High: "bg-pink-500/10 text-pink-400 border-pink-500/30",
};

const logLevelColor: Record<string, string> = {
  info: "text-slate-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-pink-400",
};
const logLevelPrefix: Record<string, string> = { info: "·", success: "✓", warning: "!", error: "✗" };

/* ─── SecurityScore chip ─── */
function ScoreChip({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-pink-400";
  return (
    <div className="flex items-end gap-1.5">
      <span className={`text-5xl font-bold tabular-nums leading-none ${color}`}>{score}</span>
      <span className="mb-1 text-lg text-muted-foreground">/100</span>
    </div>
  );
}

/* ─── page ─── */
export default function Insights() {
  const { lastScanResults, lastScanMeta } = useScan();
  type InsightCategory = { id: string; type: string; metric: string; trend: string; recommendation: string };
  const insights: InsightCategory[] = mockApi.getInsights();
  const isLoading = false

  /* derive data source: real scan or demo */
  const hasScan = lastScanResults.length > 0;
  const scanResults = hasScan
    ? lastScanResults
    : mockScanPayload.agentResults.map((r) => ({
      agentKey: r.agentKey, agentLabel: r.agentLabel,
      category: r.category as AgentCategory,
      status: r.status as FindingSeverity,
      findings: r.findings, detail: r.detail,
    }));
  const scanMeta = hasScan
    ? lastScanMeta
    : { targets: mockScanPayload.targets, completedAt: mockScanPayload.completedAt, totalAgents: mockScanPayload.agentResults.length, duration: mockScanPayload.totalDuration };

  /* severity counts */
  const counts: Record<FindingSeverity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, PASS: 0 };
  scanResults.forEach((r) => counts[r.status]++);

  /* security score */
  const secScore = Math.max(0, Math.min(100,
    100 - counts.CRITICAL * 15 - counts.HIGH * 8 - counts.MEDIUM * 4 - counts.LOW * 1
  ));

  /* findings */
  const findings = hasScan
    ? mockInsightFindings.filter((f) => scanResults.some((r) => r.agentKey === f.agentKey && r.status !== "PASS"))
    : mockInsightFindings;

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(hasScan ? "scan" : "scan");

  const filteredFindings = severityFilter === "all"
    ? findings
    : findings.filter((f) => f.severity === severityFilter);

  const filterCounts: Record<string, number> = {
    all: findings.length,
    CRITICAL: findings.filter((f) => f.severity === "CRITICAL").length,
    HIGH: findings.filter((f) => f.severity === "HIGH").length,
    MEDIUM: findings.filter((f) => f.severity === "MEDIUM").length,
    LOW: findings.filter((f) => f.severity === "LOW").length,
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}
        className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground">Security findings, performance analysis, and actionable recommendations.</p>
        </div>
        <div className="flex items-center gap-2">
          {!hasScan && (
            <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-400 text-[10px]">Demo data</Badge>
          )}
          {hasScan && (
            <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-400 text-[10px]">
              <CheckCircle2 className="h-3 w-3" /> Live scan results
            </Badge>
          )}
          <Link href="/dashboard/agents">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Play className="h-3.5 w-3.5" /> Run New Scan
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 h-10 rounded-xl border border-border/50 bg-muted/30 p-1">
          <TabsTrigger value="scan" className="gap-2 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow">
            <Shield className="h-3.5 w-3.5" />
            Scan Report
            {counts.CRITICAL + counts.HIGH > 0 && (
              <Badge className="ml-1 h-4 rounded-full bg-pink-500/20 px-1.5 text-[9px] font-bold text-pink-400">
                {counts.CRITICAL + counts.HIGH}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow">
            <Lightbulb className="h-3.5 w-3.5" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* ════ SCAN REPORT TAB ════ */}
        <TabsContent value="scan" className="space-y-6">

          {/* scan metadata bar */}
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Card className="glass-strong relative overflow-hidden rounded-2xl border">
              <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[hsl(var(--brand-violet))]/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[hsl(var(--brand-cyan))]/20 blur-3xl" />
              <CardContent className="relative grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-5">

                {/* score */}
                <div className="flex flex-col gap-1 lg:col-span-1">
                  <p className="text-xs font-medium text-muted-foreground">Security score</p>
                  <ScoreChip score={secScore} />
                  <p className="text-[11px] text-muted-foreground">
                    {secScore >= 80 ? "Excellent" : secScore >= 60 ? "Needs attention" : "Critical issues found"}
                  </p>
                </div>

                {/* severity counts */}
                <div className="grid grid-cols-4 gap-2 lg:col-span-2">
                  {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as FindingSeverity[]).map((s) => {
                    const cfg = severityConfig[s];
                    return (
                      <div key={s} className={`rounded-xl border p-2.5 text-center bg-gradient-to-b ${cfg.bg}`}>
                        <p className={`text-xl font-bold ${cfg.color}`}>{counts[s]}</p>
                        <p className={`text-[9px] font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* scan metadata */}
                <div className="space-y-2 lg:col-span-2">
                  {scanMeta && (
                    <>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(scanMeta.completedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Bot className="h-3.5 w-3.5 shrink-0" />
                        <span>{scanMeta.totalAgents} agents</span>
                        <span className="text-border">·</span>
                        <Timer className="h-3.5 w-3.5 shrink-0" />
                        <span>{(scanMeta.duration / 1000).toFixed(1)}s</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <div className="space-y-0.5">
                          {scanMeta.targets.map((t) => (
                            <div key={t} className="truncate font-mono text-[10px]">{t}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* agent results strip */}
          <motion.div initial="hidden" animate="show" variants={stagger}
            className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {scanResults.map((r) => {
              const cfg = severityConfig[r.status];
              const catMeta = categoryMeta[r.category];
              const CfgIcon = cfg.icon;
              return (
                <motion.div key={r.agentKey} variants={fadeUp}>
                  <div className={`flex items-center gap-2 rounded-xl border p-2.5 bg-gradient-to-br ${cfg.bg}`}>
                    <CfgIcon className={`h-3.5 w-3.5 shrink-0 ${cfg.color}`} />
                    <div className="min-w-0">
                      <p className={`truncate text-[10px] font-semibold ${cfg.color}`}>{r.agentLabel}</p>
                      <p className={`text-[9px] font-bold uppercase ${catMeta.color}`}>{catMeta.label}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* findings header + filter */}
          {findings.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-pink-400" />
                <h2 className="text-base font-semibold">Findings</h2>
                <Badge variant="outline" className="text-[10px]">{findings.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
                  <button key={f}
                    onClick={() => setSeverityFilter(f)}
                    className={`rounded-lg border px-3 py-1 text-[11px] font-medium transition ${severityFilter === f
                      ? f === "all" ? "border-violet-500/40 bg-violet-500/15 text-violet-400"
                        : f === "CRITICAL" ? "border-pink-500/40 bg-pink-500/15 text-pink-400"
                          : f === "HIGH" ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                            : f === "MEDIUM" ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-400"
                              : "border-border/60 bg-muted/20 text-muted-foreground"
                      : "border-border/40 bg-muted/10 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                  >
                    {f === "all" ? "All" : f} {filterCounts[f] > 0 && <span className="ml-1 opacity-70">({filterCounts[f]})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* findings list */}
          <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-3">
            {filteredFindings.length === 0 && (
              <Card className="glass-card rounded-2xl">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <ShieldCheck className="h-10 w-10 text-emerald-400" />
                  <p className="font-semibold text-emerald-400">No findings for this filter</p>
                  <p className="text-sm text-muted-foreground">All checked agents passed for the selected severity level.</p>
                </CardContent>
              </Card>
            )}

            {filteredFindings.map((finding) => {
              const isExpanded = expandedId === finding.id;
              const cfg = severityConfig[finding.severity];
              const catMeta = categoryMeta[finding.category];
              const CfgIcon = cfg.icon;
              const agentLogs = mockScanPayload.agentResults.find((r) => r.agentKey === finding.agentKey)?.logs ?? [];

              return (
                <motion.div key={finding.id} variants={fadeUp}>
                  <Card className={`glass-card overflow-hidden rounded-2xl border transition-all ${isExpanded ? "border-border/60" : "border-border/30 hover:border-border/50"}`}>
                    {/* card header — always visible */}
                    <button
                      className="flex w-full items-start gap-4 p-5 text-left"
                      onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                    >
                      {/* severity icon */}
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${cfg.bg}`}>
                        <CfgIcon className={`h-4 w-4 ${cfg.color}`} />
                      </div>

                      {/* main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className={`text-[10px] font-semibold ${catMeta.color}`}>{catMeta.label}</span>
                          <span className="text-[10px] text-muted-foreground">{finding.agentLabel}</span>
                        </div>
                        <p className="mt-1.5 font-semibold leading-snug">{finding.title}</p>
                        {!isExpanded && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{finding.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {finding.affectedTargets.map((t) => (
                            <span key={t} className="flex items-center gap-1 rounded bg-muted/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              <Target className="h-2.5 w-2.5" />{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* right meta */}
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${effortColor[finding.effort]}`}>
                          {finding.effort} effort
                        </span>
                        {finding.savingsPerMonth && (
                          <span className="text-[10px] font-semibold text-emerald-400">{finding.savingsPerMonth}</span>
                        )}
                        {finding.cveRef && (
                          <span className="text-[10px] text-muted-foreground">{finding.cveRef}</span>
                        )}
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {/* expandable detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 border-t border-border/40 px-5 py-4">
                            {/* description */}
                            <div>
                              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What was found</p>
                              <p className="text-sm leading-relaxed text-muted-foreground">{finding.description}</p>
                            </div>

                            {/* recommendation */}
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Recommendation
                              </p>
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{finding.recommendation}</p>
                            </div>

                            {/* agent logs */}
                            {agentLogs.length > 0 && (
                              <div>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Agent output</p>
                                <div className="rounded-xl border border-slate-700/60 bg-[#0d1117] p-3 font-mono text-[11px]">
                                  {agentLogs.map((log, i) => (
                                    <div key={i} className={`flex items-start gap-2 py-0.5 ${logLevelColor[log.level]}`}>
                                      <span className="shrink-0 select-none opacity-60">{logLevelPrefix[log.level]}</span>
                                      <span>{log.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* empty state when no findings */}
          {findings.length === 0 && (
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <Card className="glass-card rounded-2xl border-emerald-500/20">
                <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-400">All checks passed</p>
                    <p className="mt-1 text-sm text-muted-foreground">No security or performance findings for the scanned endpoints.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* ════ RECOMMENDATIONS TAB ════ */}
        <TabsContent value="recommendations" className="space-y-8">

          {/* hero card */}
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Card className="glass-strong relative overflow-hidden rounded-2xl">
              <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[hsl(var(--brand-violet))]/30 blur-3xl" />
              <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[hsl(var(--brand-cyan))]/30 blur-3xl" />
              <CardContent className="relative grid gap-6 p-8 md:grid-cols-4">
                <div className="md:col-span-1">
                  <Sparkles className="mb-2 h-5 w-5 text-[hsl(var(--brand-violet))]" />
                  <p className="text-sm font-medium text-muted-foreground">Projected savings</p>
                  <p className="mt-1 text-4xl font-bold gradient-text">$5,760</p>
                  <p className="text-xs text-muted-foreground">/month if all applied</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open recommendations</p>
                  <p className="mt-1 text-4xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">+3 since last week</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applied this month</p>
                  <p className="mt-1 text-4xl font-bold">7</p>
                  <p className="text-xs text-[hsl(var(--brand-emerald))]">Saved $4,210</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg latency improved</p>
                  <p className="mt-1 text-4xl font-bold">-18%</p>
                  <p className="text-xs text-muted-foreground">across 14 endpoints</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI recommendations */}
          <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-4">
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[hsl(var(--brand-amber))]" />
              <h2 className="text-xl font-semibold">AI recommendations</h2>
              <Badge variant="outline" className="ml-2 text-[10px]">Powered by Pulse AI</Badge>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2">
              {aiRecommendations.map((rec) => (
                <motion.div key={rec.title} variants={fadeUp}>
                  <Card className="glass-card group h-full transition hover:-translate-y-0.5 hover:shadow-xl">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tintMap[rec.tint]}`}>
                            <rec.icon className="h-4 w-4" />
                          </div>
                          <Badge variant="outline" className={`${tintMap[rec.tint]} border`}>{rec.type}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Saves</div>
                          <div className="text-lg font-bold gradient-text-warm">{rec.impact}</div>
                        </div>
                      </div>
                      <h3 className="mt-4 font-semibold leading-snug">{rec.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{rec.desc}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                        <span className="text-xs text-muted-foreground">
                          Effort: <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${effortColor[rec.effort]}`}>{rec.effort}</span>
                        </span>
                        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                          View details <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* by category */}
          <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-4">
            <motion.h2 variants={fadeUp} className="text-xl font-semibold">By category</motion.h2>
            <div className="grid gap-4 md:grid-cols-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="glass-card">
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                  </Card>
                ))
                : insights?.map((insight) => {
                  const cfg = insightConfig[insight.type] ?? insightConfig.slow;
                  return (
                    <motion.div key={insight.id} variants={fadeUp}>
                      <Card className={`glass-card relative h-full overflow-hidden bg-gradient-to-br ${cfg.tint}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-background/50 p-2"><cfg.icon className="h-4 w-4" /></div>
                            <CardTitle className="text-base">{cfg.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 pt-2">
                          <div>
                            <p className="text-sm font-medium">{insight.metric}</p>
                            <p className="text-xs text-muted-foreground">{insight.trend}</p>
                          </div>
                          <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-sm">{insight.recommendation}</div>
                          <Button variant="outline" size="sm" className="w-full">Investigate</Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>

          {/* readiness checklist */}
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Production readiness checklist</CardTitle>
                <CardDescription>Best practices audited across your endpoints.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { ok: true, label: "Rate limiting on all public endpoints" },
                    { ok: true, label: "Structured logging enabled" },
                    { ok: false, label: "Add request ID propagation to /api/v2/*" },
                    { ok: true, label: "PII redaction configured" },
                    { ok: false, label: "5 endpoints missing OpenAPI documentation" },
                    { ok: true, label: "Dependency tracing across 18 services" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${item.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {item.ok ? "✓" : "!"}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
