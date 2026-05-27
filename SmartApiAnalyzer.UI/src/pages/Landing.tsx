import { motion } from "framer-motion";
import HeroBackground from "@/components/HeroBackground";
import {
  ArrowRight,
  Activity,
  Zap,
  ShieldCheck,
  TrendingDown,
  GitBranch,
  Globe2,
  AlertTriangle,
  Sparkles,
  Check,
  Star,
  BarChart3,
  Clock,
  Cpu,
  Lock,
  Layers,
  Workflow,
  Server,
  Code2,
  ChevronRight,
  Plug,
  Terminal,
  Shield,
  FileCode2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const features = [
  {
    icon: Activity,
    title: "Live latency telemetry",
    desc: "Stream p50/p95/p99 latency, request volume, and error rates per endpoint with second-level granularity.",
    color: "violet" as const,
  },
  {
    icon: TrendingDown,
    title: "Cost intelligence",
    desc: "Pinpoint the routes that quietly burn 60% of your cloud bill and watch projected spend shrink.",
    color: "cyan" as const,
  },
  {
    icon: AlertTriangle,
    title: "Anomaly detection",
    desc: "ML-driven baselines catch latency spikes and error storms before your customers notice.",
    color: "pink" as const,
  },
  {
    icon: GitBranch,
    title: "Deploy correlation",
    desc: "Auto-link regressions to the commit that shipped them. Roll back with one click, no detective work.",
    color: "amber" as const,
  },
  {
    icon: ShieldCheck,
    title: "Zero-config SDK",
    desc: "Drop in the SDK and we instrument every route, query, and downstream call without a single decorator.",
    color: "emerald" as const,
  },
  {
    icon: Workflow,
    title: "Smart routing tips",
    desc: "Get actionable, code-level recommendations: cache this, batch that, deprecate the other.",
    color: "violet" as const,
  },
];

const accentMap: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
  pink: "from-pink-500/20 to-pink-500/5 text-pink-400",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
};

const metrics = [
  { value: "12.4B", label: "Requests analyzed monthly" },
  { value: "47%", label: "Avg. cloud cost reduction" },
  { value: "<200ms", label: "Time to first insight" },
  { value: "99.99%", label: "Pipeline uptime SLO" },
];

const logos = [
  "ACME", "Lattice", "Northwind", "Globex", "Initech", "Vandelay", "Stark", "Wayne",
];

const testimonials = [
  {
    quote:
      "We caught a runaway query that was costing us $14k/month within an hour of installing the SDK. The ROI was instant.",
    author: "Maya Chen",
    role: "Staff Engineer, Lattice",
  },
  {
    quote:
      "Pulse replaced three observability tools. Our on-call engineers now actually sleep through the night.",
    author: "Daniel Park",
    role: "VP Engineering, Northwind",
  },
  {
    quote:
      "The cost insights paid for the Enterprise plan in the first 48 hours. Honestly should be illegal how good this is.",
    author: "Sarah Whitman",
    role: "CTO, Vandelay Systems",
  },
];

