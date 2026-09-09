import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  GitBranch,
  Layers,
  Zap,
  Shield,
  Code2,
  Database,
  Box,
  Network,
  ChevronRight,
  Terminal,
  FileCode2,
  Workflow,
  Braces,
  ScanLine,
  FlaskConical,
  Lock,
  Check,
  BarChart3,
  Globe2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7 } },
};

const accentMap: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
  pink: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/20",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
};

const trustBadges = [
  { label: "Fastify-Powered", color: "violet" as const },
  { label: "Multi-Language AST", color: "cyan" as const },
  { label: "Real-Time Processing", color: "emerald" as const },
  { label: "Structured JSON Output", color: "amber" as const },
  { label: "Plugin Architecture", color: "pink" as const },
  { label: "TypeScript-Strict", color: "violet" as const },
  { label: "LLM Interpretation", color: "cyan" as const },
  { label: "DI Container", color: "pink" as const },
];

const pipelineSteps = [
  {
    step: "01",
    icon: FileCode2,
    title: "Source Upload",
    desc: "Multipart file upload endpoint accepts repos, individual files, or directory archives up to configurable size limits.",
    color: "violet" as const,
  },
  {
    step: "02",
    icon: ScanLine,
    title: "AST Parsing",
    desc: "ts-morph and language-specific compilers parse source trees. Each file yields a rich abstract syntax tree.",
    color: "cyan" as const,
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Metric Computation",
    desc: "Cyclomatic complexity, nesting depth, cognitive load, and maintainability index calculated per function, file, and module.",
    color: "pink" as const,
  },
  {
    step: "04",
    icon: FlaskConical,
    title: "AI Interpretation",
    desc: "Raw metrics are passed through an LLM layer to produce human-readable explanations, risk summaries, and prioritized refactor suggestions.",
    color: "amber" as const,
  },
  {
    step: "05",
    icon: Braces,
    title: "JSON Response",
    desc: "Clean, typed JSON structures are returned to the frontend dashboard, ready for rendering and export.",
    color: "emerald" as const,
  },
];

const coreFeatures = [
  {
    icon: Globe2,
    title: "Multi-Language Analysis",
    desc: "TypeScript, JavaScript, Java, C++, and Rust parsers. Each language ships as an isolated analyzer plugin that extends the same interface.",
    color: "violet" as const,
    bullets: ["TypeScript & JavaScript via ts-morph", "C++ via Clang AST bridge", "Java & Rust parser plugins", "Extensible analyzer interface"],
  },
  {
    icon: Zap,
    title: "Fastify-Powered Pipeline",
    desc: "Every analysis request flows through Fastify v5's async plugin system. Low-overhead JSON schema validation on every route. No callbacks, no memory leaks.",
    color: "cyan" as const,
    bullets: ["Sub-millisecond route overhead", "Async plugin registration", "JSON schema validation", "Structured pino logging"],
  },
  {
    icon: Box,
    title: "Modular Architecture",
    desc: "Services, analyzers, and route handlers are wired through a DI container. Swap any module without touching the rest of the system.",
    color: "pink" as const,
    bullets: ["Dependency injection container", "Isolated analyzer modules", "Route plugin registration", "Zero-coupling service layer"],
  },
  {
    icon: Code2,
    title: "Developer-First API",
    desc: "Every endpoint returns typed, consistent JSON. Response envelopes include metadata, pagination hints, and structured error objects.",
    color: "amber" as const,
    bullets: ["Typed response contracts", "Consistent error envelopes", "Pagination-ready list shapes", "No breaking field renames"],
  },
  {
    icon: Cpu,
    title: "LLM Insight Layer",
    desc: "Raw complexity numbers alone don't ship code. Our LLM integration translates metrics into prioritized engineering actions your team can act on today.",
    color: "emerald" as const,
    bullets: ["Complexity → readable explanation", "Risk-ranked refactor queue", "Architectural pattern detection", "Context-aware suggestions"],
  },
  {
    icon: Shield,
    title: "Hardened for Production",
    desc: "File size limits, max-count guards, CORS policy, and strict TypeScript throughout. The engine is as disciplined as the code it analyzes.",
    color: "violet" as const,
    bullets: ["Upload size & count limits", "CORS origin allowlist", "Strict TS NodeNext modules", "No implicit any, no unsafe casts"],
  },
];

