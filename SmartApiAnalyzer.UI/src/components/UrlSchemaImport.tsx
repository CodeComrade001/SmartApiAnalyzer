import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as yaml from "js-yaml";
import {
  UploadCloud,
  FileJson2,
  AlertTriangle,
  CheckCircle2,
  X,
  FileDown,
  Code2,
  Copy,
  Check,
} from "lucide-react";
import { HTTP_METHODS, type ApiEndpoint, type HttpMethod, type WebsiteApiGroup } from "@/types";

/** Sample schema shown to users so they know the exact shape a file should have. */
const SAMPLE_YAML = `domain: https://api.example.com
endpoints:
  - path: /users
    method: GET
    confidence: 95
  - path: /users/{id}
    method: GET
    confidence: 90
  - path: /orders
    method: POST
    confidence: 80
  - path: /orders/{id}
    method: PATCH
    confidence: 70
  - path: /orders/{id}
    method: DELETE
    confidence: 60
`;

const SAMPLE_JSON = JSON.stringify(
  {
    domain: "https://api.example.com",
    endpoints: [
      { path: "/users", method: "GET", confidence: 95 },
      { path: "/users/{id}", method: "GET", confidence: 90 },
      { path: "/orders", method: "POST", confidence: 80 },
      { path: "/orders/{id}", method: "PATCH", confidence: 70 },
      { path: "/orders/{id}", method: "DELETE", confidence: 60 },
    ],
  },
  null,
  2
);

/**
 * UrlSchemaImport
 * ----------------
 * Self-contained, drag-and-drop file importer.
 * Drop (or browse for) a .yaml/.yml/.json file describing a domain and its
 * endpoints, and it will parse + validate it, then hand back a
 * WebsiteApiGroup[] via onImport(). Fully independent — only needs the
 * onImport callback to be wired into a parent's state.
 *
 * Expected file shape (YAML or JSON, either a single object or an array):
 * {
 *   "domain": "https://api.example.com",   // also accepts "websiteUrl" / "url"
 *   "endpoints": [                          // also accepts "routes" / "paths"
 *     { "path": "/users", "method": "GET" },
 *     { "path": "/orders", "method": "POST", "confidence": 80 }
 *   ]
 * }
 */

interface Props {
  onImport: (groups: WebsiteApiGroup[]) => void;
}

interface RawEndpointLike {
  path?: unknown;
  inferredPath?: unknown;
  url?: unknown;
  route?: unknown;
  method?: unknown;
  confidence?: unknown;
  status?: unknown;
}

interface RawGroupLike {
  domain?: unknown;
  websiteUrl?: unknown;
  url?: unknown;
  endpoints?: unknown;
  routes?: unknown;
  paths?: unknown;
}

