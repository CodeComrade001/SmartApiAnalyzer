import { motion } from "framer-motion";
import {
  Server,
  Plug,
  Shield,
  FileCode2,
  Cpu,
  Terminal,
  Zap,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  ArrowRight,
  Sparkles,
  Code2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const clients = [
  { name: "Cursor", desc: "AI-native code editor", status: "planned", color: "violet" },
  { name: "Claude Desktop", desc: "Anthropic's desktop app", status: "planned", color: "cyan" },
  { name: "VS Code Copilot", desc: "GitHub Copilot extension", status: "planned", color: "pink" },
  { name: "Zed AI", desc: "High-performance editor", status: "planned", color: "amber" },
  { name: "Continue.dev", desc: "Open-source AI assistant", status: "planned", color: "emerald" },
  { name: "Custom client", desc: "Any MCP-compatible client", status: "open", color: "violet" },
];

const tools = [
  {
    name: "analyze_file_complexity",
    desc: "Analyze a single file and return cyclomatic complexity, risk level, time/space scores.",
    params: ["file_path: string", "language: string", "framework?: string"],
    returns: "ComplexityReport",
  },
  {
    name: "get_hotspots",
    desc: "Return the top N highest-complexity functions across all analyzed files.",
    params: ["limit?: number (default 10)", "min_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'"],
    returns: "ComplexityUnit[]",
  },
  {
    name: "summarize_repo",
    desc: "Return an aggregated complexity summary for the entire repository.",
    params: ["language: string", "framework?: string"],
    returns: "ComplexityReport[]",
  },
  {
    name: "get_refactoring_suggestions",
    desc: "Return prioritized refactoring suggestions ranked by risk and projected savings.",
    params: ["file_path?: string", "risk_threshold?: RiskLevel"],
    returns: "RefactoringSuggestion[]",
  },
];

const accentMap: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
  pink: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/20",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
};