const useCases = [
  {
    icon: Layers,
    title: "Engineering Health Audits",
    desc: "CTOs get a quantified snapshot of every repository: where complexity lives, which modules carry the most risk, and where refactoring effort pays off most.",
    color: "violet" as const,
  },
  {
    icon: GitBranch,
    title: "Code Review Prioritization",
    desc: "Route incoming PRs through the analysis engine before review. Surface hotspot files automatically so reviewers focus attention where it matters.",
    color: "cyan" as const,
  },
  {
    icon: Database,
    title: "Legacy Repo Triage",
    desc: "Scan decade-old codebases and get a complexity heatmap in minutes. Identify the 20% of files responsible for 80% of your maintenance burden.",
    color: "pink" as const,
  },
  {
    icon: Network,
    title: "CI Quality Gates",
    desc: "Integrate the API into your pipeline. Fail builds when complexity scores breach thresholds. Keep the codebase accountable on every merge.",
    color: "amber" as const,
  },
  {
    icon: Terminal,
    title: "Technical Debt Detection",
    desc: "Quantify debt that's invisible to static linters: high nesting, god files, circular dependencies, and function length violations, all scored and ranked.",
    color: "emerald" as const,
  },
  {
    icon: Workflow,
    title: "Team Productivity Analytics",
    desc: "Track complexity trends over sprints. Watch refactoring efforts lower scores over time. Give your team a concrete metric of code quality improvement.",
    color: "pink" as const,
  },
];

const techStack = [
  { name: "Fastify v5", role: "HTTP framework", color: "violet" },
  { name: "TypeScript 5", role: "Type safety", color: "cyan" },
  { name: "ts-morph", role: "AST parsing", color: "pink" },
  { name: "Node.js 24", role: "Runtime", color: "emerald" },
  { name: "Pino", role: "Structured logging", color: "amber" },
  { name: "Zod", role: "Schema validation", color: "violet" },
  { name: "React 19", role: "Frontend", color: "cyan" },
  { name: "Recharts", role: "Data visualization", color: "pink" },
];

const REQUEST_EXAMPLE = `POST /api/file/repos/analyze
Content-Type: multipart/form-data

{
  "repo": "<archive.zip>",
  "language": "typescript",
  "depth": "full"
}`;

const RESPONSE_EXAMPLE = `{
  "status": "ok",
  "data": {
    "score": 7.8,
    "risk": "medium",
    "files_analyzed": 84,
    "hotspots": [
      { "file": "src/auth/session.ts",   "complexity": 24 },
      { "file": "src/billing/invoice.ts", "complexity": 19 },
      { "file": "src/api/gateway.ts",    "complexity": 17 }
    ],
    "summary": "3 modules carry disproportionate cyclomatic
      complexity. Refactoring auth/session.ts alone would
      reduce overall score by ~18%."
  }
}`;

const architectureReasons = [
  {
    title: "Modular services",
    desc: "Every capability — parsing, scoring, LLM interpretation — lives in its own bounded service. Adding a new language means adding one module, not modifying ten files.",
    color: "violet" as const,
  },
  {
    title: "DI container pattern",
    desc: "Dependencies are declared, not imported ad-hoc. The container resolves the entire graph at startup, making the system testable and the dependency map explicit.",
    color: "cyan" as const,
  },
  {
    title: "Isolated analyzers",
    desc: "Each language analyzer operates in isolation. A parsing error in the C++ plugin never contaminates a TypeScript analysis running in the same request batch.",
    color: "pink" as const,
  },
  {
    title: "Plugin registration lifecycle",
    desc: "Routes are registered as Fastify plugins with explicit scoping. No global mutation, no side effects at import time, no initialization order surprises.",
    color: "amber" as const,
  },
];

