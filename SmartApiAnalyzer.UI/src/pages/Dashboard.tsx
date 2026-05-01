import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
  Coins,
  Globe,
  Server,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { mockKpis, mockTimeSeries } from "@/services/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const accentColors: Record<string, string> = {
  violet: "from-[hsl(var(--brand-violet))]/20 to-transparent border-[hsl(var(--brand-violet))]/30",
  cyan: "from-[hsl(var(--brand-cyan))]/20 to-transparent border-[hsl(var(--brand-cyan))]/30",
  pink: "from-[hsl(var(--brand-pink))]/20 to-transparent border-[hsl(var(--brand-pink))]/30",
  amber: "from-[hsl(var(--brand-amber))]/20 to-transparent border-[hsl(var(--brand-amber))]/30",
  emerald: "from-[hsl(var(--brand-emerald))]/20 to-transparent border-[hsl(var(--brand-emerald))]/30",
};

const kpis = mockKpis;
const timeSeries = mockTimeSeries;

const kpisLoading = false;
const timeSeriesLoading = false;

function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  description,
  isLoading,
  accent = "violet",
  invertTrend = false,
}: any) {
  const isImprovement = invertTrend ? trend > 0 : trend < 0;
  return (
    <motion.div variants={fadeUp}>
      <Card className={`glass-card relative overflow-hidden bg-gradient-to-br ${accentColors[accent]} border`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-foreground/70" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold tracking-tight">{value}</div>
              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                {trend !== 0 && (
                  <>
                    {trend > 0 ? (
                      <ArrowUpRight
                        className={`mr-1 h-3 w-3 ${isImprovement ? "text-[hsl(var(--brand-emerald))]" : "text-[hsl(var(--brand-pink))]"
                          }`}
                      />
                    ) : (
                      <ArrowDownRight
                        className={`mr-1 h-3 w-3 ${isImprovement ? "text-[hsl(var(--brand-emerald))]" : "text-[hsl(var(--brand-pink))]"
                          }`}
                      />
                    )}
                    <span
                      className={
                        isImprovement
                          ? "text-[hsl(var(--brand-emerald))]"
                          : "text-[hsl(var(--brand-pink))]"
                      }
                    >
                      {Math.abs(trend)}%
                    </span>
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

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  fontSize: "12px",
};

const COST_PIE_COLORS = [
  "hsl(var(--brand-violet))",
  "hsl(var(--brand-cyan))",
  "hsl(var(--brand-pink))",
  "hsl(var(--brand-amber))",
  "hsl(var(--brand-emerald))",
];

const costBreakdown = [
  { name: "Compute", value: 42 },
  { name: "Database", value: 28 },
  { name: "Storage", value: 14 },
  { name: "Egress", value: 10 },
  { name: "Other", value: 6 },
];

const recentActivity = [
  { type: "success", title: "Deployment v2.18.4 succeeded", desc: "All endpoints green", time: "2m ago" },
  { type: "warning", title: "p95 latency spike on /checkout", desc: "318ms (baseline 142ms)", time: "12m ago" },
  { type: "info", title: "New endpoint discovered", desc: "POST /api/webhooks/stripe", time: "1h ago" },
  { type: "success", title: "Cost insight applied", desc: "Saved $480/mo on /users/:id", time: "3h ago" },
  { type: "warning", title: "Error rate above threshold", desc: "/api/payments/refund 2.3%", time: "6h ago" },
];

const activityIcon = (t: string) => {
  if (t === "success") return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--brand-emerald))]" />;
  if (t === "warning") return <AlertCircle className="h-4 w-4 text-[hsl(var(--brand-amber))]" />;
  return <TrendingUp className="h-4 w-4 text-[hsl(var(--brand-cyan))]" />;
};

export default function Dashboard() {

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Your APIs at a glance — last 30 days, production environment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[hsl(var(--brand-emerald))]" />
            Live
          </Badge>
          <Badge variant="outline" className="glass">Last sync: just now</Badge>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <MetricCard
          title="Total Requests"
          value={kpis?.totalRequests.toLocaleString() || "—"}
          trend={kpis?.totalRequestsTrend ?? 0}
          description="vs last month"
          icon={Globe}
          isLoading={kpisLoading}
          accent="violet"
          invertTrend
        />
        <MetricCard
          title="Avg Latency"
          value={`${kpis?.avgLatency || 0}ms`}
          trend={kpis?.avgLatencyTrend ?? 0}
          description="vs last month"
          icon={Activity}
          isLoading={kpisLoading}
          accent="cyan"
        />
        <MetricCard
          title="Error Rate"
          value={`${kpis?.errorRate || 0}%`}
          trend={kpis?.errorRateTrend ?? 0}
          description="vs last month"
          icon={Zap}
          isLoading={kpisLoading}
          accent="pink"
        />
        <MetricCard
          title="Cost Score"
          value={`${kpis?.costScore || 0}/100`}
          trend={kpis?.costScoreTrend ?? 0}
          description="vs last month"
          icon={Coins}
          isLoading={kpisLoading}
          accent="amber"
          invertTrend
        />
        <MetricCard
          title="Active Endpoints"
          value={kpis?.activeEndpoints || 0}
          trend={0}
          description="stable"
          icon={Server}
          isLoading={kpisLoading}
          accent="emerald"
        />
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle>Latency &amp; Requests</CardTitle>
              <CardDescription>Average latency over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {timeSeriesLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-violet))" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="hsl(var(--brand-violet))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-cyan))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--brand-cyan))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(val) =>
                        new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}ms`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="hsl(var(--brand-violet))"
                      strokeWidth={2}
                      fill="url(#colorLatency)"
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="hsl(var(--brand-cyan))"
                      strokeWidth={2}
                      fill="url(#colorReq)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle>Daily Spend</CardTitle>
              <CardDescription>Estimated compute cost per day.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {timeSeriesLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-pink))" stopOpacity={1} />
                        <stop offset="95%" stopColor="hsl(var(--brand-amber))" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(val) =>
                        new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                    />
                    <Bar dataKey="cost" fill="url(#costBar)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>By resource category.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costBreakdown.map((_, i) => (
                      <Cell key={i} fill={COST_PIE_COLORS[i]} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="lg:col-span-4">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Deployments, alerts, and insights.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recentActivity.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-3 transition hover:bg-muted/40"
                  >
                    <div className="mt-0.5">{activityIcon(a.type)}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{a.time}</span>
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
