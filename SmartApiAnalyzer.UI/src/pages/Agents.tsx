import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, CheckCircle2, Globe, Link2, X, Bot,
  ScanLine, ChevronDown,
  ShieldCheck, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { mockWebsiteApis } from "@/services/data/mockData";
import { useScan } from "@/context/ScanContext";
import {
  AGENTS, PRESETS, categoryMeta, presetColorMap,
} from "@/data/agentCatalog";
import type { AgentCategory } from "@/data/agentCatalog";
import { scanInitiationSwitch, ScanInitiationSwitchPayload } from "@/api/endpoints/logs";
import { ApiEndpoint, WebsiteApiGroup } from "@/types";
import { scanInitiationSwitchPayloadNormalize } from '@/components/helpers/getallMethodEndpointGrouped';
import { usePopUpNotify } from "@/hooks/use-pop-up-notify";
import { HashGenerator } from "@/api/helpers/uniqueIdGenerator";
import { connection } from "@/api/helpers/signalr";

/* ─── constants ─── */
const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  POST: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DELETE: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  PATCH: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

function Section({ number, title, subtitle, children, extra }: {
  number: string; title: string; subtitle: string; children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-muted-foreground/40">{number}</span>
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {extra}
      </div>
      {children}
    </motion.div>
  );
}

