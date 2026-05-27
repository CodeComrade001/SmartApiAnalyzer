import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info, Loader2, Circle, ChevronRight, ScanLine } from "lucide-react";
import { useLocation } from "wouter";
import { useScan } from "@/context/ScanContext";
import { AGENTS, categoryMeta } from "@/data/agentCatalog";
import type { AgentCategory, FindingSeverity } from "@/data/agentCatalog";
import { Button } from "@/components/ui/button";

/* ─── helpers ─── */
const LOG_COLORS = {
  info:    "text-slate-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error:   "text-pink-400",
} as const;

const LOG_PREFIXES = {
  info:    "·",
  success: "✓",
  warning: "!",
  error:   "✗",
} as const;

function AgentStatusIcon({ status }: { status: "pending" | "running" | FindingSeverity }) {
  if (status === "pending") return <Circle className="h-3.5 w-3.5 text-slate-600" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />;
  if (status === "PASS")    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "CRITICAL") return <AlertTriangle className="h-3.5 w-3.5 text-pink-400" />;
  if (status === "HIGH")    return <AlertCircle className="h-3.5 w-3.5 text-amber-400" />;
  if (status === "MEDIUM")  return <Info className="h-3.5 w-3.5 text-cyan-400" />;
  return <Info className="h-3.5 w-3.5 text-slate-500" />;  // LOW
}

function agentStatusColor(status: "pending" | "running" | FindingSeverity): string {
  if (status === "pending")  return "text-slate-500";
  if (status === "running")  return "text-cyan-400";
  if (status === "PASS")     return "text-emerald-400";
  if (status === "CRITICAL") return "text-pink-400";
  if (status === "HIGH")     return "text-amber-400";
  if (status === "MEDIUM")   return "text-cyan-300";
  return "text-slate-400";
}

const CATEGORIES: AgentCategory[] = ["validation", "security", "performance", "alerting"];

