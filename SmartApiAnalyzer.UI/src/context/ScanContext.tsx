import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import { PRESETS } from "@/data/agentCatalog";

import type {
  AgentKey,
  AgentCategory,
  FindingSeverity,
} from "@/data/agentCatalog";

import { WebsiteApiGroup } from "@/types";

/* ─── notification types ─── */

export type NotifType =
  | "error"
  | "warning"
  | "success"
  | "info";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  createdAt: number;
  duration: number;
}

/* ─── scan agent response ─── */

export type ScanAgentStatus =
  | "Pending"
  | "Running"
  | "Completed"
  | "Failed";

export interface ScanAgentResponse<TPayload = unknown> {
  scanId: string;
  agentName: string;
  status: ScanAgentStatus;
  message: string;
  success: boolean;
  payload: TPayload | null;
  timestamp: string;
  eventId: string;
}

/* ─── scan terminal types ─── */

export interface ScanLogEntry<TPayload = unknown> {
  id: string;

  agentKey: string;
  agentLabel: string;
  category: AgentCategory;

  level:
  | "info"
  | "success"
  | "warning"
  | "error";

  message: string;
  addedAt: number;

  /**
   * Original structured response received
   * from the backend for this scan event.
   */
  result?: ScanAgentResponse<TPayload>;
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
  setSelectedAgents: React.Dispatch<
    React.SetStateAction<Set<AgentKey>>
  >;
  toggleAgent: (key: AgentKey) => void;

  activePreset: string;
  setActivePreset: (id: string) => void;

  /* scan targets */
  scanTargets: WebsiteApiGroup[];
  addScanTarget: (website: WebsiteApiGroup) => void;
  removeScanTarget: (website: WebsiteApiGroup) => void;
  clearScanTargets: () => void;

  /* mission brief drawer */
  briefOpen: boolean;
  setBriefOpen: (open: boolean) => void;

  /* notifications */
  notifications: AppNotification[];

  notify: (
    n: Omit<
      AppNotification,
      "id" | "createdAt" | "duration"
    > & {
      duration?: number;
    }
  ) => void;

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

  agentScanStatuses: Record<
    string,
    "pending" | "running" | FindingSeverity
  >;

  setAgentScanStatuses: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        "pending" | "running" | FindingSeverity
      >
    >
  >;

  /*
   * Scan logs now contain both:
   *
   * 1. Display information
   * 2. The original structured backend response
   */
  scanLogs: ScanLogEntry[];

  addScanLog: (
    e: Omit<ScanLogEntry, "id" | "addedAt">
  ) => void;

  clearScanLogs: () => void;

  /* last scan results */
  lastScanResults: Array<{
    agentKey: string;
    agentLabel: string;
    category: AgentCategory;
    status: FindingSeverity;
    findings: number;
    detail: string;
  }>;

  setLastScanResults: (
    r: ScanContextValue["lastScanResults"]
  ) => void;

  lastScanMeta: LastScanMeta | null;

  setLastScanMeta: (
    m: LastScanMeta | null
  ) => void;
}

const ScanContext =
  createContext<ScanContextValue | null>(null);

/* ─── provider ─── */

