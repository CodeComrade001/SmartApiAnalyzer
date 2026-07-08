import { useScan } from "@/context/ScanContext";

export type NotifyType = "success" | "error" | "warning" | "info";

const DEFAULT_TITLES: Record<NotifyType, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

/**
 * Thin wrapper around ScanContext's notify.
 * Usage: const notify = useNotify()
 *        notify("Endpoint saved", "success")
 *        notify("Invalid URL", "error", "Validation failed")   // optional custom title
 */
export function usePopUpNotify() {
  const { notify } = useScan();

  return (
    message: string,
    type: NotifyType = "info",
    title?: string,
  ) => {
    notify({ type, title: title ?? DEFAULT_TITLES[type], message });
  };
}
