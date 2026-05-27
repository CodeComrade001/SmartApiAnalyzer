import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crosshair,
  Play,
  Trash2,
  Globe,
  ChevronRight,
  Bot,
} from "lucide-react";
import { useLocation } from "wouter";
import { useScan } from "@/context/ScanContext";
import {
  AGENTS,
  categoryMeta,
} from "@/data/agentCatalog";
import type { AgentCategory } from "@/data/agentCatalog";
import { Badge } from "@/components/ui/badge";

const CATEGORIES: AgentCategory[] = ["validation", "security", "performance", "alerting"];

export function MissionBriefToggle() {
  const { briefOpen, setBriefOpen, selectedAgents, scanTargets } = useScan();
  const count = selectedAgents.size;

  return (
    <button
      onClick={() => setBriefOpen(!briefOpen)}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground transition-all hover:border-[hsl(var(--brand-violet))]/40 hover:bg-[hsl(var(--brand-violet))]/10 hover:text-[hsl(var(--brand-violet))]"
      title="Mission Brief"
    >
      <Crosshair className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--brand-violet))] text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
      {scanTargets.length > 0 && (
        <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[hsl(var(--brand-cyan))] text-[8px] font-bold text-black">
          {scanTargets.length}
        </span>
      )}
    </button>
  );
}

export function MissionBrief() {
  const {
    briefOpen,
    setBriefOpen,
    selectedAgents,
    scanTargets,
    removeScanTarget,
    clearScanTargets,
    setSelectedAgents,
    setActivePreset,
  } = useScan();

  const [, navigate] = useLocation();

  const agentsByCategory = CATEGORIES.map((cat) => ({
    cat,
    meta: categoryMeta[cat],
    agents: AGENTS.filter((a) => a.category === cat && selectedAgents.has(a.key)),
  })).filter((g) => g.agents.length > 0);

  const handleClearAll = () => {
    setSelectedAgents(new Set());
    setActivePreset("custom");
    clearScanTargets();
  };

  return (
    <AnimatePresence>
      {briefOpen && (
        <>
          {/* backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setBriefOpen(false)}
          />

          {/* panel */}
          <motion.div
            key="panel"
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[320px] flex-col border-l border-border/60 bg-background/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(var(--brand-violet))]/30 bg-[hsl(var(--brand-violet))]/10">
                <Crosshair className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none">Mission Brief</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {selectedAgents.size} agent{selectedAgents.size !== 1 ? "s" : ""} ·{" "}
                  {scanTargets.length} target{scanTargets.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setBriefOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto">

              {/* scan targets */}
              <div className="border-b border-border/40 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[hsl(var(--brand-cyan))]" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Scan Targets
                    </p>
                  </div>
                  {scanTargets.length > 0 && (
                    <button
                      onClick={clearScanTargets}
                      className="text-[10px] text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
                    >
                      clear all
                    </button>
                  )}
                </div>

                {scanTargets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 px-3 py-4 text-center">
                    <Globe className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground/40" />
                    <p className="text-[11px] text-muted-foreground">No targets selected</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                      Pick endpoints on the Agent Scan page
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {scanTargets.map((url) => (
                      <div
                        key={url}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/10 px-2.5 py-2"
                      >
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--brand-cyan))]" />
                        <span className="flex-1 truncate font-mono text-[10px]">{url}</span>
                        <button
                          onClick={() => removeScanTarget(url)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:text-[hsl(var(--brand-pink))]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* selected agents */}
              <div className="p-4">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-[hsl(var(--brand-violet))]" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Selected Agents
                  </p>
                  <Badge
                    variant="outline"
                    className="ml-auto text-[9px] border-[hsl(var(--brand-violet))]/40 text-[hsl(var(--brand-violet))]"
                  >
                    {selectedAgents.size} / {AGENTS.length}
                  </Badge>
                </div>

                {selectedAgents.size === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 px-3 py-4 text-center">
                    <Bot className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground/40" />
                    <p className="text-[11px] text-muted-foreground">No agents selected</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                      Choose agents on the Agent Scan page
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agentsByCategory.map(({ cat, meta, agents }) => {
                      const Icon = meta.icon;
                      return (
                        <div key={cat}>
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <div className={`flex h-5 w-5 items-center justify-center rounded ${meta.bg}`}>
                              <Icon className={`h-3 w-3 ${meta.color}`} />
                            </div>
                            <span className={`text-[10px] font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className={`ml-auto text-[9px] font-bold tabular-nums ${meta.color}`}>
                              {agents.length}
                            </span>
                          </div>
                          <div className="space-y-0.5 pl-1">
                            {agents.map((a) => (
                              <div
                                key={a.key}
                                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.color}`}
                              >
                                {a.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="border-t border-border/60 p-4 space-y-2">
              <button
                onClick={() => {
                  setBriefOpen(false);
                  navigate("/dashboard/agents");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" }}
              >
                <Play className="h-3.5 w-3.5" />
                Go to Agent Scan
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              {(selectedAgents.size > 0 || scanTargets.length > 0) && (
                <button
                  onClick={handleClearAll}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-muted/20 py-2 text-xs text-muted-foreground transition hover:border-[hsl(var(--brand-pink))]/40 hover:text-[hsl(var(--brand-pink))]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear mission brief
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