/* ─── ScanTerminal component ─── */
export function ScanTerminal() {
  const {
    showTerminal, setShowTerminal,
    isScanRunning, scanProgressValue, scanLogs,
    agentScanStatuses, selectedAgents, scanTargets,
    lastScanMeta,
  } = useScan();

  const [, navigate] = useLocation();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  /* auto-scroll logs to bottom */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scanLogs]);

  /* countdown to insights after scan completes */
  useEffect(() => {
    if (!isScanRunning && lastScanMeta && showTerminal) {
      setCountdown(3);
    }
  }, [isScanRunning, lastScanMeta, showTerminal]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setShowTerminal(false);
      navigate("/dashboard/insights");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate, setShowTerminal]);

  /* group logs by agent for display */
  const logGroups: { agentKey: string; agentLabel: string; category: AgentCategory; entries: typeof scanLogs }[] = [];
  for (const log of scanLogs) {
    const last = logGroups[logGroups.length - 1];
    if (last && last.agentKey === log.agentKey) {
      last.entries.push(log);
    } else {
      logGroups.push({ agentKey: log.agentKey, agentLabel: log.agentLabel, category: log.category, entries: [log] });
    }
  }

  const isComplete = !isScanRunning && lastScanMeta !== null;
  const totalAgents = selectedAgents.size;

  return (
    <AnimatePresence>
      {showTerminal && (
        <motion.div
          key="scan-terminal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0d1117] shadow-2xl"
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 border-b border-slate-700/60 bg-[#161b22] px-5 py-3">
              <div className="flex items-center gap-2">
                <ScanLine className={`h-4 w-4 ${isScanRunning ? "animate-pulse text-cyan-400" : isComplete ? "text-emerald-400" : "text-slate-400"}`} />
                <span className="font-mono text-sm font-semibold text-white">
                  {isComplete ? "Scan Complete" : isScanRunning ? "Agent Scan — Running" : "Agent Scan"}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  {scanTargets.length} target{scanTargets.length !== 1 ? "s" : ""}
                </span>
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  {totalAgents} agent{totalAgents !== 1 ? "s" : ""}
                </span>
              </div>

              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-auto flex items-center gap-3"
                >
                  <span className="font-mono text-xs text-slate-400">
                    Redirecting to Insights in{" "}
                    <span className="font-bold text-emerald-400">{countdown}s</span>
                  </span>
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs"
                    variant="ghost"
                    onClick={() => {
                      setCountdown(null);
                      setShowTerminal(false);
                      navigate("/dashboard/insights");
                    }}
                  >
                    View Insights <ChevronRight className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}

              <button
                onClick={() => { setShowTerminal(false); setCountdown(null); }}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-700/50 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: agent list */}
              <div className="w-[220px] shrink-0 overflow-y-auto border-r border-slate-700/60 bg-[#0d1117] p-3">
                {CATEGORIES.map((cat) => {
                  const meta = categoryMeta[cat];
                  const CatIcon = meta.icon;
                  const catAgents = AGENTS.filter((a) => a.category === cat && selectedAgents.has(a.key));
                  if (catAgents.length === 0) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <div className="mb-1.5 flex items-center gap-1.5 px-1">
                        <CatIcon className={`h-3 w-3 ${meta.color}`} />
                        <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {catAgents.map((agent) => {
                          const status = agentScanStatuses[agent.key] ?? "pending";
                          return (
                            <div
                              key={agent.key}
                              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                                status === "running" ? "bg-cyan-500/10" : ""
                              }`}
                            >
                              <AgentStatusIcon status={status} />
                              <span className={`truncate font-mono text-[10px] ${agentStatusColor(status)}`}>
                                {agent.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: log stream */}
              <div className="flex-1 overflow-y-auto bg-[#0d1117] p-4 font-mono text-xs">
                {scanLogs.length === 0 && (
                  <p className="text-slate-600 italic">Waiting for agents to start...</p>
                )}

                {logGroups.map((group, gi) => {
                  const catMeta = categoryMeta[group.category];
                  return (
                    <div key={`${group.agentKey}-${gi}`} className="mb-4">
                      {/* agent header */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-700/50" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${catMeta.color}`}>
                          {group.agentLabel}
                        </span>
                        <div className="h-px flex-1 bg-slate-700/50" />
                      </div>
                      {/* log entries */}
                      {group.entries.map((entry, ei) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: ei * 0.03 }}
                          className={`flex items-start gap-2 py-0.5 ${LOG_COLORS[entry.level]}`}
                        >
                          <span className="shrink-0 select-none opacity-60">{LOG_PREFIXES[entry.level]}</span>
                          <span className="leading-relaxed">{entry.message}</span>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}

                {/* blinking cursor when running */}
                {isScanRunning && (
                  <span className="inline-block h-3.5 w-2 animate-pulse bg-cyan-400 opacity-80" />
                )}

                {/* completion banner */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center"
                  >
                    <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                    <p className="font-bold text-emerald-400">Scan complete</p>
                    <p className="mt-1 text-slate-400 text-[11px]">
                      {totalAgents} agents ran in {((lastScanMeta?.duration ?? 0) / 1000).toFixed(1)}s against {lastScanMeta?.targets.length ?? 0} targets.
                    </p>
                  </motion.div>
                )}

                <div ref={logEndRef} />
              </div>
            </div>

            {/* ── Footer progress ── */}
            <div className="border-t border-slate-700/60 bg-[#161b22] px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">
                    {isComplete
                      ? `${totalAgents}/${totalAgents} agents complete`
                      : `Scanning: ${Object.values(agentScanStatuses).filter((s) => s !== "pending").length} / ${totalAgents}`}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold tabular-nums text-slate-400">
                  {isComplete ? "100%" : `${scanProgressValue}%`}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))" }}
                  animate={{ width: `${isComplete ? 100 : scanProgressValue}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
