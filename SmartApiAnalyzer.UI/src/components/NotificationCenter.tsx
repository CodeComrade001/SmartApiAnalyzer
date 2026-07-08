import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useScan } from "@/context/ScanContext";
import type { AppNotification, NotifType } from "@/context/ScanContext";

/* ─── per-type visual config ─── */
const typeConfig: Record<NotifType, {
  border: string;
  bg: string;
  iconBg: string;
  icon: typeof CheckCircle2;
  iconColor: string;
  bar: string;
  label: string;
}> = {
  success: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    bar: "bg-emerald-500",
    label: "Success",
  },
  error: {
    border: "border-pink-500/40",
    bg: "bg-pink-500/5",
    iconBg: "bg-pink-500/10",
    icon: AlertTriangle,
    iconColor: "text-pink-400",
    bar: "bg-pink-500",
    label: "Error",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    iconBg: "bg-amber-500/10",
    icon: AlertCircle,
    iconColor: "text-amber-400",
    bar: "bg-amber-500",
    label: "Warning",
  },
  info: {
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/5",
    iconBg: "bg-cyan-500/10",
    icon: Info,
    iconColor: "text-cyan-400",
    bar: "bg-cyan-500",
    label: "Info",
  },
};

/* ─── single notification card ─── */
function NotifCard({ n }: { n: AppNotification }) {
  const { dismiss } = useScan();
  const [, navigate] = useLocation();
  const cfg = typeConfig[n.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative w-[340px] overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl ${cfg.border} ${cfg.bg} bg-background/90`}
    >
      {/* auto-dismiss progress bar */}
      {n.duration > 0 && (
        <motion.div
          className={`absolute bottom-0 left-0 h-[2px] ${cfg.bar}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: n.duration / 1000, ease: "linear" }}
        />
      )}

      <div className="flex gap-3 p-4">
        {/* icon */}
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
          <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
        </div>

        {/* body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold ${cfg.iconColor}`}>{n.title}</p>
            {n.duration === 0 && (
              <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cfg.border} ${cfg.iconColor}`}>
                {cfg.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.message}</p>

          {n.action && (
            <button
              onClick={() => {
                dismiss(n.id);
                if (n.action?.href) navigate(n.action.href);
              }}
              className={`mt-2.5 flex items-center gap-1 text-[11px] font-medium underline underline-offset-2 transition hover:opacity-80 ${cfg.iconColor}`}
            >
              {n.action.label}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* close */}
        <button
          title="Close"
          onClick={() => dismiss(n.id)}
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-muted/40 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── container ─── */
export function NotificationCenter() {
  const { notifications, dismiss } = useScan();
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* auto-dismiss with proper timer management */
  useEffect(() => {
    for (const n of notifications) {
      if (n.duration > 0 && !timerRef.current[n.id]) {
        timerRef.current[n.id] = setTimeout(() => {
          dismiss(n.id);
          delete timerRef.current[n.id];
        }, n.duration);
      }
    }

    /* clean up timers for dismissed notifications */
    const activeIds = new Set(notifications.map((n) => n.id));
    for (const id of Object.keys(timerRef.current)) {
      if (!activeIds.has(id)) {
        clearTimeout(timerRef.current[id]);
        delete timerRef.current[id];
      }
    }
  }, [notifications, dismiss]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      for (const t of Object.values(timerRef.current)) clearTimeout(t);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col-reverse gap-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <NotifCard key={n.id} n={n} />
        ))}
      </AnimatePresence>
    </div>
  );
}