export default function AgentsPage() {
  const [, navigate] = useLocation();

  const {
    selectedAgents, setSelectedAgents, toggleAgent, activePreset, setActivePreset,
    scanTargets, addScanTarget, removeScanTarget, clearScanTargets, notify,
    setShowTerminal, setIsScanRunning, setScanProgressValue,
    setCurrentScanAgentKey, setAgentScanStatuses,
    addScanLog, clearScanLogs,
    setLastScanResults, setLastScanMeta,
    scanProgressValue,
  } = useScan();
  console.log("Turbo Log  ~ AgentsPage ~ scanTargets:", scanTargets);

  const [customUrl, setCustomUrl] = useState("");
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState<WebsiteApiGroup[]>([]);
  console.log("Turbo Log  ~ AgentsPage ~ selectedWebsite:", selectedWebsite);
  const notifyPopUp = usePopUpNotify();
  console.log("Turbo Log  ~ AgentsPage ~ selectedWebsite:", selectedWebsite);

  /* ── helpers ── */
  const toggleSiteExpanded = (id: string) => {
    setExpandedSites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };


  const getSiteTargetCount = (site: WebsiteApiGroup) => {
    const isSiteAvailable = mockWebsiteApis.find((s) => s.id === site.id);
    if (!isSiteAvailable) return 0;
    return site.endpoints.filter((ep) => scanTargets.some((t) => t.websiteUrl === site.websiteUrl)).length;
  };

  const toggleAllFromSite = (site: WebsiteApiGroup) => {
    const siteAvailability = mockWebsiteApis.find((s) => s.id === site.id);
    if (!siteAvailability) return;
    const urls = site.endpoints.map((ep) => ep.correctedPath || ep.inferredPath).filter(Boolean);
    // Determine if the site is already selected (by id)
    const allSelected = scanTargets.some((t) => t.id === site.id);
    if (allSelected) removeScanTarget(site);
    else addScanTarget(site);
  };


  const handlePresetClick = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.id);
    setSelectedAgents(new Set(preset.agents));
  };

  const handleSelectAll = () => { setSelectedAgents(new Set(AGENTS.map((a) => a.key))); setActivePreset("full"); };
  const handleClearAgents = () => { setSelectedAgents(new Set()); setActivePreset("custom"); };

  const agentsByCategory = useMemo(() => {
    const map: Partial<Record<AgentCategory, typeof AGENTS>> = {};
    for (const a of AGENTS) { if (!map[a.category]) map[a.category] = []; map[a.category]!.push(a); }
    return map as Record<AgentCategory, typeof AGENTS>;
  }, []);


  /* ── launch scan ── */
  const handleRunScan = async () => {
    if (scanTargets.length === 0) {
      notify({
        type: "error",
        title: "No scan targets set",
        message:
          "Select at least one endpoint from a saved website or add a custom URL in section 01.",
        action: {
          label: "Jump to targets",
          href: "/dashboard/agents",
        },
      });
      return;
    }

    if (selectedAgents.size === 0) {
      notify({
        type: "error",
        title: "No agents selected",
        message:
          "Select at least one agent in section 02 before launching.",
        action: {
          label: "Select agents",
          href: "/dashboard/agents",
        },
      });
      return;
    }

    try {
      await connection.start();
      setScanState("scanning");
      setScanProgressValue(0);

      // Open terminal
      clearScanLogs();
      setShowTerminal(true);
      setIsScanRunning(true);

      const agentsToRun = AGENTS.filter((agent) =>
        selectedAgents.has(agent.key)
      );

      // Initialize all selected agents as pending
      const initStatuses: Record<string, "pending"> = {};

      agentsToRun.forEach((agent) => {
        initStatuses[agent.key] = "pending";
      });

      setAgentScanStatuses(initStatuses as any);

      notify({
        type: "info",
        title: "Scan launched",
        message: `Launching ${agentsToRun.length} agent${agentsToRun.length !== 1 ? "s" : ""
          } against ${scanTargets.length} target${scanTargets.length !== 1 ? "s" : ""
          }. Waiting for the scan engine to accept the request.`,
      });


      const normalizePayload: ScanInitiationSwitchPayload[] = scanInitiationSwitchPayloadNormalize(
        scanTargets,
        Array.from(selectedAgents),
      );

      const response = await scanInitiationSwitch(normalizePayload);

      await connection.invoke(
        "JoinScan",
        response.scanId
      );

      return notify({
        type: "success",
        title: "Scan initiated",
        message: `Scan initiated successfully with ID: ${response.scanId}. Monitor the progress in the terminal overlay.`,
      });

    } catch (error: any) {
      console.error(error);

      setScanState("idle");
      setIsScanRunning(false);
      setCurrentScanAgentKey("");

      notify({
        type: "error",
        title: "Unable to start scan",
        message:
          error?.response?.data?.message ??
          error?.message ??
          "An unexpected error occurred while starting the scan.",
      });
    }
  };

  const canScan = scanTargets.length > 0 && selectedAgents.size > 0 && scanState !== "scanning";

  useEffect(() => {
    setSelectedWebsite(prev => {
      const newWebsites = scanTargets.filter(
        target => !prev.some(w => w.id === target.id)
      );

      return [...prev, ...newWebsites];
    });
  }, [scanTargets]);

  useEffect(() => {

    connection.on("AgentProgress", (message) => {

      console.log(message);

      addScanLog(message);

      setAgentScanStatuses(prev => ({
        ...prev,
        [message.agentName]:
          message.status === "Completed"
            ? "completed"
            : "failed"
      }));

    });

    return () => {
      connection.off("AgentProgress");
    };

  }, []);


  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col gap-8">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--brand-violet))]/30 bg-[hsl(var(--brand-violet))]/10">
              <Bot className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Scan</h1>
          </div>
          <p className="mt-1 text-muted-foreground">Pick specific endpoints, choose your agents, and launch a security or performance scan.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedWebsite.length > 0 && (
            <Badge variant="outline" className="gap-1.5 border-cyan-500/40 text-cyan-400">
              <Globe className="h-3 w-3" />{selectedWebsite.length} target{selectedWebsite.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {selectedAgents.size > 0 && (
            <Badge variant="outline" className="gap-1.5 border-violet-500/40 text-violet-400">
              <Bot className="h-3 w-3" />{selectedAgents.size} agent{selectedAgents.size !== 1 ? "s" : ""}
            </Badge>
          )}
          {scanState === "done" && (
            <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Scan complete
            </Badge>
          )}
        </div>
      </motion.div>

      {/* ══ SECTION 01 — TARGET ENDPOINTS ══ */}
      <Section
        number="01" title="Target Endpoints"
        subtitle="Select specific endpoints from saved websites, or add a custom URL to scan."
        extra={
          selectedWebsite.length > 0 ? (
            <button onClick={clearScanTargets} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
              clear all targets
            </button>
          ) : undefined
        }
      >
        <Card className="glass-card overflow-hidden rounded-2xl">
          <div className="space-y-4 p-5">
            {/* saved websites */}
            {selectedWebsite.length > 0 && (
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Saved websites</p>
                <div className="space-y-2">
                  {selectedWebsite.map((site) => {
                    const isExpanded = expandedSites.has(site.id);
                    const selectedCount = getSiteTargetCount(site);
                    const totalCount = site.endpoints.length;
                    const eachSite = site
                    const allSelected = selectedCount === totalCount && totalCount > 0;
                    return (
                      <div key={`${site.id} + ${site.websiteUrl}`} className="rounded-xl border border-border/50 overflow-hidden">
                        <div className="flex items-center gap-3 bg-muted/10 px-4 py-3">
                          <button onClick={() => toggleSiteExpanded(site.id)} className="flex flex-1 items-center gap-2 text-left">
                            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-sm">{site.websiteUrl}</span>
                            <Badge variant="outline" className={`ml-auto text-[10px] ${selectedCount > 0 ? "border-cyan-500/40 text-cyan-400" : "text-muted-foreground"}`}>
                              {selectedCount}/{totalCount} selected
                            </Badge>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          <button onClick={() => toggleAllFromSite(site)}
                            className={`shrink-0 text-[10px] font-medium transition underline underline-offset-2 ${allSelected ? "text-pink-400 hover:text-pink-300" : "text-cyan-400 hover:text-cyan-300"}`}>
                            {allSelected ? "Deselect all" : "Select all"}
                          </button>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                              <div className="divide-y divide-border/30 px-4 pb-2 pt-1">
                                {site.endpoints.map((ep) => {
                                  // const url = getEndpointUrl(ep);
                                  const isSelected = scanTargets.some((t) => t.websiteUrl == eachSite.websiteUrl);
                                  return (
                                    <label key={`${ep.id + site.id}`} className="flex cursor-pointer items-center gap-3 py-2.5 transition hover:text-foreground">
                                      <Checkbox checked={isSelected} onCheckedChange={() => isSelected ? removeScanTarget(eachSite) : addScanTarget(eachSite)} />
                                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${HTTP_METHOD_COLORS[ep.method] ?? ""}`}>{ep.method}</span>
                                      <span className={`flex-1 truncate font-mono text-xs ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{eachSite.websiteUrl}</span>
                                      <Badge variant="outline" className={`shrink-0 text-[9px] ${ep.status === "verified" ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"}`}>
                                        {ep.status}
                                      </Badge>
                                    </label>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[10px] text-muted-foreground">or add a custom endpoint URL</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            {/* <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="https://api.yoursite.com/v1/endpoint" className="pl-9 font-mono"
                  value={customUrl} onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomUrl()} />
              </div>
              <Button variant="outline" onClick={handleAddCustomUrl} disabled={!customUrl.trim()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Target
              </Button>
            </div> */}

            {scanTargets.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  Active Scan Targets ({scanTargets.length})
                </p>
                <div className="space-y-1">
                  {scanTargets.map((url) => (
                    <div key={`${url.websiteUrl} + ${url.id}`} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                      <span className="flex-1 truncate font-mono text-[11px] text-muted-foreground">{url.websiteUrl}</span>
                      <button title="Scan" onClick={() => removeScanTarget(url)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition hover:text-pink-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </Section>

      {/* ══ SECTION 02 — AGENT SELECTION ══ */}
      <Section
        number="02" title="Select Agents"
        subtitle="Pick a preset or hand-pick individual agents. Your selection is saved in your Mission Brief."
        extra={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{selectedAgents.size}</span> / {AGENTS.length}</span>
            <button onClick={handleSelectAll} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground">All</button>
            <button onClick={handleClearAgents} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground">Clear</button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((preset) => (
            <button key={`${preset.id} + ${preset.label}`} onClick={() => handlePresetClick(preset)}
              className={`flex flex-col items-start gap-2 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${activePreset === preset.id ? `${presetColorMap[preset.color]} ring-2 ring-offset-1 ring-offset-background` : "border-border/50 bg-muted/10 hover:border-border"
                }`}>
              <div className="flex w-full items-start justify-between gap-2">
                <span className="font-semibold text-sm">{preset.label}</span>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${activePreset === preset.id ? presetColorMap[preset.color] : ""}`}>{preset.agents.length}</Badge>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{preset.desc}</p>
              {activePreset === preset.id && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>

        <Card className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-border/40 bg-muted/10 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Individual agents</p>
          </div>
          <div className="divide-y divide-border/30">
            {(["validation", "security", "performance", "alerting"] as AgentCategory[]).map((cat) => {
              const meta = categoryMeta[cat];
              const CatIcon = meta.icon;
              const catAgents = agentsByCategory[cat] ?? [];
              return (
                <div key={cat} className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${meta.bg}`}><CatIcon className={`h-3.5 w-3.5 ${meta.color}`} /></div>
                    <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground">{catAgents.filter((a) => selectedAgents.has(a.key)).length}/{catAgents.length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {catAgents.map((agent) => {
                      const active = selectedAgents.has(agent.key);
                      return (
                        <button key={`${agent.key} + ${agent.label}`} onClick={() => toggleAgent(agent.key)}
                          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${active ? `${meta.bg} ${meta.border} border` : "border-border/40 bg-muted/10 hover:bg-muted/20"}`}>
                          <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${active ? `${meta.bg} ${meta.border} border` : "border-border/60 bg-muted/30"}`}>
                            {active && <CheckCircle2 className={`h-2.5 w-2.5 ${meta.color}`} />}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold leading-tight ${active ? meta.color : ""}`}>{agent.label}</p>
                            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{agent.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Section>

      {/* ══ SECTION 03 — LAUNCH ══ */}
      <Section
        number="03" title="Run Scan"
        subtitle={
          scanState === "idle" ? "Review targets and agents, then launch."
            : scanState === "scanning" ? `Running ${selectedAgents.size} agents — watch the live terminal overlay for real-time progress.`
              : "Scan complete — full report available in Insights."
        }
      >
        <AnimatePresence mode="wait">
          {scanState === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="glass-card overflow-hidden rounded-2xl">
                <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                    <Play className="h-6 w-6 text-[hsl(var(--brand-violet))]" />
                  </div>
                  <div>
                    <p className="font-semibold">Ready to scan</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedWebsite.length > 0 ? `${selectedWebsite.length} target${selectedWebsite.length !== 1 ? "s" : ""}` : "No targets set"} ·{" "}
                      {selectedAgents.size > 0 ? `${selectedAgents.size} agent${selectedAgents.size !== 1 ? "s" : ""} selected` : "No agents selected"}
                    </p>
                  </div>
                  {selectedAgents.size > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {AGENTS.filter((a) => selectedAgents.has(a.key)).map((a) => {
                        const meta = categoryMeta[a.category];
                        return <span key={a.key} className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}>{a.label}</span>;
                      })}
                    </div>
                  )}
                  <Button disabled={!canScan} onClick={handleRunScan} size="lg" className="gap-2 px-8"
                    style={canScan ? { background: "linear-gradient(135deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" } : undefined}>
                    <Play className="h-4 w-4" /> Launch Scan
                  </Button>
                  {selectedWebsite.length === 0 && <p className="text-xs text-amber-400">Add at least one target URL in section 01.</p>}
                  {selectedWebsite.length > 0 && selectedAgents.size === 0 && <p className="text-xs text-amber-400">Select at least one agent in section 02.</p>}
                </div>
              </Card>
            </motion.div>
          )}

          {scanState === "scanning" && (
            <motion.div key="scanning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="glass-card overflow-hidden rounded-2xl border-violet-500/20">
                <div className="flex flex-col items-center gap-6 px-8 py-14 text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[hsl(var(--brand-violet))] border-r-[hsl(var(--brand-cyan))]" />
                    <div className="absolute inset-3 animate-spin rounded-full border border-transparent border-b-[hsl(var(--brand-pink))]" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
                    <ScanLine className="h-8 w-8 text-[hsl(var(--brand-violet))]" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Agents running…</p>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">{progressLabel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Watch the live terminal for per-agent output</p>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/50">
                      <motion.div className="h-full rounded-full" animate={{ width: `${scanProgressValue}%` }} transition={{ duration: 0.3 }}
                        style={{ background: "linear-gradient(90deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" }} />
                    </div>
                    <p className="text-xs tabular-nums text-muted-foreground">{scanProgressValue}% complete</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {scanState === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="glass-card overflow-hidden rounded-2xl border-emerald-500/20 bg-emerald-500/5">
                <div className="flex flex-col items-center gap-5 px-8 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-400">Scan complete</p>
                    <p className="mt-1 text-sm text-muted-foreground">Your full security and performance report is ready in Insights.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => navigate("/dashboard/insights")}
                      className="gap-2 text-white"
                      style={{ background: "linear-gradient(135deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" }}>
                      <ArrowRight className="h-4 w-4" /> View Full Report in Insights
                    </Button>
                    <Button variant="outline" onClick={() => { setScanState("idle"); setScanProgressValue(0); }}
                      className="gap-1.5 text-xs">
                      <Play className="h-3.5 w-3.5" /> New Scan
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
    </motion.div>
  );
}