const VALID_METHODS = new Set<string>(HTTP_METHODS);
const VALID_STATUSES = new Set([
  "unverified",
  "verified",
  "ignored",
  "healthy",
  "degraded",
  "down",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Normalizes one raw endpoint object into a strict ApiEndpoint. Throws with a helpful message on bad data. */
function normalizeEndpoint(raw: unknown, groupIndex: number, endpointIndex: number): ApiEndpoint {
  if (!isPlainObject(raw)) {
    throw new Error(
      `Group ${groupIndex + 1}, endpoint ${endpointIndex + 1}: expected an object, got ${typeof raw}`
    );
  }
  const r = raw as RawEndpointLike;

  const pathValue = r.path ?? r.inferredPath ?? r.url ?? r.route;
  if (typeof pathValue !== "string" || pathValue.trim() === "") {
    throw new Error(
      `Group ${groupIndex + 1}, endpoint ${endpointIndex + 1}: missing or invalid "path" (also accepts "inferredPath", "url", "route")`
    );
  }

  const methodRaw = typeof r.method === "string" ? r.method.toUpperCase() : "";
  if (!VALID_METHODS.has(methodRaw)) {
    throw new Error(
      `Group ${groupIndex + 1}, endpoint ${endpointIndex + 1}: invalid "method" "${String(
        r.method
      )}" — must be one of ${HTTP_METHODS.join(", ")}`
    );
  }
  const method = methodRaw as HttpMethod;

  let confidence = 0;
  if (r.confidence !== undefined) {
    const n = Number(r.confidence);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      throw new Error(
        `Group ${groupIndex + 1}, endpoint ${endpointIndex + 1}: "confidence" must be a number between 0 and 100`
      );
    }
    confidence = n;
  }

  let status: ApiEndpoint["status"] = "unverified";
  if (r.status !== undefined) {
    if (typeof r.status !== "string" || !VALID_STATUSES.has(r.status)) {
      throw new Error(
        `Group ${groupIndex + 1}, endpoint ${endpointIndex + 1}: invalid "status" "${String(
          r.status
        )}"`
      );
    }
    status = r.status as ApiEndpoint["status"];
  }

  return {
    id: crypto.randomUUID(),
    inferredPath: pathValue.trim(),
    correctedPath: "",
    method,
    confidence,
    selected: true,
    status,
  };
}

/** Normalizes one raw group object into a strict WebsiteApiGroup. Throws with a helpful message on bad data. */
function normalizeGroup(raw: unknown, groupIndex: number): WebsiteApiGroup {
  if (!isPlainObject(raw)) {
    throw new Error(`Group ${groupIndex + 1}: expected an object, got ${typeof raw}`);
  }
  const r = raw as RawGroupLike;

  const domain = r.domain ?? r.websiteUrl ?? r.url;
  if (typeof domain !== "string" || domain.trim() === "") {
    throw new Error(
      `Group ${groupIndex + 1}: missing or invalid "domain" (also accepts "websiteUrl", "url")`
    );
  }

  const endpointsRaw = r.endpoints ?? r.routes ?? r.paths;
  if (!Array.isArray(endpointsRaw) || endpointsRaw.length === 0) {
    throw new Error(
      `Group ${groupIndex + 1}: missing or empty "endpoints" array (also accepts "routes", "paths")`
    );
  }

  return {
    id: crypto.randomUUID(),
    websiteUrl: domain.trim(),
    discoveredAt: new Date().toISOString(),
    endpoints: endpointsRaw.map((e, i) => normalizeEndpoint(e, groupIndex, i)),
  };
}

/** Parses raw file text (YAML or JSON) into a validated WebsiteApiGroup[]. Throws a descriptive Error on failure. */
export function parseSchemaFile(fileName: string, text: string): WebsiteApiGroup[] {
  if (!text.trim()) {
    throw new Error("File is empty.");
  }

  const isJson = /\.json$/i.test(fileName);
  let parsed: unknown;

  try {
    // js-yaml's safe load handles JSON too (JSON is valid YAML), but we
    // branch so JSON syntax errors get a JSON-flavored message.
    parsed = isJson ? JSON.parse(text) : yaml.load(text);
  } catch (err) {
    const kind = isJson ? "JSON" : "YAML";
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Malformed ${kind} — could not parse "${fileName}": ${detail}`);
  }

  if (parsed === null || parsed === undefined) {
    throw new Error(`"${fileName}" parsed to an empty document.`);
  }

  const rawGroups: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

  if (rawGroups.length === 0) {
    throw new Error(`"${fileName}" contains no domain entries.`);
  }

  return rawGroups.map((g, i) => normalizeGroup(g, i));
}

export default function UrlSchemaImport({ onImport }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [showSample, setShowSample] = useState(false);
  const [sampleFormat, setSampleFormat] = useState<"yaml" | "json">("yaml");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sampleText = sampleFormat === "yaml" ? SAMPLE_YAML : SAMPLE_JSON;

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(sampleText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("[UrlSchemaImport] Failed to copy sample to clipboard:", err);
    }
  };

  const handleDownloadSample = () => {
    const ext = sampleFormat === "yaml" ? "yaml" : "json";
    const mime = sampleFormat === "yaml" ? "text/yaml" : "application/json";
    const blob = new Blob([sampleText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample-schema.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setImportedCount(null);
      setLastFileName(file.name);

      const isSupported = /\.(ya?ml|json)$/i.test(file.name);
      if (!isSupported) {
        setError(`Unsupported file type — "${file.name}" must be .yaml, .yml, or .json`);
        return;
      }

      try {
        const text = await file.text();
        const groups = parseSchemaFile(file.name, text);

        // Required by spec: log parsed output to the dev console.
        console.log(`[UrlSchemaImport] Parsed "${file.name}" →`, groups);

        const endpointCount = groups.reduce((n, g) => n + g.endpoints.length, 0);
        setImportedCount(endpointCount);
        onImport(groups);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown parsing error";
        console.error(`[UrlSchemaImport] Failed to parse "${file.name}":`, message);
        setError(message);
      }
    },
    [onImport]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all ${dragging
          ? "border-[hsl(var(--brand-cyan))] bg-[hsl(var(--brand-cyan))]/5"
          : "border-border/60 hover:border-[hsl(var(--brand-cyan))]/60 hover:bg-muted/30"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".yaml,.yml,.json,application/json,text/yaml"
          onChange={onInputChange}
        />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

        {/* <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-xl bg-[hsl(var(--brand-cyan))]/10"
            />
          )}
        </AnimatePresence> */}

        <motion.div
          animate={{ y: dragging ? -3 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex flex-col items-center gap-2.5"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br transition-all ${dragging
              ? "border-[hsl(var(--brand-cyan))]/50 from-[hsl(var(--brand-cyan))]/30 to-[hsl(var(--brand-violet))]/10"
              : "border-border/50 from-muted/40 to-muted/10 group-hover:from-[hsl(var(--brand-cyan))]/20"
              }`}
          >
            <UploadCloud
              className={`h-5 w-5 transition-colors ${dragging ? "text-[hsl(var(--brand-cyan))]" : "text-muted-foreground group-hover:text-[hsl(var(--brand-cyan))]"
                }`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {dragging ? "Drop schema file to import" : "Drag and drop a URL schema file"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse accepts <span className="font-semibold text-[hsl(var(--brand-cyan))]">.yaml</span>,{" "}
              <span className="font-semibold text-[hsl(var(--brand-cyan))]">.yml</span>, or{" "}
              <span className="font-semibold text-[hsl(var(--brand-cyan))]">.json</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* sample schema toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowSample((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-[hsl(var(--brand-cyan))]"
        >
          <Code2 className="h-3.5 w-3.5" />
          {showSample ? "Hide sample schema" : "Show me a sample schema"}
        </button>
      </div>

      <AnimatePresence>
        {showSample && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setSampleFormat("yaml")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${sampleFormat === "yaml"
                      ? "bg-[hsl(var(--brand-cyan))]/15 text-[hsl(var(--brand-cyan))]"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    YAML
                  </button>
                  <button
                    onClick={() => setSampleFormat("json")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${sampleFormat === "json"
                      ? "bg-[hsl(var(--brand-cyan))]/15 text-[hsl(var(--brand-cyan))]"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    JSON
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopySample}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                    title="Copy sample to clipboard"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownloadSample}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                    title="Download sample file"
                  >
                    <FileDown className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
              <pre className="max-h-64 overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {sampleText}
              </pre>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">
              Every endpoint must use one of: {HTTP_METHODS.join(", ")}. <code className="rounded bg-muted/40 px-1 py-0.5">confidence</code> and <code className="rounded bg-muted/40 px-1 py-0.5">status</code> are optional.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-xs text-pink-400"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Import failed{lastFileName ? ` — ${lastFileName}` : ""}</p>
              <p className="mt-0.5 break-words opacity-90">{error}</p>
            </div>
            <button
              title="Dismiss error"
              onClick={(e) => { e.stopPropagation(); setError(null); }}
              className="shrink-0 rounded-full p-0.5 opacity-60 transition hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}

        {!error && importedCount !== null && (
          <motion.div
            key="success"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>
              Imported {importedCount} endpoint{importedCount !== 1 ? "s" : ""} from{" "}
              <span className="inline-flex items-center gap-1 font-medium">
                <FileJson2 className="h-3 w-3" />
                {lastFileName}
              </span>
              {" "}— see console for full parsed output.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