export function ScanProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ─── agent selection ─── */

  const [selectedAgents, setSelectedAgents] =
    useState<Set<AgentKey>>(
      new Set(PRESETS[0].agents)
    );

  const [activePreset, setActivePreset] =
    useState("full");

  /* ─── scan targets ─── */

  const [scanTargets, setScanTargets] =
    useState<WebsiteApiGroup[]>([]);

  /* ─── mission brief ─── */

  const [briefOpen, setBriefOpen] =
    useState(false);

  /* ─── notifications ─── */

  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  /* ─── terminal state ─── */

  const [showTerminal, setShowTerminal] =
    useState(false);

  const [isScanRunning, setIsScanRunning] =
    useState(false);

  const [scanProgressValue, setScanProgressValue] =
    useState(0);

  const [currentScanAgentKey, setCurrentScanAgentKey] =
    useState("");

  const [agentScanStatuses, setAgentScanStatuses] =
    useState<
      Record<
        string,
        "pending" | "running" | FindingSeverity
      >
    >({});

  const [scanLogs, setScanLogs] =
    useState<ScanLogEntry[]>([]);

  /* ─── last scan results ─── */

  const [lastScanResults, setLastScanResults] =
    useState<
      ScanContextValue["lastScanResults"]
    >([]);

  const [lastScanMeta, setLastScanMeta] =
    useState<LastScanMeta | null>(null);

  /* ─── agent selection ─── */

  const toggleAgent = useCallback(
    (key: AgentKey) => {
      setSelectedAgents((prev) => {
        const next = new Set(prev);

        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }

        return next;
      });

      setActivePreset("custom");
    },
    []
  );

  /* ─── notifications ─── */

  const notify = useCallback(
    (
      n: Omit<
        AppNotification,
        "id" | "createdAt" | "duration"
      > & {
        duration?: number;
      }
    ) => {
      const duration =
        n.duration !== undefined
          ? n.duration
          : n.type === "error"
            ? 0
            : n.type === "warning"
              ? 7000
              : 4500;

      const notification: AppNotification = {
        ...n,
        duration,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };

      setNotifications((prev) =>
        [notification, ...prev].slice(0, 6)
      );
    },
    []
  );

  const dismiss = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      );
    },
    []
  );

  /* ─── scan targets ─── */

  const MAX_SCAN_TARGETS = 3;

  const addScanTarget = useCallback(
    (website: WebsiteApiGroup) => {
      setScanTargets((prev) => {
        /* Prevent duplicates */
        if (
          prev.some(
            (w) => w.id === website.id
          )
        ) {
          return prev;
        }

        /* Maximum reached */
        if (prev.length >= MAX_SCAN_TARGETS) {
          notify({
            type: "warning",
            title:
              "Maximum scan targets reached",
            message: `You can only add up to ${MAX_SCAN_TARGETS} scan targets.`,
            duration: 3000,
          });

          return prev;
        }

        return [...prev, website];
      });
    },
    [notify]
  );

  const removeScanTarget = useCallback(
    (website: WebsiteApiGroup) => {
      setScanTargets((prev) =>
        prev.filter(
          (w) => w.id !== website.id
        )
      );
    },
    []
  );

  const clearScanTargets = useCallback(() => {
    setScanTargets([]);
  }, []);

  /* ─── scan logs ─── */

  const addScanLog = useCallback(
    (
      e: Omit<ScanLogEntry, "id" | "addedAt">
    ) => {
      setScanLogs((prev) => [
        ...prev,
        {
          ...e,
          id: crypto.randomUUID(),
          addedAt: Date.now(),
        },
      ]);
    },
    []
  );

  const clearScanLogs = useCallback(() => {
    setScanLogs([]);
  }, []);

  /* ─── provider ─── */

  return (
    <ScanContext.Provider
      value={{
        /* agent selection */
        selectedAgents,
        setSelectedAgents,
        toggleAgent,
        activePreset,
        setActivePreset,

        /* scan targets */
        scanTargets,
        addScanTarget,
        removeScanTarget,
        clearScanTargets,

        /* mission brief */
        briefOpen,
        setBriefOpen,

        /* notifications */
        notifications,
        notify,
        dismiss,

        /* terminal */
        showTerminal,
        setShowTerminal,
        isScanRunning,
        setIsScanRunning,
        scanProgressValue,
        setScanProgressValue,
        currentScanAgentKey,
        setCurrentScanAgentKey,
        agentScanStatuses,
        setAgentScanStatuses,

        /* scan logs */
        scanLogs,
        addScanLog,
        clearScanLogs,

        /* last scan */
        lastScanResults,
        setLastScanResults,
        lastScanMeta,
        setLastScanMeta,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

/* ─── hook ─── */

export function useScan(): ScanContextValue {
  const ctx = useContext(ScanContext);

  if (!ctx) {
    throw new Error(
      "useScan must be used inside ScanProvider"
    );
  }

  return ctx;
}