import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";

/**
 * NavigationGuard
 * ---------------
 * Drop anywhere. When `when` is true it intercepts all in-app navigation
 * (wouter links, programmatic pushState) and browser-level unload (tab
 * close / refresh) and shows a blocking confirmation dialog.
 *
 * Props
 *   when        — boolean flag; guard is active when true
 *   message     — primary warning text (e.g. "You have unsaved changes")
 *   consequence — what will happen if the user leaves anyway
 *                 (falls back to a safe generic message)
 *   title       — optional dialog heading override
 */
export interface NavigationGuardProps {
  when: boolean;
  message?: string;
  consequence?: string;
  title?: string;
}

const DEFAULT_TITLE = "Are you sure you want to leave?";
const DEFAULT_MESSAGE = "You have unsaved changes on this page.";
const DEFAULT_CONSEQUENCE =
  "If you leave now, your unsaved changes will be permanently lost and cannot be recovered.";

export default function NavigationGuard({
  when,
  message = DEFAULT_MESSAGE,
  consequence = DEFAULT_CONSEQUENCE,
  title = DEFAULT_TITLE,
}: NavigationGuardProps) {
  const [open, setOpen] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!when) return;

    /* ── patch pushState so wouter link clicks get intercepted ── */
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) => {
      pendingNavRef.current = () => originalPushState(data, unused, url);
      setOpen(true);
    };

    window.history.replaceState = (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) => {
      pendingNavRef.current = () => originalReplaceState(data, unused, url);
      setOpen(true);
    };

    /* ── browser unload / tab close / hard refresh ── */
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [when, message]);

  /* user confirmed "Leave anyway" → execute the pending navigation */
  const handleLeave = () => {
    setOpen(false);
    const nav = pendingNavRef.current;
    pendingNavRef.current = null;
    if (nav) {
      /* defer one tick so the dialog closes before the route change */
      setTimeout(nav, 0);
    }
  };

  /* user chose "Stay" → discard the pending navigation */
  const handleStay = () => {
    pendingNavRef.current = null;
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(open: boolean) => { if (!open) handleStay(); }}>
      <AlertDialogContent className="max-w-md border-border bg-background/95 backdrop-blur-sm">
        <AlertDialogHeader>
          {/* icon row */}
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--brand-amber))]/30 bg-[hsl(var(--brand-amber))]/10">
              <ShieldAlert className="h-5 w-5 text-[hsl(var(--brand-amber))]" />
            </div>
            <AlertDialogTitle className="text-base leading-tight">
              {title}
            </AlertDialogTitle>
          </div>

          {/* primary message */}
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm text-foreground/90">{message}</p>

              {/* consequence callout */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl border border-[hsl(var(--brand-pink))]/30 bg-[hsl(var(--brand-pink))]/5 px-3 py-2.5"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand-pink))]" />
                  <p className="text-xs leading-relaxed text-[hsl(var(--brand-pink))]/90">
                    {consequence}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 gap-2">
          <Button
            size="sm"
            onClick={handleStay}
            className="flex-1 border-border/60 bg-muted/80 text-muted-foreground hover:bg-muted/60"
          >
            Stay on page
          </Button>
          <Button
            size="sm"
            onClick={handleLeave}
          >
            Leave anyway
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}