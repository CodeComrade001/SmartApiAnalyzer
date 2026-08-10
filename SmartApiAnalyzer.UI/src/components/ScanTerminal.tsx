import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Circle,
  ChevronRight,
  ScanLine,
  MessageSquare,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocation } from "wouter";

import { useScan } from "@/context/ScanContext";

import {
  agentPriority,
  AGENTS,
  categoryMeta,
} from "@/data/agentCatalog";

import type {
  AgentCategory,
  AgentKey,
  FindingSeverity,
} from "@/data/agentCatalog";

import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

const LOG_COLORS = {
  info: "text-slate-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-pink-400",
} as const;

const LOG_PREFIXES = {
  info: "·",
  success: "✓",
  warning: "!",
  error: "✗",
} as const;

function AgentStatusIcon({
  status,
}: {
  status: "pending" | "running" | FindingSeverity;
}) {
  if (status === "pending") {
    return <Circle className="h-3.5 w-3.5 text-slate-600" />;
  }

  if (status === "running") {
    return (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
    );
  }

  if (status === "PASS") {
    return (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    );
  }

  if (status === "CRITICAL") {
    return (
      <AlertTriangle className="h-3.5 w-3.5 text-pink-400" />
    );
  }

  if (status === "HIGH") {
    return (
      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
    );
  }

  if (status === "MEDIUM") {
    return (
      <Info className="h-3.5 w-3.5 text-cyan-400" />
    );
  }

  return (
    <Info className="h-3.5 w-3.5 text-slate-500" />
  );
}

function agentStatusColor(
  status: "pending" | "running" | FindingSeverity
): string {
  if (status === "pending") {
    return "text-slate-500";
  }

  if (status === "running") {
    return "text-cyan-400";
  }

  if (status === "PASS") {
    return "text-emerald-400";
  }

  if (status === "CRITICAL") {
    return "text-pink-400";
  }

  if (status === "HIGH") {
    return "text-amber-400";
  }

  if (status === "MEDIUM") {
    return "text-cyan-300";
  }

  return "text-slate-400";
}

const CATEGORIES: AgentCategory[] = [
  "validation",
  "security",
  "performance",
  "alerting",
];

/* ─────────────────────────────────────────────────────────────
 * ScanTerminal
 * ───────────────────────────────────────────────────────────── */