export default function MCPServer() {
  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col gap-8">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--brand-violet))]/30 bg-[hsl(var(--brand-violet))]/10">
              <Server className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">MCP Server</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Expose Pulse complexity analysis as Model Context Protocol tools — let AI agents query your codebase directly.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-[hsl(var(--brand-violet))]/40 text-[hsl(var(--brand-violet))]">
          <Sparkles className="h-3 w-3" />
          Coming soon
        </Badge>
      </motion.div>

      {/* ── What is MCP ── */}
      <motion.div variants={fadeUp}>
        <Card className="glass-card relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[hsl(var(--brand-violet))]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[hsl(var(--brand-cyan))]/8 blur-3xl" />
          <div className="relative grid gap-10 p-6 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="gap-1.5 rounded-full text-xs">
                <Globe className="h-3 w-3 text-[hsl(var(--brand-cyan))]" />
                Model Context Protocol
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight">
                Let AI agents query your code complexity — right from the editor.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                MCP (Model Context Protocol) is an open standard that lets AI assistants like Cursor
                and Claude call external tools and data sources as structured function calls. When you
                enable the Pulse MCP Server, your AI coding assistant can query complexity scores,
                find hotspots, and suggest refactors — all with live data from your codebase.
              </p>
              <ul className="space-y-2">
                {[
                  { icon: Zap, text: "Sub-100ms tool responses with local analysis cache" },
                  { icon: Shield, text: "Runs fully local — no code is sent to the cloud" },
                  { icon: Layers, text: "Supports all 5 languages with framework context" },
                  { icon: Activity, text: "Streams incremental results for large repos" },
                ].map((it) => (
                  <li key={it.text} className="flex items-center gap-2.5 text-sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-violet))]/10">
                      <it.icon className="h-3 w-3 text-[hsl(var(--brand-violet))]" />
                    </div>
                    {it.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual flow diagram */}
            <div className="space-y-2">
              {[
                { from: "Cursor / Claude", via: "MCP call", to: "analyze_file_complexity", color: "violet" },
                { from: "Pulse MCP Server", via: "AST parse", to: "ComplexityReport", color: "cyan" },
                { from: "AI assistant", via: "suggests", to: "Refactoring plan", color: "pink" },
              ].map((flow, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-xl border bg-gradient-to-r px-4 py-3 ${accentMap[flow.color]}`}>
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono text-xs font-semibold truncate">{flow.from}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="text-[10px] opacity-60">{flow.via}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="font-mono text-xs font-semibold truncate">{flow.to}</span>
                </div>
              ))}
              <div className="rounded-xl border border-border/40 bg-muted/10 p-3">
                <p className="font-mono text-[10px] text-muted-foreground">
                  <span className="text-[hsl(var(--brand-violet))]">// Example Cursor prompt</span>
                  {"\n"}
                  <span className="text-foreground/80">"Which functions in auth.ts are highest risk? Suggest refactors."</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Available Tools ── */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Available MCP Tools</h2>
          <p className="text-xs text-muted-foreground">These tools will be callable from any MCP-compatible client once the server is enabled.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.name} className="glass-card overflow-hidden rounded-2xl">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start gap-2">
                  <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand-violet))]" />
                  <div>
                    <CardTitle className="font-mono text-sm">{tool.name}</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{tool.desc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Parameters</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.params.map((p) => (
                      <span key={p} className="rounded-lg border border-border/50 bg-muted/30 px-2 py-0.5 font-mono text-[10px]">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ArrowRight className="h-2.5 w-2.5" />
                  Returns: <span className="font-mono font-semibold text-foreground/80 ml-1">{tool.returns}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* ── Supported Clients ── */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Supported Clients</h2>
          <p className="text-xs text-muted-foreground">Any MCP-compatible AI editor or assistant can connect to the Pulse server.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.name} className={`flex items-center gap-3 rounded-xl border bg-gradient-to-br p-4 ${accentMap[c.color]}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${accentMap[c.color]}`}>
                <Plug className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-[10px] opacity-70">{c.desc}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {c.status === "open" ? "Open" : "Planned"}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Server configuration ── */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Server Configuration</h2>
          <p className="text-xs text-muted-foreground">Connection settings for the local MCP server instance.</p>
        </div>
        <Card className="glass-card rounded-2xl">
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-3">
              {[
                { label: "Host", placeholder: "localhost", type: "text" },
                { label: "Port", placeholder: "3741", type: "number" },
                { label: "Auth token", placeholder: "••••••••••••••••", type: "password" },
                { label: "Max connections", placeholder: "5", type: "number" },
              ].map((field) => (
                <div key={field.label} className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-border/40 bg-muted/20 px-3 py-2 font-mono text-xs text-muted-foreground/40 placeholder:text-muted-foreground/30 focus:outline-none"
                  />
                </div>
              ))}
              <Button
                disabled
                className="w-full cursor-not-allowed gap-2 opacity-50 mt-2"
                style={{ background: "linear-gradient(135deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" }}
              >
                <Plug className="h-3.5 w-3.5" />
                Start MCP Server
              </Button>
            </div>

            <div className="space-y-3">
              {/* Status panel */}
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Server status</p>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full border border-border/50 bg-muted/40" />
                  <span className="text-sm font-medium">Offline</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">not configured</Badge>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    { label: "Uptime", value: "—" },
                    { label: "Active connections", value: "0 / 5" },
                    { label: "Requests served", value: "0" },
                    { label: "Avg response", value: "—" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span>{s.label}</span>
                      <span className="font-mono font-medium text-foreground/60">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick start (once available)</p>
                <div className="space-y-1.5">
                  {[
                    "1. Configure host and port above",
                    "2. Generate an auth token",
                    "3. Click \"Start MCP Server\"",
                    "4. Add server URL to your editor's MCP config",
                    "5. Ask your AI: \"analyze auth.ts complexity\"",
                  ].map((step) => (
                    <div key={step} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* waitlist footer */}
          <div className="border-t border-border/40 bg-muted/5 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
                <p className="text-sm text-muted-foreground">
                  MCP Server ships with the next major Pulse release. Join the waitlist for early access.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2 border-[hsl(var(--brand-violet))]/30 text-[hsl(var(--brand-violet))] hover:bg-[hsl(var(--brand-violet))]/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Join waitlist
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Config snippet preview ── */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Editor Integration</h2>
          <p className="text-xs text-muted-foreground">Example MCP config snippets for popular editors — available once the server ships.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              editor: "Cursor (.cursor/mcp.json)",
              color: "violet",
              code: `{
  "mcpServers": {
    "pulse": {
      "url": "http://localhost:3741",
      "token": "<your-token>"
    }
  }
}`,
            },
            {
              editor: "Claude Desktop (claude_desktop_config.json)",
              color: "cyan",
              code: `{
  "mcp_servers": [{
    "name": "pulse",
    "base_url": "http://localhost:3741",
    "auth": {
      "type": "bearer",
      "token": "<your-token>"
    }
  }]
}`,
            },
          ].map((ex) => (
            <Card key={ex.editor} className="glass-card overflow-hidden rounded-2xl">
              <div className={`flex items-center gap-2 border-b border-border/40 bg-gradient-to-r px-4 py-2.5 ${accentMap[ex.color]}`}>
                <Terminal className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-[11px] font-medium">{ex.editor}</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/75">
                {ex.code}
              </pre>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
