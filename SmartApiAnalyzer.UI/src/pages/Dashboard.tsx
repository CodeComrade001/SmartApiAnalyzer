import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Activity, ArrowDownRight, ArrowUpRight, Zap, Coins, Globe, Server,
  TrendingUp, AlertCircle, CheckCircle2, Bot, Crosshair, ShieldAlert,
  ShieldCheck, Play, ChevronRight, Target, FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { mockKpis, mockTimeSeries } from "@/services/data/mockData";
import { useScan } from "@/context/ScanContext";
import { AGENTS, MOCK_RESULTS, categoryMeta, severityConfig } from "@/data/agentCatalog";
import type { FindingSeverity } from "@/data/agentCatalog";

/* ─── motion ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const accentColors: Record<string, string> = {
  violet:  "from-[hsl(var(--brand-violet))]/20 to-transparent border-[hsl(var(--brand-violet))]/30",
  cyan:    "from-[hsl(var(--brand-cyan))]/20 to-transparent border-[hsl(var(--brand-cyan))]/30",
  pink:    "from-[hsl(var(--brand-pink))]/20 to-transparent border-[hsl(var(--brand-pink))]/30",
  amber:   "from-[hsl(var(--brand-amber))]/20 to-transparent border-[hsl(var(--brand-amber))]/30",
  emerald: "from-[hsl(var(--brand-emerald))]/20 to-transparent border-[hsl(var(--brand-emerald))]/30",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  fontSize: "12px",
};

const COST_PIE_COLORS = [
  "hsl(var(--brand-violet))", "hsl(var(--brand-cyan))", "hsl(var(--brand-pink))",
  "hsl(var(--brand-amber))", "hsl(var(--brand-emerald))",
];
const costBreakdown = [
  { name: "Compute", value: 42 }, { name: "Database", value: 28 },
  { name: "Storage", value: 14 }, { name: "Egress", value: 10 }, { name: "Other", value: 6 },
];
const recentActivity = [
  { type: "success", title: "Deployment v2.18.4 succeeded",    desc: "All endpoints green",                time: "2m ago"  },
  { type: "scan",    title: "Security scan completed",          desc: "2 critical, 3 high — 14 agents",   time: "18m ago" },
  { type: "warning", title: "p95 latency spike on /checkout",  desc: "318ms (baseline 142ms)",             time: "34m ago" },
  { type: "info",    title: "New endpoint discovered",          desc: "POST /api/webhooks/stripe",          time: "1h ago"  },
  { type: "success", title: "Cost insight applied",             desc: "Saved $480/mo on /users/:id",       time: "3h ago"  },
  { type: "warning", title: "Error rate above threshold",       desc: "/api/payments/refund 2.3%",         time: "6h ago"  },
];

const activityIcon = (t: string) => {
  if (t === "success") return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--brand-emerald))]" />;
  if (t === "warning") return <AlertCircle  className="h-4 w-4 text-[hsl(var(--brand-amber))]" />;
  if (t === "scan")    return <ShieldCheck  className="h-4 w-4 text-[hsl(var(--brand-violet))]" />;
  return <TrendingUp className="h-4 w-4 text-[hsl(var(--brand-cyan))]" />;
};

function MetricCard({ title, value, trend, icon: Icon, description, isLoading, accent = "violet", invertTrend = false }: any) {
  const isImprovement = invertTrend ? trend > 0 : trend < 0;
  return (
    <motion.div variants={fadeUp}>
      <Card className={`glass-card relative overflow-hidden bg-gradient-to-br ${accentColors[accent]} border`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-foreground/70" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-24" /> : (
            <>
              <div className="text-2xl font-bold tracking-tight">{value}</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                {trend !== 0 && (
                  <>
                    {trend > 0
                      ? <ArrowUpRight className={`mr-1 h-3 w-3 ${isImprovement ? "text-[hsl(var(--brand-emerald))]" : "text-[hsl(var(--brand-pink))]"}`} />
                      : <ArrowDownRight className={`mr-1 h-3 w-3 ${isImprovement ? "text-[hsl(var(--brand-emerald))]" : "text-[hsl(var(--brand-pink))]"}`} />
                    }
                    <span className={isImprovement ? "text-[hsl(var(--brand-emerald))]" : "text-[hsl(var(--brand-pink))]"}>{Math.abs(trend)}%</span>
                  </>
                )}
                <span className={trend !== 0 ? "ml-1" : ""}>{description}</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { selectedAgents, scanTargets, setBriefOpen, notify } = useScan();

  const kpis = mockKpis;
  const timeSeries = mockTimeSeries;

  const lastScanCounts = MOCK_RESULTS.reduce<Record<FindingSeverity, number>>(
    (acc, r) => { acc[r.status]++; return acc; },
    { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, PASS: 0 }
  );
  const totalFindings = MOCK_RESULTS.length;
  const criticalOrHigh = lastScanCounts.CRITICAL + lastScanCounts.HIGH;
  const securityHealthScore = Math.max(0, Math.min(100, 100 - lastScanCounts.CRITICAL * 15 - lastScanCounts.HIGH * 8 - lastScanCounts.MEDIUM * 4 - lastScanCounts.LOW));

  const categoryBreakdown = (["validation", "security", "performance", "alerting"] as const).map((cat) => ({
    cat, meta: categoryMeta[cat],
    total: AGENTS.filter((a) => a.category === cat).length,
    selected: AGENTS.filter((a) => a.category === cat && selectedAgents.has(a.key)).length,
  }));

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Your APIs at a glance — last 30 days, production environment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[hsl(var(--brand-emerald))]" />Live
          </Badge>
          <Badge variant="outline" className="glass">Last sync: just now</Badge>
        </div>
      </motion.div>

      {/* ── KPI strip ── */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total Requests"   value={kpis?.totalRequests.toLocaleString() || "—"} trend={kpis?.totalRequestsTrend ?? 0}  description="vs last month" icon={Globe}     accent="violet"  invertTrend />
        <MetricCard title="Avg Latency"      value={`${kpis?.avgLatency || 0}ms`}                trend={kpis?.avgLatencyTrend ?? 0}      description="vs last month" icon={Activity}  accent="cyan"   />
        <MetricCard title="Error Rate"       value={`${kpis?.errorRate || 0}%`}                  trend={kpis?.errorRateTrend ?? 0}       description="vs last month" icon={Zap}       accent="pink"   />
        <MetricCard title="Cost Score"       value={`${kpis?.costScore || 0}/100`}               trend={kpis?.costScoreTrend ?? 0}       description="vs last month" icon={Coins}     accent="amber"   invertTrend />
        <MetricCard title="Active Endpoints" value={kpis?.activeEndpoints || 0}                  trend={0}                               description="stable"        icon={Server}    accent="emerald" />
      </motion.div>

      {/* ── Agent Scan cards ── */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-3">

        {/* Mission Brief */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card relative h-full overflow-hidden border border-[hsl(var(--brand-violet))]/20 bg-gradient-to-br from-[hsl(var(--brand-violet))]/10 to-transparent">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[hsl(var(--brand-violet))]/10 blur-3xl" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[hsl(var(--brand-violet))]/30 bg-[hsl(var(--brand-violet))]/10">
                  <Crosshair className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
                </div>
                <div>
                  <CardTitle className="text-sm">Mission Brief</CardTitle>
                  <CardDescription className="text-[11px]">Current agent loadout</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                {categoryBreakdown.map(({ cat, meta, total, selected }) => {
                  const Icon = meta.icon;
                  const pct = total > 0 ? (selected / total) * 100 : 0;
                  const barColor = cat === "validation" ? "hsl(var(--brand-cyan))" : cat === "security" ? "hsl(var(--brand-pink))" : cat === "performance" ? "hsl(var(--brand-amber))" : "hsl(var(--brand-violet))";
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${meta.bg}`}><Icon className={`h-3 w-3 ${meta.color}`} /></div>
                      <div className="flex-1">
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
                          <span className="text-[10px] tabular-nums text-muted-foreground">{selected}/{total}</span>
                        </div>
                        <div className={`h-1 w-full overflow-hidden rounded-full ${meta.bg}`}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-[hsl(var(--brand-cyan))]" />
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{scanTargets.length}</span> target{scanTargets.length !== 1 ? "s" : ""} set
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setBriefOpen(true)}
                  className="h-7 gap-1.5 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 text-xs">
                  <Crosshair className="h-3 w-3" /> Open Brief
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Health */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card relative h-full overflow-hidden border border-[hsl(var(--brand-pink))]/20 bg-gradient-to-br from-[hsl(var(--brand-pink))]/10 to-transparent">
            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[hsl(var(--brand-pink))]/10 blur-3xl" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[hsl(var(--brand-pink))]/30 bg-[hsl(var(--brand-pink))]/10">
                  {criticalOrHigh > 0
                    ? <ShieldAlert className="h-4 w-4 text-[hsl(var(--brand-pink))]" />
                    : <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand-emerald))]" />}
                </div>
                <div>
                  <CardTitle className="text-sm">Security Health</CardTitle>
                  <CardDescription className="text-[11px]">Last scan · 14 agents · 3 targets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tight">{securityHealthScore}</span>
                <span className="mb-1 text-sm text-muted-foreground">/ 100</span>
                <Badge variant="outline" className={`ml-auto text-[10px] ${criticalOrHigh > 0 ? "border-pink-500/40 text-pink-400" : "border-emerald-500/40 text-emerald-400"}`}>
                  {criticalOrHigh > 0 ? "Action required" : "Healthy"}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as FindingSeverity[]).map((s) => {
                  const cfg = severityConfig[s];
                  return (
                    <div key={s} className={`rounded-lg border px-2 py-1.5 text-center bg-gradient-to-b ${cfg.bg}`}>
                      <p className={`text-base font-bold ${cfg.color}`}>{lastScanCounts[s]}</p>
                      <p className={`text-[9px] font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
              <Link href="/dashboard/insights">
                <Button size="sm" variant="outline"
                  className="h-7 w-full gap-1.5 border-pink-500/40 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 text-xs">
                  <FileText className="h-3 w-3" /> View Scan Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick launch */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card relative h-full overflow-hidden border border-[hsl(var(--brand-cyan))]/20 bg-gradient-to-br from-[hsl(var(--brand-cyan))]/10 to-transparent">
            <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-[hsl(var(--brand-cyan))]/10 blur-3xl" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[hsl(var(--brand-cyan))]/30 bg-[hsl(var(--brand-cyan))]/10">
                  <Bot className="h-4 w-4 text-[hsl(var(--brand-cyan))]" />
                </div>
                <div>
                  <CardTitle className="text-sm">Agent Scan</CardTitle>
                  <CardDescription className="text-[11px]">14 agents ready to deploy</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Run security, performance, and validation checks against specific API endpoints. Results feed directly into your security health score.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(["validation", "security", "performance", "alerting"] as const).map((cat) => {
                  const meta = categoryMeta[cat];
                  const count = AGENTS.filter((a) => a.category === cat).length;
                  const Icon = meta.icon;
                  return (
                    <span key={cat} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}>
                      <Icon className="h-2.5 w-2.5" />{count} {meta.label}
                    </span>
                  );
                })}
              </div>
              <Button
                className="mt-auto w-full gap-2 text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" }}
                onClick={() => {
                  notify({ type: "info", title: "Opening Agent Scan", message: "Select your targets and agents, then click Launch to begin. Results will appear in Insights." });
                  navigate("/dashboard/agents");
                }}
              >
                <Play className="h-3.5 w-3.5" /> Launch Agent Scan
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Charts ── */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle>Latency &amp; Requests</CardTitle>
              <CardDescription>Average latency over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--brand-violet))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--brand-violet))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--brand-cyan))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--brand-cyan))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <Area type="monotone" dataKey="latency"  stroke="hsl(var(--brand-violet))" strokeWidth={2} fill="url(#colorLatency)" />
                  <Area type="monotone" dataKey="requests" stroke="hsl(var(--brand-cyan))"   strokeWidth={2} fill="url(#colorReq)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle>Daily Spend</CardTitle>
              <CardDescription>Estimated compute cost per day.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="costBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--brand-pink))"  stopOpacity={1} />
                      <stop offset="95%" stopColor="hsl(var(--brand-amber))" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <Bar dataKey="cost" fill="url(#costBar)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Bottom row ── */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="glass-card h-full">
            <CardHeader><CardTitle>Cost Breakdown</CardTitle><CardDescription>By resource category.</CardDescription></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {costBreakdown.map((_, i) => <Cell key={i} fill={COST_PIE_COLORS[i]} stroke="hsl(var(--card))" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card className="glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Deployments, scans, and insights.</CardDescription>
              </div>
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                  All activity <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-3 transition hover:bg-muted/40">
                    <div className="mt-0.5">{activityIcon(a.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{a.title}</span>
                        {a.type === "scan" && <Badge variant="outline" className="text-[9px] border-violet-500/40 text-violet-400">Scan</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