export function ScanTerminal() {
  const {
    showTerminal,
    setShowTerminal,
    isScanRunning,
    scanProgressValue,
    scanLogs,
    agentScanStatuses,
    selectedAgents,
    scanTargets,
    lastScanMeta,
  } = useScan();

  console.log("Turbo Log ~ ScanTerminal ~ scanLogs:", scanLogs);

  const [, navigate] = useLocation();

  const [countdown, setCountdown] =
    useState<number | null>(null);

  const [activeAgent, setActiveAgent] =
    useState<AgentKey | null>(null);

  /*
   * System messages are not agents.
   *
   * They have no agentName / agentKey.
   * They are therefore rendered separately.
   */
  const systemLogs = useMemo(() => {
    return scanLogs.filter(
      (log) =>
        !log.agentKey &&
        !log.agentLabel
    );
  }, [scanLogs]);

  /*
   * Track which system message is expanded.
   */
  const [expandedSystemLogs, setExpandedSystemLogs] =
    useState<Set<string>>(new Set());

  /*
   * false:
   * Automatically follow newest agent.
   *
   * true:
   * User manually selected an agent.
   */
  const [userSelectedAgent, setUserSelectedAgent] =
    useState(false);

  const previousLogCountRef = useRef(0);

  const logEndRef =
    useRef<HTMLDivElement | null>(null);

  const agentRefs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  /* ────────────────────────────────────────────────
   * Ordered agents
   * ──────────────────────────────────────────────── */

  const orderedAgents = useMemo(() => {
    return AGENTS
      .filter((agent) =>
        selectedAgents.has(agent.key)
      )
      .sort(
        (a, b) =>
          agentPriority[a.key] -
          agentPriority[b.key]
      );
  }, [selectedAgents]);

  /* ────────────────────────────────────────────────
   * Group logs by agent
   *
   * SYSTEM LOGS ARE EXCLUDED.
   * ──────────────────────────────────────────────── */

  const logsByAgent = useMemo(() => {
    const groups = new Map<
      AgentKey,
      typeof scanLogs
    >();

    for (const log of scanLogs) {
      /*
       * No agentName / agentKey means this is
       * a system message.
       */
      if (
        !log.agentKey &&
        !log.agentLabel
      ) {
        continue;
      }

      const agentKey =
        log.agentKey as AgentKey;

      const existing =
        groups.get(agentKey);

      if (existing) {
        existing.push(log);
      } else {
        groups.set(agentKey, [log]);
      }
    }

    return groups;
  }, [scanLogs]);

  /* ────────────────────────────────────────────────
   * Latest agent
   *
   * IMPORTANT:
   *
   * Ignore system messages when determining
   * the latest agent.
   * ──────────────────────────────────────────────── */

  const latestAgent = useMemo(() => {
    for (
      let i = scanLogs.length - 1;
      i >= 0;
      i--
    ) {
      const log = scanLogs[i];

      if (
        log.agentKey ||
        log.agentLabel
      ) {
        return log.agentKey as AgentKey;
      }
    }

    return null;
  }, [scanLogs]);

  /* ────────────────────────────────────────────────
   * Automatically follow newest agent
   * ──────────────────────────────────────────────── */

  useEffect(() => {
    if (!latestAgent) {
      return;
    }

    if (userSelectedAgent) {
      return;
    }

    setActiveAgent(latestAgent);
  }, [
    latestAgent,
    userSelectedAgent,
  ]);

  /* ────────────────────────────────────────────────
   * Scroll to newest message
   * ──────────────────────────────────────────────── */

  useEffect(() => {
    if (
      scanLogs.length <=
      previousLogCountRef.current
    ) {
      return;
    }

    previousLogCountRef.current =
      scanLogs.length;

    requestAnimationFrame(() => {
      logEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [scanLogs]);

  /* ────────────────────────────────────────────────
   * Reset terminal when a NEW scan starts
   * ──────────────────────────────────────────────── */

  useEffect(() => {
    if (
      isScanRunning &&
      scanLogs.length === 0
    ) {
      setActiveAgent(null);
      setUserSelectedAgent(false);
      setExpandedSystemLogs(new Set());
      previousLogCountRef.current = 0;
    }
  }, [
    isScanRunning,
    scanLogs.length,
  ]);

  /* ────────────────────────────────────────────────
   * Agent selection
   * ──────────────────────────────────────────────── */

  const handleAgentSelect = (
    agentKey: AgentKey
  ) => {
    setActiveAgent(agentKey);

    setUserSelectedAgent(true);

    requestAnimationFrame(() => {
      logEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  };

  /* ────────────────────────────────────────────────
   * System message selection
   * ──────────────────────────────────────────────── */

  const toggleSystemLog = (
    logId: string
  ) => {
    setExpandedSystemLogs((previous) => {
      const next = new Set(previous);

      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }

      return next;
    });
  };

  /* ────────────────────────────────────────────────
   * Unread agent
   * ──────────────────────────────────────────────── */

  const unreadAgent =
    userSelectedAgent &&
      latestAgent &&
      latestAgent !== activeAgent
      ? latestAgent
      : null;

  /* ────────────────────────────────────────────────
   * Active agent metadata
   * ──────────────────────────────────────────────── */

  const activeAgentData = activeAgent
    ? AGENTS.find(
      (agent) =>
        agent.key === activeAgent
    )
    : null;

  /* ────────────────────────────────────────────────
   * Active agent logs
   * ──────────────────────────────────────────────── */

  const activeAgentEntries = activeAgent
    ? logsByAgent.get(activeAgent) ?? []
    : [];

  /* ────────────────────────────────────────────────
   * Completion countdown
   * ──────────────────────────────────────────────── */

  useEffect(() => {
    if (
      !isScanRunning &&
      lastScanMeta &&
      showTerminal
    ) {
      setCountdown(3);
    }
  }, [
    isScanRunning,
    lastScanMeta,
    showTerminal,
  ]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown === 0) {
      setShowTerminal(false);
      navigate("/dashboard/insights");
      return;
    }

    const timeout = setTimeout(() => {
      setCountdown((current) =>
        current === null
          ? null
          : current - 1
      );
    }, 1000);

    return () =>
      clearTimeout(timeout);
  }, [
    countdown,
    navigate,
    setShowTerminal,
  ]);

  /* ────────────────────────────────────────────────
   * Completion state
   * ──────────────────────────────────────────────── */

  const isComplete =
    !isScanRunning &&
    lastScanMeta !== null;

  const totalAgents =
    selectedAgents.size;

  /* ────────────────────────────────────────────────
   * Render
   * ──────────────────────────────────────────────── */

  return (
    <AnimatePresence>
      {showTerminal && (
        <motion.div
          key="scan-terminal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{
              scale: 0.95,
              y: 20,
            }}
            animate={{
              scale: 1,
              y: 0,
            }}
            exit={{
              scale: 0.95,
              y: 20,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
            }}
            className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0d1117] shadow-2xl"
          >
            {/* ─────────────────────────────────────
             * Header
             * ───────────────────────────────────── */}

            <div className="flex items-center gap-3 border-b border-slate-700/60 bg-[#161b22] px-5 py-3">
              <div className="flex items-center gap-2">
                <ScanLine
                  className={`h-4 w-4 ${isScanRunning
                    ? "animate-pulse text-cyan-400"
                    : isComplete
                      ? "text-emerald-400"
                      : "text-slate-400"
                    }`}
                />

                <span className="font-mono text-sm font-semibold text-white">
                  {isComplete
                    ? "Scan Complete"
                    : isScanRunning
                      ? "Agent Scan — Running"
                      : "Agent Scan"}
                </span>
              </div>

              <div className="ml-2 flex items-center gap-2">
                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  {scanTargets.length} target
                  {scanTargets.length !== 1
                    ? "s"
                    : ""}
                </span>

                <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  {totalAgents} agent
                  {totalAgents !== 1
                    ? "s"
                    : ""}
                </span>

                {/* System message count */}

                {systemLogs.length > 0 && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                    {systemLogs.length} system
                  </span>
                )}
              </div>

              {isComplete && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  className="ml-auto flex items-center gap-3"
                >
                  <span className="font-mono text-xs text-slate-400">
                    Redirecting to Insights in{" "}
                    <span className="font-bold text-emerald-400">
                      {countdown}s
                    </span>
                  </span>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 border border-emerald-500/40 bg-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-500/30"
                    onClick={() => {
                      setCountdown(null);
                      setShowTerminal(false);
                      navigate(
                        "/dashboard/insights"
                      );
                    }}
                  >
                    View Insights

                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}

              <button
                title="Close"
                onClick={() => {
                  setShowTerminal(false);
                  setCountdown(null);
                }}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-700/50 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ─────────────────────────────────────
             * Body
             * ───────────────────────────────────── */}

            <div className="flex flex-1 overflow-hidden">

              {/* ───────────────────────────────────
               * Left: Agent navigation
               * ─────────────────────────────────── */}

              <div className="w-[220px] shrink-0 overflow-y-auto border-r border-slate-700/60 bg-[#0d1117] p-3">

                {/* System section */}

                {systemLogs.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center gap-1.5 px-1">
                      <Terminal className="h-3 w-3 text-slate-600" />

                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-600">
                        System
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {systemLogs.map(
                        (log) => {
                          const expanded =
                            expandedSystemLogs.has(
                              log.id
                            );

                          return (
                            <button
                              key={log.id}
                              type="button"
                              onClick={() =>
                                toggleSystemLog(
                                  log.id
                                )
                              }
                              className={`
                                flex w-full items-center gap-2
                                rounded-lg px-2 py-1.5
                                text-left transition
                                text-slate-600
                                hover:bg-slate-800/50
                                hover:text-slate-400
                              `}
                            >
                              <Terminal className="h-3 w-3 shrink-0" />

                              <span className="min-w-0 flex-1 truncate font-mono text-[9px]">
                                {log.message}
                              </span>

                              {expanded ? (
                                <ChevronUp className="h-3 w-3 shrink-0 text-slate-600" />
                              ) : (
                                <ChevronDown className="h-3 w-3 shrink-0 text-slate-700" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Agent sections */}

                {CATEGORIES.map((cat) => {
                  const meta =
                    categoryMeta[cat];

                  const CatIcon =
                    meta.icon;

                  const catAgents =
                    orderedAgents.filter(
                      (agent) =>
                        agent.category ===
                        cat
                    );

                  if (
                    catAgents.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={cat}
                      className="mb-3"
                    >
                      <div className="mb-1.5 flex items-center gap-1.5 px-1">
                        <CatIcon
                          className={`h-3 w-3 ${meta.color}`}
                        />

                        <span
                          className={`font-mono text-[9px] font-bold uppercase tracking-widest ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {catAgents.map(
                          (agent) => {
                            const status =
                              agentScanStatuses[
                              agent.key
                              ] ??
                              "pending";

                            const messageCount =
                              logsByAgent.get(
                                agent.key
                              )?.length ??
                              0;

                            const isActive =
                              activeAgent ===
                              agent.key;

                            const hasNewMessage =
                              unreadAgent ===
                              agent.key;

                            return (
                              <button
                                key={
                                  agent.key
                                }
                                type="button"
                                onClick={() =>
                                  handleAgentSelect(
                                    agent.key
                                  )
                                }
                                className={`
                                  flex w-full items-center gap-2
                                  rounded-lg px-2 py-1.5
                                  text-left transition
                                  ${isActive
                                    ? "bg-cyan-500/15 ring-1 ring-cyan-500/30"
                                    : "hover:bg-slate-700/30"
                                  }
                                `}
                              >
                                <AgentStatusIcon
                                  status={
                                    status
                                  }
                                />

                                <span
                                  className={`
                                    min-w-0 flex-1 truncate
                                    font-mono text-[10px]
                                    ${isActive
                                      ? "text-cyan-300"
                                      : agentStatusColor(
                                        status
                                      )
                                    }
                                  `}
                                >
                                  {
                                    agent.label
                                  }
                                </span>

                                {hasNewMessage && (
                                  <span
                                    title="New message"
                                    className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400"
                                  />
                                )}

                                {messageCount >
                                  0 && (
                                    <span
                                      className={`
                                      flex min-w-[18px]
                                      items-center justify-center
                                      rounded-full px-1
                                      font-mono text-[8px]
                                      ${isActive
                                          ? "bg-cyan-400/20 text-cyan-300"
                                          : "bg-slate-700/60 text-slate-500"
                                        }
                                    `}
                                    >
                                      {
                                        messageCount
                                      }
                                    </span>
                                  )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ───────────────────────────────────
               * Right: Agent log viewer
               * ─────────────────────────────────── */}

              <div className="relative flex-1 overflow-y-auto bg-[#0d1117] p-4 font-mono text-xs">

                {/* ─────────────────────────────────
                 * SYSTEM MESSAGES
                 *
                 * These are always visible.
                 * They are intentionally subtle.
                 *
                 * Clicking one expands the raw
                 * response information.
                 * ───────────────────────────────── */}

                {systemLogs.length > 0 && (
                  <div className="mb-5 space-y-1.5">
                    {systemLogs.map(
                      (log) => {
                        const expanded =
                          expandedSystemLogs.has(
                            log.id
                          );

                        return (
                          <motion.div
                            key={log.id}
                            initial={{
                              opacity: 0,
                            }}
                            animate={{
                              opacity: 1,
                            }}
                            className="overflow-hidden rounded-lg border border-slate-800/50 bg-slate-900/30"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggleSystemLog(
                                  log.id
                                )
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-800/40"
                            >
                              <Terminal className="h-3 w-3 shrink-0 text-slate-700" />

                              <span className="shrink-0 text-[9px] uppercase tracking-wider text-slate-700">
                                system
                              </span>

                              <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600">
                                {log.message}
                              </span>

                              {expanded ? (
                                <ChevronUp className="h-3 w-3 shrink-0 text-slate-700" />
                              ) : (
                                <ChevronDown className="h-3 w-3 shrink-0 text-slate-700" />
                              )}
                            </button>

                            {expanded && (
                              <div className="border-t border-slate-800/50 px-3 py-3">
                                <div className="mb-2 text-[9px] uppercase tracking-wider text-slate-700">
                                  System Event
                                </div>

                                <p className="mb-3 text-[10px] leading-relaxed text-slate-500">
                                  {log.message}
                                </p>

                                <div className="space-y-1 text-[9px] text-slate-700">
                                  <div>
                                    <span className="text-slate-800">
                                      Log ID:
                                    </span>{" "}
                                    {log.id}
                                  </div>

                                  <div>
                                    <span className="text-slate-800">
                                      Added:
                                    </span>{" "}
                                    {new Date(
                                      log.addedAt
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                )}

                {/* ─────────────────────────────────
                 * New message notification
                 * ───────────────────────────────── */}

                {unreadAgent && (
                  <motion.button
                    initial={{
                      opacity: 0,
                      y: -8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    type="button"
                    onClick={() => {
                      handleAgentSelect(
                        unreadAgent
                      );
                    }}
                    className="sticky top-0 z-10 mx-auto mb-4 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] text-cyan-300 shadow-lg backdrop-blur"
                  >
                    <MessageSquare className="h-3 w-3" />

                    <span>
                      New message from{" "}
                      {AGENTS.find(
                        (agent) =>
                          agent.key ===
                          unreadAgent
                      )?.label ??
                        unreadAgent}
                    </span>

                    <ChevronRight className="h-3 w-3" />
                  </motion.button>
                )}

                {/* ─────────────────────────────────
                 * Empty state
                 *
                 * Only show it when there are
                 * literally NO logs at all.
                 * ───────────────────────────────── */}

                {scanLogs.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ScanLine className="mx-auto mb-3 h-6 w-6 text-slate-700" />

                      <p className="font-mono text-xs text-slate-600">
                        Waiting for agents to start...
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-slate-700">
                        Agent messages will appear here.
                      </p>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────
                 * ACTIVE AGENT
                 * ───────────────────────────────── */}

                {activeAgent && (
                  <>
                    {/* Agent header */}

                    <div
                      ref={(element) => {
                        agentRefs.current[
                          activeAgent
                        ] = element;
                      }}
                      className="mb-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-700/50" />

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${activeAgentData
                            ? categoryMeta[
                              activeAgentData
                                .category
                            ].color
                            : "text-cyan-400"
                            }`}
                        >
                          {activeAgentData?.label ??
                            activeAgent}
                        </span>

                        <div className="h-px flex-1 bg-slate-700/50" />
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <AgentStatusIcon
                          status={
                            agentScanStatuses[
                            activeAgent
                            ] ??
                            "pending"
                          }
                        />

                        <span
                          className={`text-[9px] uppercase tracking-widest ${agentStatusColor(
                            agentScanStatuses[
                            activeAgent
                            ] ??
                            "pending"
                          )}`}
                        >
                          {agentScanStatuses[
                            activeAgent
                          ] ??
                            "pending"}
                        </span>
                      </div>
                    </div>

                    {/* No messages for this agent */}

                    {activeAgentEntries.length ===
                      0 && (
                        <p className="py-8 text-center text-slate-600 italic">
                          Waiting for this agent to send
                          messages...
                        </p>
                      )}

                    {/* Agent messages */}

                    {activeAgentEntries.map(
                      (entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{
                            opacity: 0,
                            x: -6,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            duration: 0.15,
                            delay:
                              index * 0.03,
                          }}
                          className={`flex items-start gap-2 py-0.5 ${LOG_COLORS[entry.level]}`}
                        >
                          <span className="shrink-0 select-none opacity-60">
                            {
                              LOG_PREFIXES[
                              entry.level
                              ]
                            }
                          </span>

                          <span className="leading-relaxed">
                            {entry.message}
                          </span>
                        </motion.div>
                      )
                    )}

                    <div ref={logEndRef} />

                    {isScanRunning &&
                      activeAgent ===
                      latestAgent && (
                        <span className="mt-1 inline-block h-3.5 w-2 animate-pulse bg-cyan-400 opacity-80" />
                      )}
                  </>
                )}

                {/* ─────────────────────────────────
                 * Completion banner
                 * ───────────────────────────────── */}

                {isComplete && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center"
                  >
                    <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />

                    <p className="font-bold text-emerald-400">
                      Scan complete
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {totalAgents} agents ran in{" "}
                      {(
                        (lastScanMeta?.duration ??
                          0) /
                        1000
                      ).toFixed(1)}
                      s against{" "}
                      {lastScanMeta?.targets
                        .length ?? 0}{" "}
                      targets.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ─────────────────────────────────────
             * Footer progress
             * ───────────────────────────────────── */}

            <div className="border-t border-slate-700/60 bg-[#161b22] px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">
                    {isComplete
                      ? `${totalAgents}/${totalAgents} agents complete`
                      : `Scanning: ${Object.values(
                        agentScanStatuses
                      ).filter(
                        (status) =>
                          status !==
                          "pending"
                      ).length
                      } / ${totalAgents}`}
                  </span>
                </div>

                <span className="font-mono text-[10px] font-bold tabular-nums text-slate-400">
                  {isComplete
                    ? "100%"
                    : `${scanProgressValue}%`}
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))",
                  }}
                  animate={{
                    width: `${isComplete
                      ? 100
                      : scanProgressValue
                      }%`,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}