import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

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

/* ============================================================
 * TYPES
 * ============================================================ */

type LogLevel =
  | "info"
  | "success"
  | "critical"
  | "warning"
  | "error";

type NormalizedScanLog = {
  id: string;

  message: string;

  level: LogLevel;

  agentKey?: AgentKey | null;

  agentLabel?: string | null;

  agentName?: string | null;

  resolvedAgentKey: AgentKey | null;

  resolvedAgentName: string | null;

  endpointRoute: string | null;

  addedAt?: string | Date;

  [key: string]: unknown;
};

/* ============================================================
 * LOG STYLING
 * ============================================================ */

const LOG_COLORS: Record<LogLevel, string> = {
  info: "text-slate-400",
  success: "text-emerald-400",
  critical: "text-red-500",
  warning: "text-amber-400",
  error: "text-pink-400",
};

const LOG_PREFIXES: Record<LogLevel, string> = {
  info: "·",
  success: "✓",
  critical: "✕",
  warning: "!",
  error: "✗",
};

/* ============================================================
 * AGENT STATUS ICON
 * ============================================================ */

function AgentStatusIcon({
  status,
}: {
  status:
  | "pending"
  | "running"
  | FindingSeverity;
}) {
  if (status === "pending") {
    return (
      <Circle className="h-3.5 w-3.5 text-slate-600" />
    );
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

/* ============================================================
 * AGENT STATUS COLOR
 * ============================================================ */

function agentStatusColor(
  status:
    | "pending"
    | "running"
    | FindingSeverity
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

/* ============================================================
 * CATEGORIES
 * ============================================================ */

const CATEGORIES: AgentCategory[] = [
  "validation",
  "security",
  "performance",
  "alerting",
];

/* ============================================================
 * NORMALIZE AGENT NAME
 * ============================================================ */

function normalizeAgentName(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/* ============================================================
 * RESOLVE BACKEND AGENT -> FRONTEND AGENT KEY
 * ============================================================ */

function resolveAgentKey(
  agentName: unknown,
  agentKey: unknown
): AgentKey | null {
  /*
   * First try the explicit agentKey.
   */

  if (
    typeof agentKey === "string" &&
    agentKey.trim()
  ) {
    const directMatch = AGENTS.find(
      (agent) =>
        agent.key.toLowerCase() ===
        agentKey.trim().toLowerCase()
    );

    if (directMatch) {
      return directMatch.key;
    }
  }

  /*
   * Then try the backend agent name.
   */

  const normalizedName =
    normalizeAgentName(agentName);

  if (!normalizedName) {
    return null;
  }

  const matchedAgent = AGENTS.find(
    (agent) => {
      const normalizedKey =
        normalizeAgentName(agent.key);

      const normalizedLabel =
        normalizeAgentName(agent.label);

      return (
        normalizedKey === normalizedName ||
        normalizedLabel === normalizedName
      );
    }
  );

  return matchedAgent?.key ?? null;
}

/* ============================================================
 * GET ENDPOINT ROUTE
 * ============================================================ */

function getEndpointRoute(
  log: any
): string | null {
  const route =
    log?.websiteUrl?.route ??
    log?.payload?.websiteUrl?.route ??
    log?.route ??
    log?.endpoint ??
    null;

  if (
    typeof route !== "string" ||
    route.trim() === ""
  ) {
    return null;
  }

  return route.trim();
}

/* ============================================================
 * NORMALIZE LOG LEVEL
 * ============================================================ */

function normalizeLogLevel(
  value: unknown
): LogLevel {
  if (
    value === "success" ||
    value === "critical" ||
    value === "warning" ||
    value === "error"
  ) {
    return value;
  }

  return "info";
}

/* ============================================================
 * CREATE LOG ID
 *
 * Backend should ideally provide an ID.
 * This gives the frontend a fallback.
 * ============================================================ */

function getLogId(
  log: any,
  index: number
): string {
  if (
    typeof log?.id === "string" &&
    log.id.trim()
  ) {
    return log.id;
  }

  return [
    log?.agentName ?? "",
    log?.agentKey ?? "",
    log?.message ?? "",
    log?.addedAt ?? "",
    index,
  ].join("|");
}

/* ============================================================
 * SCAN TERMINAL
 * ============================================================ */

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

  const [, navigate] = useLocation();

  /* ==========================================================
   * STATE
   * ========================================================== */

  const [countdown, setCountdown] =
    useState<number | null>(null);

  const [activeAgent, setActiveAgent] =
    useState<AgentKey | null>(null);

  const [
    expandedSystemLogs,
    setExpandedSystemLogs,
  ] = useState<Set<string>>(
    new Set()
  );

  /*
   * Tracks the identity of the last realtime
   * log that caused an automatic agent switch.
   */
  const lastProcessedLogRef =
    useRef<string | null>(null);

  /*
   * Used when scrolling to the latest message.
   */
  const logEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Optional refs for agents.
   */
  const agentRefs = useRef<
    Record<
      string,
      HTMLDivElement | null
    >
  >({});

  /* ==========================================================
   * ORDERED AGENTS
   *
   * This is ONLY for sidebar ordering.
   *
   * It does NOT determine which agent is active.
   * ========================================================== */

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

  /* ==========================================================
   * NORMALIZE LOGS
   *
   * IMPORTANT:
   *
   * We intentionally DO NOT use:
   *
   * useMemo(..., [scanLogs])
   *
   * here.
   *
   * This makes the terminal resilient if the context
   * happens to recreate/update the log collection.
   * ========================================================== */

  const normalizedLogs =
    scanLogs.map(
      (
        log: any,
        index: number
      ): NormalizedScanLog => {
        const resolvedAgentKey =
          resolveAgentKey(
            log?.agentName,
            log?.agentKey
          );

        const endpointRoute =
          getEndpointRoute(log);

        const level =
          normalizeLogLevel(
            log?.level
          );

        return {
          ...log,

          id: getLogId(
            log,
            index
          ),

          level,

          resolvedAgentKey,

          resolvedAgentName:
            log?.agentName ??
            log?.agentLabel ??
            null,

          endpointRoute,
        };
      }
    );

  /* ==========================================================
   * LATEST LOG
   *
   * THIS IS THE IMPORTANT PART.
   *
   * The latest realtime message determines the active agent.
   * ========================================================== */

  const latestLog =
    normalizedLogs.length > 0
      ? normalizedLogs[
      normalizedLogs.length - 1
      ]
      : null;

  const latestAgent =
    latestLog?.resolvedAgentKey ??
    null;

  /* ==========================================================
   * SYSTEM LOGS
   * ========================================================== */

  const systemLogs = normalizedLogs.filter(
    (log) =>
      !log.resolvedAgentKey
  );

  /* ==========================================================
   * GROUP LOGS BY AGENT
   * ========================================================== */

  const logsByAgent = useMemo(() => {
    const groups = new Map<
      AgentKey,
      NormalizedScanLog[]
    >();

    /*
     * normalizedLogs is already ordered by
     * realtime arrival order.
     */

    for (const log of normalizedLogs) {
      if (!log.resolvedAgentKey) {
        continue;
      }

      const existing =
        groups.get(
          log.resolvedAgentKey
        );

      if (existing) {
        existing.push(log);
      } else {
        groups.set(
          log.resolvedAgentKey,
          [log]
        );
      }
    }

    return groups;
  }, [scanLogs]);

  /* ==========================================================
   * AUTOMATIC AGENT MOVEMENT
   *
   * Whenever the newest realtime message belongs to
   * another agent, move the active sidebar selection.
   * ========================================================== */

  useEffect(() => {
    /*
     * No logs yet.
     */
    if (!latestLog) {
      return;
    }

    /*
     * We only care about logs that belong to an agent.
     */
    if (!latestLog.resolvedAgentKey) {
      return;
    }

    /*
     * Prevent processing the exact same event repeatedly.
     */
    if (
      lastProcessedLogRef.current ===
      latestLog.id
    ) {
      return;
    }

    /*
     * Mark this event as processed.
     */
    lastProcessedLogRef.current =
      latestLog.id;

    /*
     * THIS MOVES THE SIDEBAR.
     */
    setActiveAgent(
      latestLog.resolvedAgentKey
    );

    /*
     * Scroll after React renders the new
     * active agent messages.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        logEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    });
  }, [
    latestLog?.id,
    latestLog?.resolvedAgentKey,
  ]);

  /* ==========================================================
   * RESET WHEN NEW SCAN STARTS
   * ========================================================== */

  useEffect(() => {
    if (
      isScanRunning &&
      scanLogs.length === 0
    ) {
      setActiveAgent(null);

      setExpandedSystemLogs(
        new Set()
      );

      lastProcessedLogRef.current =
        null;
    }
  }, [
    isScanRunning,
    scanLogs.length,
  ]);

  /* ==========================================================
   * INITIAL ACTIVE AGENT
   *
   * If existing logs already exist when the terminal opens.
   * ========================================================== */

  useEffect(() => {
    if (
      !activeAgent &&
      latestAgent
    ) {
      setActiveAgent(
        latestAgent
      );
    }
  }, [
    activeAgent,
    latestAgent,
  ]);

  /* ==========================================================
   * MANUAL AGENT SELECTION
   *
   * Manual selection is temporary.
   *
   * The next realtime agent message will automatically
   * move the terminal again.
   * ========================================================== */

  const handleAgentSelect = (
    agentKey: AgentKey
  ) => {
    setActiveAgent(
      agentKey
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        logEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    });
  };

  /* ==========================================================
   * SYSTEM LOG TOGGLE
   * ========================================================== */

  const toggleSystemLog = (
    logId: string
  ) => {
    setExpandedSystemLogs(
      (previous) => {
        const next =
          new Set(previous);

        if (
          next.has(logId)
        ) {
          next.delete(logId);
        } else {
          next.add(logId);
        }

        return next;
      }
    );
  };

  /* ==========================================================
   * ACTIVE AGENT DATA
   * ========================================================== */

  const activeAgentData =
    activeAgent
      ? AGENTS.find(
        (agent) =>
          agent.key ===
          activeAgent
      )
      : null;

  /* ==========================================================
   * ACTIVE AGENT LOGS
   * ========================================================== */

  const activeAgentEntries =
    activeAgent
      ? logsByAgent.get(
        activeAgent
      ) ?? []
      : [];

  /* ==========================================================
   * COMPLETION COUNTDOWN
   * ========================================================== */

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

  /* ==========================================================
   * COUNTDOWN
   * ========================================================== */

  useEffect(() => {
    if (
      countdown === null
    ) {
      return;
    }

    if (
      countdown === 0
    ) {
      setShowTerminal(false);

      navigate(
        "/dashboard/insights"
      );

      return;
    }

    const timeout =
      setTimeout(() => {
        setCountdown(
          (current) =>
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

  /* ==========================================================
   * COMPLETION
   * ========================================================== */

  const isComplete =
    !isScanRunning &&
    lastScanMeta !== null;

  const totalAgents =
    selectedAgents.size;

  const completedAgents =
    orderedAgents.filter(
      (agent) => {
        const status =
          agentScanStatuses[
          agent.key
          ];

        return (
          status === "PASS" ||
          status === "CRITICAL" ||
          status === "HIGH" ||
          status === "MEDIUM"
        );
      }
    ).length;

  /* ==========================================================
   * RENDER
   * ========================================================== */

  return (
    <AnimatePresence>
      {showTerminal && (
        <motion.div
          key="scan-terminal"

          initial={{
            opacity: 0,
          }}

          animate={{
            opacity: 1,
          }}

          exit={{
            opacity: 0,
          }}

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

            {/* ==================================================
                HEADER
            ================================================== */}

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

            {/* ==================================================
                BODY
            ================================================== */}

            <div className="flex flex-1 overflow-hidden">

              {/* ==================================================
                  LEFT SIDEBAR
              ================================================== */}

              <div className="w-[220px] shrink-0 overflow-y-auto border-r border-slate-700/60 bg-[#0d1117] p-3">

                {/* SYSTEM */}

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

                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-800/50 hover:text-slate-400"
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

                {/* AGENT CATEGORIES */}

                {CATEGORIES.map(
                  (cat) => {
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
                      catAgents.length ===
                      0
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
                                    {agent.label}
                                  </span>

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
                                        {messageCount}
                                      </span>
                                    )}

                                </button>
                              );
                            }
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              {/* ==================================================
                  RIGHT LOG VIEWER
              ================================================== */}

              <div className="relative flex-1 overflow-y-auto bg-[#0d1117] p-4 font-mono text-xs">

                {/* SYSTEM MESSAGES */}

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

                                  {log.addedAt && (
                                    <div>
                                      <span className="text-slate-800">
                                        Added:
                                      </span>{" "}
                                      {new Date(
                                        log.addedAt
                                      ).toLocaleTimeString()}
                                    </div>
                                  )}

                                </div>

                              </div>
                            )}

                          </motion.div>
                        );
                      }
                    )}

                  </div>
                )}

                {/* EMPTY STATE */}

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

                {/* ==================================================
                    ACTIVE AGENT
                ================================================== */}

                {activeAgent && (
                  <>

                    {/* AGENT HEADER */}

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
                          {
                            agentScanStatuses[
                            activeAgent
                            ] ??
                            "pending"
                          }
                        </span>

                      </div>

                    </div>

                    {/* NO MESSAGES */}

                    {activeAgentEntries.length ===
                      0 && (
                        <p className="py-8 text-center text-slate-600 italic">
                          Waiting for this agent to send
                          messages...
                        </p>
                      )}

                    {/* AGENT MESSAGES */}

                    {activeAgentEntries.map(
                      (
                        entry,
                        index
                      ) => (
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
                              index *
                              0.03,
                          }}

                          className={`flex flex-col gap-1 py-1 ${LOG_COLORS[
                            entry.level
                          ]
                            }`}
                        >

                          <div className="flex items-start gap-2">

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

                          </div>

                          {entry.endpointRoute && (
                            <div className="ml-5 flex items-center gap-2 text-[9px] text-slate-600">

                              <span className="uppercase tracking-wider text-slate-700">
                                endpoint
                              </span>

                              <span className="truncate text-slate-500">
                                {
                                  entry.endpointRoute
                                }
                              </span>

                            </div>
                          )}

                        </motion.div>
                      )
                    )}

                    <div ref={logEndRef} />

                    {/* LIVE CURSOR */}

                    {isScanRunning &&
                      activeAgent ===
                      latestAgent && (
                        <span className="mt-1 inline-block h-3.5 w-2 animate-pulse bg-cyan-400 opacity-80" />
                      )}

                  </>
                )}

                {/* ==================================================
                    COMPLETION
                ================================================== */}

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

                      {
                        lastScanMeta?.targets
                          .length
                      }{" "}
                      targets.

                    </p>

                  </motion.div>
                )}

              </div>

            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="border-t border-slate-700/60 bg-[#161b22] px-5 py-3">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-2">

                  <span className="font-mono text-[10px] text-slate-500">

                    {isComplete
                      ? `${totalAgents}/${totalAgents} agents complete`
                      : `Scanning: ${completedAgents} / ${totalAgents}`}

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