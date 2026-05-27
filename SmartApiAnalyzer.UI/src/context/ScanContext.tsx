import React, { createContext, useContext, useState, useCallback } from "react";
import { PRESETS } from "@/data/agentCatalog";
import type { AgentKey, AgentCategory, FindingSeverity } from "@/data/agentCatalog";

/* ─── notification types ─── */
export type NotifType = "error" | "warning" | "success" | "info";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  action?: { label: string; href: string };
  createdAt: number;
  duration: number;
}

/* ─── scan terminal types ─── */
export interface ScanLogEntry {
  id: string;
  agentKey: string;
  agentLabel: string;
  category: AgentCategory;
  level: "info" | "success" | "warning" | "error";
  message: string;
  addedAt: number;
}

export interface LastScanMeta {
  targets: string[];
  completedAt: string;
  totalAgents: number;
  duration: number; // ms
}

/* ─── context shape ─── */
interface ScanContextValue {
  /* agent selection */
  selectedAgents: Set<AgentKey>;
  setSelectedAgents: (agents: Set<AgentKey>) => void;
  toggleAgent: (key: AgentKey) => void;
  activePreset: string;
  setActivePreset: (id: string) => void;

  /* scan targets */
  scanTargets: string[];
  addScanTarget: (url: string) => void;
  removeScanTarget: (url: string) => void;
  clearScanTargets: () => void;

  /* mission brief drawer */
  briefOpen: boolean;
  setBriefOpen: (open: boolean) => void;

  /* notifications */
  notifications: AppNotification[];
  notify: (n: Omit<AppNotification, "id" | "createdAt" | "duration"> & { duration?: number }) => void;
  dismiss: (id: string) => void;

  /* scan terminal overlay */
  showTerminal: boolean;
  setShowTerminal: (v: boolean) => void;
  isScanRunning: boolean;
  setIsScanRunning: (v: boolean) => void;
  scanProgressValue: number;
  setScanProgressValue: (v: number) => void;
  currentScanAgentKey: string;
  setCurrentScanAgentKey: (v: string) => void;
  agentScanStatuses: Record<string, "pending" | "running" | FindingSeverity>;
  setAgentScanStatuses: React.Dispatch<React.SetStateAction<Record<string, "pending" | "running" | FindingSeverity>>>;
  scanLogs: ScanLogEntry[];
  addScanLog: (e: Omit<ScanLogEntry, "id" | "addedAt">) => void;
  clearScanLogs: () => void;

  /* last scan results */
  lastScanResults: Array<{ agentKey: string; agentLabel: string; category: AgentCategory; status: FindingSeverity; findings: number; detail: string }>;
  setLastScanResults: (r: ScanContextValue["lastScanResults"]) => void;
  lastScanMeta: LastScanMeta | null;
  setLastScanMeta: (m: LastScanMeta | null) => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

/* ─── provider ─── */
export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgents, setSelectedAgents] = useState<Set<AgentKey>>(
    new Set(PRESETS[0].agents)
  );
  const [activePreset, setActivePreset] = useState("full");
  const [scanTargets, setScanTargets] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  /* terminal state */
  const [showTerminal, setShowTerminal] = useState(false);
  const [isScanRunning, setIsScanRunning] = useState(false);
  const [scanProgressValue, setScanProgressValue] = useState(0);
  const [currentScanAgentKey, setCurrentScanAgentKey] = useState("");
  const [agentScanStatuses, setAgentScanStatuses] = useState<Record<string, "pending" | "running" | FindingSeverity>>({});
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);

  /* last scan results */
  const [lastScanResults, setLastScanResults] = useState<ScanContextValue["lastScanResults"]>([]);
  const [lastScanMeta, setLastScanMeta] = useState<LastScanMeta | null>(null);

  /* agent selection */
  const toggleAgent = useCallback((key: AgentKey) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setActivePreset("custom");
  }, []);

  /* targets */
  const addScanTarget = useCallback((url: string) => {
    const t = url.trim();
    if (!t) return;
    setScanTargets((prev) => (prev.includes(t) ? prev : [...prev, t]));
  }, []);
  const removeScanTarget = useCallback((url: string) => {
    setScanTargets((prev) => prev.filter((u) => u !== url));
  }, []);
  const clearScanTargets = useCallback(() => setScanTargets([]), []);

  /* notifications */
  const notify = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "duration"> & { duration?: number }) => {
      const duration =
        n.duration !== undefined ? n.duration
        : n.type === "error"   ? 0
        : n.type === "warning" ? 7000
        : 4500;
      const notification: AppNotification = {
        ...n, duration, id: crypto.randomUUID(), createdAt: Date.now(),
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 6));
    },
    []
  );
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /* scan logs */
  const addScanLog = useCallback((e: Omit<ScanLogEntry, "id" | "addedAt">) => {
    setScanLogs((prev) => [
      ...prev,
      { ...e, id: crypto.randomUUID(), addedAt: Date.now() },
    ]);
  }, []);
  const clearScanLogs = useCallback(() => setScanLogs([]), []);

  return (
    <ScanContext.Provider
      value={{
        selectedAgents, setSelectedAgents, toggleAgent, activePreset, setActivePreset,
        scanTargets, addScanTarget, removeScanTarget, clearScanTargets,
        briefOpen, setBriefOpen,
        notifications, notify, dismiss,
        showTerminal, setShowTerminal,
        isScanRunning, setIsScanRunning,
        scanProgressValue, setScanProgressValue,
        currentScanAgentKey, setCurrentScanAgentKey,
        agentScanStatuses, setAgentScanStatuses,
        scanLogs, addScanLog, clearScanLogs,
        lastScanResults, setLastScanResults,
        lastScanMeta, setLastScanMeta,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

/* ─── hook ─── */
export function useScan(): ScanContextValue {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used inside <ScanProvider>");
  return ctx;
}