export default function ServerPage() {
  return (
    <div className="relative">
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden pb-32 pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30" />
        {/* Colored backdrop blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "conic-gradient(from 120deg at 50% 50%, hsl(var(--brand-cyan)), hsl(var(--brand-violet)), hsl(var(--brand-pink)), hsl(var(--brand-cyan)))",
          }}
        />
        <div className="pointer-events-none absolute left-0 top-1/4 -z-10 h-80 w-80 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(var(--brand-violet))" }} />
        <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-80 w-80 translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(var(--brand-cyan))" }} />

        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="glass mb-6 gap-2 rounded-full px-3 py-1 text-xs">
                <Cpu className="h-3 w-3 text-[hsl(var(--brand-cyan))]" />
                <span className="font-medium">Analysis Engine · v2 Architecture</span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            >
              Backend Infrastructure{" "}
              <br />
              <span
                className="gradient-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(var(--brand-cyan)) 0%, hsl(var(--brand-violet)) 50%, hsl(var(--brand-pink)) 100%)",
                }}
              >
                for Code Intelligence.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              A high-performance analysis engine built on Fastify v5. Upload source code,
              parse abstract syntax trees across five languages, compute complexity metrics,
              and surface AI-interpreted engineering insights — all in a single request.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-7 shadow-lg glow-cyan"
                  style={{ background: "linear-gradient(135deg, hsl(var(--brand-cyan)), hsl(var(--brand-violet)))" }}>
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#api">
                <Button size="lg" variant="outline" className="rounded-full px-7 glass">
                  Explore the API
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              {[
                "5 language parsers",
                "Real-time AST analysis",
                "LLM-powered insights",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--brand-emerald))]" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Architecture diagram card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-20"
          >
            <div className="absolute inset-x-16 -bottom-6 -top-6 -z-10 rounded-3xl opacity-20 blur-3xl"
              style={{ background: "linear-gradient(90deg, hsl(var(--brand-cyan)), hsl(var(--brand-violet)), hsl(var(--brand-pink)))" }} />
            <Card className="glass-strong overflow-hidden rounded-2xl border-border/40 p-1">
              <div className="rounded-xl bg-card/60 p-6 sm:p-10">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">pulse-engine · analysis-pipeline</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse-glow rounded-full bg-[hsl(var(--brand-emerald))]" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>

                {/* Pipeline steps visual */}
                <div className="relative flex flex-col gap-0 md:flex-row md:items-start">
                  {pipelineSteps.map((step, i) => (
                    <div key={step.step} className="relative flex flex-1 flex-col items-center text-center">
                      {/* connector line */}
                      {i < pipelineSteps.length - 1 && (
                        <div className="absolute left-1/2 top-6 hidden h-px w-full translate-x-6 md:block"
                          style={{
                            background: "linear-gradient(90deg, hsl(var(--brand-cyan)) 0%, transparent 100%)",
                            opacity: 0.35,
                          }}
                        />
                      )}
                      <div className={`relative z-10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br ${accentMap[step.color]}`}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground/60 mb-1">
                        {step.step}
                      </div>
                      <div className="text-sm font-semibold mb-1">{step.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed px-2 hidden lg:block">
                        {step.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST BADGES MARQUEE ===== */}
      <section className="border-y border-border/40 bg-muted/20 py-8 overflow-hidden">
        <div className="flex w-max animate-marquee gap-6 px-6">
          {[...trustBadges, ...trustBadges].map((b, i) => (
            <Badge
              key={i}
              variant="outline"
              className={`rounded-full border px-3 py-1 text-xs font-medium bg-gradient-to-br ${accentMap[b.color]}`}
            >
              {b.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* ===== CORE FEATURES ===== */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              <Cpu className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-cyan))]" /> Engine Capabilities
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Not a CRUD API.{" "}
            <span className="gradient-text"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-cyan)), hsl(var(--brand-violet)))" }}>
              An analysis engine.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            Every component exists to serve one purpose: understanding source code at machine speed
            and translating it into engineering intelligence your team can act on.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {coreFeatures.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card className="glass-card group relative h-full overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${accentMap[f.color]}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 shrink-0 text-[hsl(var(--brand-emerald))]" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-cyan))] to-transparent opacity-0 transition-opacity group-hover:opacity-50" />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== API SHOWCASE ===== */}
      <section id="api" className="mx-auto max-w-6xl px-6 py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              <Terminal className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-amber))]" /> API Reference
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Clean contracts.{" "}
              <span className="gradient-text"
                style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-amber)), hsl(var(--brand-pink)))" }}>
                Typed output.
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every endpoint returns a consistent, documented JSON shape. No ambiguous fields,
              no snake_case / camelCase inconsistencies, no surprise nulls. The contract is the spec.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: Code2, text: "POST /api/file/repos/analyze — full repo scan" },
                { icon: BarChart3, text: "GET /api/analysis/:id — fetch stored results" },
                { icon: ScanLine, text: "POST /api/file/upload — incremental file upload" },
                { icon: Lock, text: "All routes: JSON schema validated, no coercions" },
              ].map((it) => (
                <li key={it.text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-amber))]/10 text-[hsl(var(--brand-amber))]">
                    <it.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-mono text-sm">{it.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-4"
          >
            {/* Request block */}
            <Card className="glass-strong overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--brand-amber))]" />
                  <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-amber))]">REQUEST</span>
                </div>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">multipart/form-data</Badge>
              </div>
              <pre className="overflow-x-auto px-5 py-5 text-xs leading-relaxed text-foreground/85">
                <code>{REQUEST_EXAMPLE}</code>
              </pre>
            </Card>

            {/* Response block */}
            <Card className="glass-strong overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--brand-emerald))]" />
                  <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-emerald))]">RESPONSE 200</span>
                </div>
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">application/json</Badge>
              </div>
              <pre className="overflow-x-auto px-5 py-5 text-xs leading-relaxed text-foreground/85">
                <code>{RESPONSE_EXAMPLE}</code>
              </pre>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== WHY ARCHITECTURE MATTERS ===== */}
      <section className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-muted/20" />
        <div className="pointer-events-none absolute left-0 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(var(--brand-violet))" }} />
        <div className="pointer-events-none absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(var(--brand-cyan))" }} />

        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
                <Layers className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-violet))]" /> Design Philosophy
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
              Why architecture{" "}
              <span className="gradient-text">matters here.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              A platform that measures code quality has to hold itself to an exceptional standard.
              These are the structural decisions that make the engine trustworthy, testable, and extensible.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid gap-5 md:grid-cols-2"
          >
            {architectureReasons.map((r) => (
              <motion.div key={r.title} variants={fadeUp}>
                <Card className="glass-card h-full rounded-2xl p-6">
                  <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold bg-gradient-to-br ${accentMap[r.color]}`}>
                    {r.title}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              Use Cases
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl">
            Built for teams who{" "}
            <span className="gradient-text"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-violet)))" }}>
              take quality seriously.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
            From a CTO running a company-wide audit to a lead engineer gating a merge — Pulse's
            analysis engine serves every level of the engineering org.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {useCases.map((uc) => (
            <motion.div key={uc.title} variants={fadeUp}>
              <Card className="glass-card group h-full rounded-2xl p-6 transition-all hover:-translate-y-1">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br ${accentMap[uc.color]}`}>
                  <uc.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mb-2 font-semibold">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="glass mb-4 rounded-full px-3 py-1 text-xs">
              <Code2 className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-pink))]" /> Technology
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
            A stack chosen for{" "}
            <span className="gradient-text">precision.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {techStack.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <Card className={`glass-card rounded-xl p-5 text-center border bg-gradient-to-br ${accentMap[t.color as keyof typeof accentMap]}`}>
                <div className="text-base font-bold">{t.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.role}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section className="relative overflow-hidden py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-15 blur-3xl"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, hsl(var(--brand-cyan)), hsl(var(--brand-violet)), hsl(var(--brand-pink)), hsl(var(--brand-amber)), hsl(var(--brand-cyan)))",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-20" />

        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="glass mb-6 rounded-full px-3 py-1 text-xs">
                <Zap className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-amber))]" /> Start analyzing
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-5xl font-bold tracking-tight sm:text-6xl">
              Analyze your{" "}
              <span className="gradient-text">codebase now.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-6 text-xl text-muted-foreground">
              Upload a repository, run your first analysis in under a minute, and get
              AI-interpreted complexity metrics your engineering team can act on today.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 shadow-xl glow-violet text-base">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#api">
                <Button size="lg" variant="outline" className="rounded-full px-8 glass text-base">
                  Browse API Reference
                </Button>
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {["No setup required", "Full analysis in seconds", "Export to JSON or CSV"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--brand-emerald))]" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