const tiers = [
  {
    name: "Developer",
    price: "$0",
    cadence: "/mo",
    desc: "Perfect for side projects and prototyping.",
    cta: "Start free",
    variant: "outline" as const,
    features: [
      "50k requests / month",
      "5 active endpoints",
      "3 days data retention",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/mo",
    desc: "For growing engineering teams.",
    cta: "Upgrade to Pro",
    variant: "default" as const,
    popular: true,
    features: [
      "2M requests / month",
      "50 active endpoints",
      "30 days data retention",
      "Cost insights & anomaly alerts",
      "Email support, 24h SLA",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    desc: "For mission-critical APIs at scale.",
    cta: "Contact sales",
    variant: "outline" as const,
    features: [
      "Unlimited requests & endpoints",
      "1 year data retention",
      "Custom SAML SSO + RBAC",
      "Dedicated success manager",
      "99.99% uptime SLA",
    ],
  },
];

const faqs = [
  {
    q: "How long does it take to instrument my API?",
    a: "Less than five minutes. Drop in the SDK, set your API key, and we automatically instrument every Express, Fastify, FastAPI, Rails, or Spring route. No decorators, no boilerplate.",
  },
  {
    q: "Will Pulse add latency to my requests?",
    a: "Average added overhead is 0.3ms per request. Telemetry is buffered in-process and shipped over a non-blocking background channel.",
  },
  {
    q: "How is cost calculated?",
    a: "We model compute, egress, and storage cost based on your hosting provider's published rates and the actual CPU/memory/network footprint of each request.",
  },
  {
    q: "Do you support self-hosting?",
    a: "Yes. Enterprise customers can deploy the entire Pulse stack into their own VPC with Helm charts or Terraform modules.",
  },
  {
    q: "Is my data secure?",
    a: "All traffic is TLS 1.3, all stored data is AES-256 encrypted at rest. We're SOC 2 Type II, ISO 27001, GDPR, and HIPAA compliant.",
  },
];

export default function Landing() {
  return (
    <div className="relative">
      {/* ====== HERO ====== */}
      <section className="relative isolate overflow-hidden pb-32 pt-32">
        {/* Background gradient blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[1200px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "conic-gradient(from 90deg at 50% 50%, hsl(var(--brand-violet)), hsl(var(--brand-cyan)), hsl(var(--brand-pink)), hsl(var(--brand-amber)), hsl(var(--brand-violet)))",
          }}
        />

        {/* 3D scene with CSS fallback */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
          <HeroBackground />
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="glass mb-6 gap-2 rounded-full px-3 py-1 text-xs"
              >
                <Sparkles className="h-3 w-3 text-[hsl(var(--brand-violet))]" />
                <span className="font-medium">Now with AI cost forecasting</span>
                <span className="text-muted-foreground">→</span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            >
              See every API request.
              <br />
              <span className="gradient-text">Save every dollar.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Pulse is the modern observability platform that ties latency, errors, and
              cloud spend together — so your engineers ship faster and your CFO sleeps better.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-7 shadow-lg glow-violet">
                  Launch dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-7 glass">
                Watch 2-min demo
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--brand-emerald))]" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--brand-emerald))]" /> 5-minute setup</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[hsl(var(--brand-emerald))]" /> Free 14-day trial</span>
            </motion.div>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-20"
          >
            <div className="absolute inset-x-12 -bottom-6 -top-6 -z-10 rounded-3xl bg-gradient-to-r from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-pink))] opacity-25 blur-3xl" />
            <Card className="glass-strong overflow-hidden rounded-2xl border-border/40 p-1">
              <div className="rounded-xl bg-card/60 p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Live preview</div>
                    <div className="text-base font-semibold">Production · last 30 days</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 animate-pulse-glow rounded-full bg-[hsl(var(--brand-emerald))]" />
                    <span className="text-xs text-muted-foreground">All systems operational</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total requests", value: "12.4M", delta: "+12.4%", positive: true, color: "violet" },
                    { label: "Avg latency", value: "142ms", delta: "-8.2%", positive: true, color: "cyan" },
                    { label: "Error rate", value: "0.18%", delta: "-22%", positive: true, color: "emerald" },
                    { label: "Spend", value: "$4,210", delta: "-31%", positive: true, color: "pink" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className={`rounded-xl border border-border/50 bg-gradient-to-br ${accentMap[m.color]} p-4`}
                    >
                      <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                        {m.label}
                      </div>
                      <div className="mt-1 text-2xl font-bold text-foreground">{m.value}</div>
                      <div className="mt-1 text-[11px] font-medium">{m.delta}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-12 items-end gap-1 h-32">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const h = 30 + Math.sin(i * 0.4) * 25 + Math.random() * 35;
                    return (
                      <div
                        key={i}
                        className="rounded-t bg-gradient-to-t from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] opacity-80"
                        style={{ height: `${h}%`, gridColumn: `span 1` }}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ====== LOGO MARQUEE ====== */}
      <section className="border-y border-border/40 bg-muted/20 py-10">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by engineering teams at
        </p>
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-marquee gap-16 px-8">
            {[...logos, ...logos].map((l, i) => (
              <span
                key={i}
                className="text-2xl font-bold tracking-widest text-muted-foreground/60 hover:text-foreground transition"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {metrics.map((m) => (
            <motion.div key={m.label} variants={fadeUp} className="glass-card rounded-2xl p-6 text-center">
              <div className="gradient-text text-4xl font-bold sm:text-5xl">{m.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              Platform
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            One platform.{" "}
            <span className="gradient-text">Every signal that matters.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Stop stitching together five tools. Pulse unifies tracing, errors,
            cost analytics, and AI-driven insights in a single, beautifully fast workspace.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card className="glass-card group relative h-full overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl">
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[f.color]}`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-violet))] to-transparent opacity-0 transition-opacity group-hover:opacity-60" />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== SHOWCASE / SPLIT FEATURE ====== */}
      <section id="showcase" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              <Cpu className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-cyan))]" /> AI Insights
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Recommendations that
              <span className="gradient-text-warm"> pay for themselves.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Pulse continuously analyzes your traffic patterns and surfaces high-leverage
              optimizations: queries to cache, endpoints to batch, indexes to add.
              Each suggestion comes with the projected dollar savings, code snippet, and
              one-click rollback.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: BarChart3, text: "Live latency & throughput per endpoint" },
                { icon: Clock, text: "p50 / p95 / p99 percentiles, always" },
                { icon: Lock, text: "PII auto-redaction at the SDK level" },
                { icon: Layers, text: "Trace context across every microservice hop" },
              ].map((it) => (
                <li key={it.text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--brand-violet))]/10 text-[hsl(var(--brand-violet))]">
                    <it.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">{it.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Card className="glass-strong relative overflow-hidden rounded-2xl p-6">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[hsl(var(--brand-pink))]/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[hsl(var(--brand-cyan))]/20 blur-3xl" />
              <div className="relative space-y-3">
                {[
                  { type: "Cache", endpoint: "GET /api/users/:id", saving: "$2,340/mo", color: "violet" },
                  { type: "Batch", endpoint: "POST /api/events", saving: "$1,820/mo", color: "cyan" },
                  { type: "Index", endpoint: "GET /api/orders/search", saving: "$960/mo", color: "pink" },
                  { type: "Deprecate", endpoint: "GET /api/v1/legacy", saving: "$640/mo", color: "amber" },
                ].map((rec) => (
                  <div key={rec.endpoint} className="glass-card flex items-center justify-between rounded-xl p-3.5">
                    <div className="flex items-center gap-3">
                      <Badge className={`${accentMap[rec.color]} border-0 bg-gradient-to-br`}>{rec.type}</Badge>
                      <span className="font-mono text-sm">{rec.endpoint}</span>
                    </div>
                    <span className="text-sm font-semibold gradient-text-warm">{rec.saving}</span>
                  </div>
                ))}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-border/40 bg-background/40 p-4">
                  <span className="text-sm text-muted-foreground">Total projected savings</span>
                  <span className="text-2xl font-bold gradient-text">$5,760/mo</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Loved by teams who{" "}
            <span className="gradient-text">ship daily.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid gap-5 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div key={t.author} variants={fadeUp}>
              <Card className="glass-card flex h-full flex-col rounded-2xl p-6">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[hsl(var(--brand-amber))] text-[hsl(var(--brand-amber))]" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 border-t border-border/40 pt-4">
                  <div className="text-sm font-semibold">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              Pricing
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple pricing.{" "}
            <span className="gradient-text">Outsized returns.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Start free. Scale when you're ready. Every plan includes the full
            observability platform — no feature gating.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid gap-5 md:grid-cols-3"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeUp}>
              <Card
                className={`relative flex h-full flex-col rounded-2xl p-6 ${
                  tier.popular
                    ? "glass-strong border-[hsl(var(--brand-violet))]/40 shadow-2xl glow-violet"
                    : "glass-card"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-pink))] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
                  {tier.cadence && (
                    <span className="ml-1 text-base text-muted-foreground">{tier.cadence}</span>
                  )}
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand-emerald))]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    className={`mt-8 w-full rounded-full ${tier.popular ? "" : ""}`}
                    variant={tier.variant}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ====== FAQ ====== */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-12 text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently asked.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Can't find what you're looking for? Reach out to our team — we reply within an hour.
          </motion.p>
        </motion.div>
        <Accordion type="single" collapsible className="glass-card rounded-2xl px-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ====== SERVER / BACKEND TEASER ====== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 glass-strong p-1"
        >
          <div className="rounded-[22px] bg-card/40 px-8 py-12 sm:px-14 sm:py-16">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full opacity-15 blur-3xl"
              style={{ background: "hsl(var(--brand-cyan))" }} />
            <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full opacity-15 blur-3xl"
              style={{ background: "hsl(var(--brand-violet))" }} />

            <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge variant="outline" className="glass mb-5 gap-2 rounded-full px-3 py-1 text-xs">
                  <Server className="h-3 w-3 text-[hsl(var(--brand-cyan))]" />
                  <span className="font-medium">Backend Infrastructure</span>
                </Badge>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Powered by a{" "}
                  <span
                    className="gradient-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, hsl(var(--brand-cyan)) 0%, hsl(var(--brand-violet)) 60%, hsl(var(--brand-pink)) 100%)",
                    }}
                  >
                    purpose-built engine.
                  </span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Pulse runs on a Fastify v5 analysis engine that parses ASTs across five languages,
                  computes complexity metrics per function, and passes results through an LLM interpretation
                  layer — all in a single API call.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    { icon: Cpu, text: "Multi-language AST parsing — TS, JS, Java, C++, Rust" },
                    { icon: Layers, text: "Modular plugin architecture with DI container" },
                    { icon: Code2, text: "Typed JSON responses, strict schema validation" },
                  ].map((it) => (
                    <li key={it.text} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-cyan))]/10 text-[hsl(var(--brand-cyan))]">
                        <it.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm">{it.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/server">
                  <Button size="lg" variant="outline" className="mt-8 rounded-full glass px-7">
                    Explore the Server
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Mini code preview */}
              <div className="space-y-3">
                <Card className="glass-strong overflow-hidden rounded-2xl">
                  <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-5 py-3">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--brand-amber))]" />
                    <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-amber))]">POST</span>
                    <span className="font-mono text-xs text-muted-foreground">/api/file/repos/analyze</span>
                  </div>
                  <pre className="px-5 py-4 text-xs leading-relaxed text-foreground/85">
{`{
  "repo": "archive.zip",
  "language": "typescript"
}`}
                  </pre>
                </Card>
                <Card className="glass-strong overflow-hidden rounded-2xl">
                  <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-5 py-3">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--brand-emerald))]" />
                    <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-emerald))]">200 OK</span>
                  </div>
                  <pre className="px-5 py-4 text-xs leading-relaxed text-foreground/85">
{`{
  "score": 7.8,
  "risk": "medium",
  "hotspots": [
    "auth.ts",
    "billing.ts"
  ]
}`}
                  </pre>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ====== MCP SERVER ====== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="glass mb-4 gap-2 rounded-full px-3 py-1 text-xs">
              <Plug className="h-3 w-3 text-[hsl(var(--brand-violet))]" />
              MCP Server
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Let AI agents query your code{" "}
            <span className="gradient-text">complexity directly.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            The Pulse MCP Server exposes your complexity analysis as structured tool calls.
            AI coding assistants can query hotspots, risk levels, and refactoring suggestions — right from the editor, without leaving the chat.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-[hsl(var(--brand-violet))]/20 glass-strong p-1"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-15"
            style={{ background: "hsl(var(--brand-violet))" }} />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-10"
            style={{ background: "hsl(var(--brand-cyan))" }} />

          <div className="relative rounded-[22px] bg-card/40 px-8 py-12 sm:px-14 sm:py-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* left */}
              <div className="space-y-6">
                <ul className="space-y-3">
                  {[
                    { icon: Terminal, color: "violet", text: "Call analyze_file_complexity from Cursor or Claude and get a structured report in < 100ms." },
                    { icon: Shield, color: "cyan", text: "Fully local — your source code never leaves the machine. MCP runs as a local server process." },
                    { icon: FileCode2, color: "pink", text: "All 5 languages supported: TypeScript, JavaScript, Python, C#, Java." },
                    { icon: Sparkles, color: "amber", text: "Refactoring suggestions ranked by risk level, projected complexity savings, and code location." },
                  ].map((it) => {
                    const colorMap: Record<string, string> = {
                      violet: "bg-violet-500/10 text-violet-400",
                      cyan: "bg-cyan-500/10 text-cyan-400",
                      pink: "bg-pink-500/10 text-pink-400",
                      amber: "bg-amber-500/10 text-amber-400",
                    };
                    return (
                      <li key={it.text} className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorMap[it.color]}`}>
                          <it.icon className="h-4 w-4" />
                        </div>
                        <span className="mt-1 text-sm text-muted-foreground">{it.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link href="/dashboard/mcp-server">
                  <Button variant="outline" className="rounded-full glass px-7">
                    Explore MCP Server
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* right — tool call preview */}
              <div className="space-y-3">
                <Card className="glass-strong overflow-hidden rounded-2xl">
                  <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-5 py-3">
                    <Plug className="h-3.5 w-3.5 text-[hsl(var(--brand-violet))]" />
                    <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-violet))]">MCP tool call</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">analyze_file_complexity</span>
                  </div>
                  <pre className="px-5 py-4 text-xs leading-relaxed text-foreground/80">{`{
  "file_path": "src/auth/service.ts",
  "language": "typescript",
  "framework": "NestJS"
}`}</pre>
                </Card>
                <Card className="glass-strong overflow-hidden rounded-2xl">
                  <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-5 py-3">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--brand-emerald))]" />
                    <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-emerald))]">Response</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">ComplexityReport</span>
                  </div>
                  <pre className="px-5 py-4 text-xs leading-relaxed text-foreground/80">{`{
  "avgScore": 74,
  "risk": "HIGH",
  "criticalUnits": 2,
  "hotspots": [
    "AuthService.login",
    "TokenRefresher.rotate"
  ],
  "suggestion": "Extract token logic..."
}`}</pre>
                </Card>
                <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--brand-violet))]/20 bg-[hsl(var(--brand-violet))]/5 px-4 py-3">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand-violet))]" />
                  <span className="text-xs text-muted-foreground">
                    Available for <strong className="text-foreground">Cursor</strong>, <strong className="text-foreground">Claude Desktop</strong>, and any MCP-compatible editor.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ====== CTA ====== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 px-8 py-16 text-center sm:px-16 sm:py-24"
        >
          <div className="absolute inset-0 -z-10 animated-gradient opacity-90" />
          <div className="absolute inset-0 -z-10 bg-background/40 backdrop-blur-xl" />
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <Globe2 className="mx-auto mb-6 h-10 w-10 text-white/90" />
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to ship faster
            <br />
            and spend less?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Join thousands of engineering teams using Pulse to monitor, optimize,
            and forecast their entire API surface.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="rounded-full px-7">
                Launch dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/30 bg-white/10 px-7 text-white hover:bg-white/20 hover:text-white"
            >
              Talk to sales
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
