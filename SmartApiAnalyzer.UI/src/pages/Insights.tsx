import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  Sparkles,
  Cpu,
  Database,
  Layers,
  Zap,
  ArrowUpRight,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { mockInsights } from "@/services/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const insightConfig: Record<string, { icon: any; title: string; tint: string }> = {
  slow: {
    icon: Clock,
    title: "Slow endpoints",
    tint: "from-[hsl(var(--brand-cyan))]/20 to-transparent text-[hsl(var(--brand-cyan))]",
  },
  degrading: {
    icon: TrendingDown,
    title: "Degrading performance",
    tint: "from-[hsl(var(--brand-pink))]/20 to-transparent text-[hsl(var(--brand-pink))]",
  },
  costly: {
    icon: AlertTriangle,
    title: "High-cost endpoints",
    tint: "from-[hsl(var(--brand-amber))]/20 to-transparent text-[hsl(var(--brand-amber))]",
  },
};

const aiRecommendations = [
  {
    type: "Cache",
    icon: Database,
    title: "Add edge cache to GET /api/users/:id",
    desc: "78% of calls return identical payloads within 5-minute windows. Cache TTL of 300s would reduce origin load by ~62%.",
    impact: "$2,340/mo",
    effort: "Low",
    tint: "violet",
  },
  {
    type: "Batch",
    icon: Layers,
    title: "Batch event ingestion at /api/events",
    desc: "1.2M individual writes per day. Switching to bulk inserts of 100 would cut DB CPU by 41%.",
    impact: "$1,820/mo",
    effort: "Medium",
    tint: "cyan",
  },
  {
    type: "Index",
    icon: Cpu,
    title: "Add composite index on orders(user_id, created_at)",
    desc: "GET /api/orders/search currently scans 4.2M rows. Index would bring p95 from 840ms → 90ms.",
    impact: "$960/mo",
    effort: "Low",
    tint: "pink",
  },
  {
    type: "Deprecate",
    icon: Zap,
    title: "Sunset GET /api/v1/legacy/feed",
    desc: "Only 0.4% of clients still call this. Remove it after 30-day notice for instant cost savings.",
    impact: "$640/mo",
    effort: "Low",
    tint: "amber",
  },
];

const tintMap: Record<string, string> = {
  violet: "bg-[hsl(var(--brand-violet))]/15 text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet))]/30",
  cyan: "bg-[hsl(var(--brand-cyan))]/15 text-[hsl(var(--brand-cyan))] border-[hsl(var(--brand-cyan))]/30",
  pink: "bg-[hsl(var(--brand-pink))]/15 text-[hsl(var(--brand-pink))] border-[hsl(var(--brand-pink))]/30",
  amber: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30",
};

export default function Insights() {
  //mock data testing - replace with real data fetching logic 
  const insights = mockInsights;
  const isLoading = false;

  return (
    <div className="flex flex-col gap-8">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">
          Actionable recommendations from our cost &amp; performance engine.
        </p>
      </motion.div>

      {/* Hero summary */}
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

      {/* AI Recommendations */}
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
                      <Badge variant="outline" className={`${tintMap[rec.tint]} border`}>
                        {rec.type}
                      </Badge>
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
                      Effort: <span className="font-medium text-foreground">{rec.effort}</span>
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      View details
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Categorized insights */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-4">
        <motion.h2 variants={fadeUp} className="text-xl font-semibold">By category</motion.h2>
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="glass-card">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
            : insights?.map((insight) => {
              const cfg = insightConfig[insight.type] ?? insightConfig.slow;
              return (
                <motion.div key={insight.id} variants={fadeUp}>
                  <Card className={`glass-card relative h-full overflow-hidden bg-gradient-to-br ${cfg.tint}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-background/50 p-2">
                          <cfg.icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base">{cfg.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 pt-2">
                      <div>
                        <p className="text-sm font-medium">{insight.metric}</p>
                        <p className="text-xs text-muted-foreground">{insight.trend}</p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-sm">
                        {insight.recommendation}
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Investigate
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </div>
      </motion.div>

      {/* Health checklist */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Production readiness checklist</CardTitle>
            <CardDescription>Best practices we've audited across your endpoints.</CardDescription>
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
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${item.ok
                        ? "bg-[hsl(var(--brand-emerald))]/20 text-[hsl(var(--brand-emerald))]"
                        : "bg-[hsl(var(--brand-amber))]/20 text-[hsl(var(--brand-amber))]"
                      }`}
                  >
                    {item.ok ? "✓" : "!"}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
