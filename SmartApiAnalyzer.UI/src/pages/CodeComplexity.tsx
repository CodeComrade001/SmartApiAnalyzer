import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Shield,
  FileText,
  Upload,
  X,
  Sparkles,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FileUploadZone from "@/components/FileUploadZone";
import ComplexityResults from "@/components/ComplexityResults";
import { analyzeFiles, getDemoPayload } from "@/services/complexityMock";
import {
  BACKEND_LANGUAGES,
  FRAMEWORKS,
  BackendLanguageKey,
  SingleFile,
  FileComplexityReceivedPayload,
} from "@/types/complexity";

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

/* ─── language color map ─── */
const LANG_COLORS: Record<BackendLanguageKey, { pill: string; icon: string; ring: string }> = {
  typescript: {
    pill: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
    icon: "text-blue-400",
    ring: "ring-blue-500/40",
  },
  javascript: {
    pill: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400",
    icon: "text-yellow-400",
    ring: "ring-yellow-500/40",
  },
  csharp: {
    pill: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
    icon: "text-violet-400",
    ring: "ring-violet-500/40",
  },
  python: {
    pill: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    icon: "text-emerald-400",
    ring: "ring-emerald-500/40",
  },
  java: {
    pill: "from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400",
    icon: "text-orange-400",
    ring: "ring-orange-500/40",
  },
};

/* ─── section wrapper ─── */
function Section({
  number,
  title,
  subtitle,
  children,
  badge,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-muted-foreground/40">
            {number}
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </motion.div>
  );
}

/* ─── page state ─── */
type AnalysisState = "idle" | "analyzing" | "results";

export default function CodeComplexity() {
  /* config */
  const [selectedLang, setSelectedLang] = useState<BackendLanguageKey | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  /* .complexityignore */
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [ignoreFileName, setIgnoreFileName] = useState<string | null>(null);
  const ignoreInputRef = useRef<HTMLInputElement>(null);

  /* analysis */
  const [analysisState, setAnalysisState] = useState<AnalysisState>("results");
  const [result, setResult] = useState<FileComplexityReceivedPayload>(getDemoPayload());
  const [isDemo, setIsDemo] = useState(true);
  const [queuedFiles, setQueuedFiles] = useState<SingleFile[]>([]);

  /* ── handlers ── */
  const handleLangSelect = (lang: BackendLanguageKey) => {
    if (selectedLang === lang) {
      setSelectedLang(null);
      setSelectedFramework(null);
    } else {
      setSelectedLang(lang);
      setSelectedFramework(null);
    }
  };

  const handleIgnoreFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      setIgnorePatterns(lines);
      setIgnoreFileName(file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const handleAnalyze = async (files: SingleFile[]) => {
    if (!selectedLang) return;

    setQueuedFiles(files);
    setAnalysisState("analyzing");
    setIsDemo(false);

    try {
      // send full file metadata so backend can detect project structure
      const data = await analyzeFiles(
        files.map((f) => ({
          name: f.name,
          path: f.dir,          // important for folder structure
          size: f.size,
          language: f.language,
          type: f.type,
        }))
      );

      setResult(data);
      setAnalysisState("results");
    } catch (error) {
      console.error("Analyze failed:", error);
      setAnalysisState("idle");
    }
  };


  const handleReset = () => {
    setAnalysisState("idle");
    setIsDemo(false);
  };

  const handleLoadDemo = () => {
    setResult(getDemoPayload());
    setIsDemo(true);
    setAnalysisState("results");
  };

  const canUpload = selectedLang !== null && selectedFramework !== null;

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col gap-8">
      {/* ── PAGE HEADER ── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--brand-violet))]/30 bg-[hsl(var(--brand-violet))]/10">
              <FileCode2 className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Code Complexity</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Analyze cyclomatic complexity, time &amp; space scores, and risk levels per file.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {analysisState === "results" && (
            <Badge
              variant="outline"
              className={`glass gap-1.5 ${isDemo ? "border-amber-500/40 text-amber-400" : ""}`}
            >
              {isDemo ? (
                <>
                  <Sparkles className="h-3 w-3" /> Demo data
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-[hsl(var(--brand-emerald))]" /> Analysis complete
                </>
              )}
            </Badge>
          )}
          {analysisState === "analyzing" && (
            <Badge variant="outline" className="glass gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--brand-cyan))]" />
              Running…
            </Badge>
          )}
          {analysisState === "idle" && (
            <Badge variant="outline" className="glass gap-1.5">
              <AlertTriangle className="h-3 w-3 text-[hsl(var(--brand-amber))]" />
              Ready to analyze
            </Badge>
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          SECTION 01 — LANGUAGE + FRAMEWORK
      ══════════════════════════════════════════ */}
      <Section
        number="01"
        title="Language &amp; Framework"
        subtitle="Select the language for this upload session — only one language per analysis."
      >
        <Card className="glass-card overflow-hidden rounded-2xl">
          {/* Language selector */}
          <div className="border-b border-border/40 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Programming Language
            </p>
            <div className="flex flex-wrap gap-2">
              {BACKEND_LANGUAGES.map((lang) => {
                const active = selectedLang === lang.key;
                return (
                  <button
                    key={lang.key}
                    onClick={() => handleLangSelect(lang.key)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all bg-gradient-to-br ${active
                      ? `${LANG_COLORS[lang.key].pill} ring-2 ${LANG_COLORS[lang.key].ring} shadow-lg`
                      : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                  >
                    <FileCode2 className={`h-3.5 w-3.5 ${active ? LANG_COLORS[lang.key].icon : ""}`} />
                    <span>{lang.label}</span>
                    <span className="font-mono text-[10px] opacity-60">{lang.ext}</span>
                    {active && <CheckCircle2 className="ml-1 h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Framework selector */}
          <AnimatePresence>
            {selectedLang && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Framework / Runtime
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FRAMEWORKS[selectedLang].map((fw) => {
                      const active = selectedFramework === fw;
                      return (
                        <button
                          key={fw}
                          onClick={() => setSelectedFramework(active ? null : fw)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${active
                            ? `${LANG_COLORS[selectedLang].pill} ring-2 ${LANG_COLORS[selectedLang].ring}`
                            : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                        >
                          <FlaskConical className={`h-3 w-3 ${active ? LANG_COLORS[selectedLang].icon : ""}`} />
                          {fw}
                        </button>
                      );
                    })}
                  </div>
                  {selectedFramework && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[hsl(var(--brand-emerald))]" />
                      Session configured:{" "}
                      <span className="font-semibold text-foreground">
                        {BACKEND_LANGUAGES.find((l) => l.key === selectedLang)?.label}
                      </span>{" "}
                      ·{" "}
                      <span className="font-semibold text-foreground">{selectedFramework}</span>
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Section>

      {/* ══════════════════════════════════════════
          SECTION 02 — .complexityignore
      ══════════════════════════════════════════ */}
      <Section
        number="02"
        title=".complexityignore"
        subtitle="Upload a .complexityignore file — any matching files will be excluded from uploads."
        badge={
          ignorePatterns.length > 0 ? (
            <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-400">
              <Shield className="h-3 w-3" />
              {ignorePatterns.length} pattern{ignorePatterns.length !== 1 ? "s" : ""} active
            </Badge>
          ) : undefined
        }
      >
        <Card className="glass-card overflow-hidden rounded-2xl">
          <div className="p-5">
            <input
              ref={ignoreInputRef}
              title="Upload .complexityignore file"
              type="file"
              className="hidden"
              accept=".complexityignore,text/plain"
              onChange={handleIgnoreFile}
            />

            {ignorePatterns.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-muted/20">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No ignore file loaded</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Upload a{" "}
                    <code className="rounded border border-border/50 bg-muted/40 px-1 py-0.5 font-mono text-[10px]">
                      .complexityignore
                    </code>{" "}
                    file with one pattern per line — supports glob patterns.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => ignoreInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload .complexityignore
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs font-medium">{ignoreFileName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {ignorePatterns.length} rules
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => ignoreInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      Replace
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setIgnorePatterns([]); setIgnoreFileName(null); }}
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border/40 bg-muted/10 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ignorePatterns.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-border/50 bg-muted/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Files matching these patterns will be excluded from uploads automatically.
                </p>
              </div>
            )}
          </div>
        </Card>
      </Section>

      {/* ══════════════════════════════════════════
          SECTION 03 — FILE UPLOAD
      ══════════════════════════════════════════ */}
      <Section
        number="03"
        title="Upload Source Folder"
        subtitle={
          canUpload
            ? `Upload full ${BACKEND_LANGUAGES.find((l) => l.key === selectedLang)?.label} project folder · ${selectedFramework}`
            : "Complete language and framework selection above to enable upload."
        }
      >
        <Card
          className={`glass-card overflow-hidden rounded-2xl transition-opacity ${canUpload ? "" : "opacity-60"
            }`}
        >
          {!canUpload && (
            <div className="flex items-center gap-2 border-b border-border/40 bg-amber-500/5 px-5 py-2.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs text-amber-400">
                Select a language and framework first to unlock uploads.
              </p>
            </div>
          )}

          <div className={`p-5 ${!canUpload ? "pointer-events-none select-none" : ""}`}>
            {canUpload ? (
              <FileUploadZone
                language={selectedLang!}
                framework={selectedFramework}
                ignoredPatterns={ignorePatterns}
                allowFolderUpload={true} // enables folder upload
                onAnalyze={handleAnalyze}
                isAnalyzing={analysisState === "analyzing"}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border/40 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-muted/20">
                  <Upload className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground/60">Folder upload locked</p>
              </div>
            )}
          </div>
        </Card>
      </Section>

      {/* ══════════════════════════════════════════
          SECTION 04 — ANALYSIS RESULTS
      ══════════════════════════════════════════ */}
      <Section
        number="04"
        title="Analysis Results"
        subtitle={
          isDemo
            ? "Showing demo data with 5 TypeScript files — run a real analysis to see your results."
            : analysisState === "idle"
              ? "No analysis run yet. Upload files above and click Analyze."
              : "Latest analysis results from your uploaded files."
        }
        badge={
          isDemo ? (
            <button
              onClick={handleLoadDemo}
              className="text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            >
              Reload demo
            </button>
          ) : undefined
        }
      >
        <AnimatePresence mode="wait">
          {analysisState === "analyzing" ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card overflow-hidden rounded-2xl">
                <div className="flex flex-col items-center gap-6 px-8 py-16 text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[hsl(var(--brand-violet))] border-r-[hsl(var(--brand-cyan))]" />
                    <div
                      className="absolute inset-3 animate-spin rounded-full border border-transparent border-b-[hsl(var(--brand-pink))]"
                      style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
                    />
                    <ScanLine className="h-8 w-8 text-[hsl(var(--brand-violet))]" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      Analyzing {queuedFiles.length} file{queuedFiles.length !== 1 ? "s" : ""}…
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Parsing ASTs, computing complexity scores, and ranking risk levels.
                    </p>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    {queuedFiles.slice(0, 6).map((f, i) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2"
                      >
                        <FileCode2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left font-mono text-xs">{f.name}</span>
                        <span
                          className="inline-block h-2 w-2 animate-pulse rounded-full"
                          style={{ background: "hsl(var(--brand-violet))", animationDelay: `${i * 0.15}s` }}
                        />
                      </div>
                    ))}
                    {queuedFiles.length > 6 && (
                      <p className="text-xs text-muted-foreground">+{queuedFiles.length - 6} more files</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : analysisState === "results" ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              {isDemo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-400"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    This is <strong>demo data</strong> showing what your results will look like after
                    uploading 5 TypeScript files. Configure sections 01–03 above and click{" "}
                    <strong>Analyze</strong> to run a real analysis.
                  </span>
                  <button
                    onClick={handleReset}
                    className="ml-auto shrink-0 underline underline-offset-2 transition hover:text-amber-300"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
              <ComplexityResults payload={result} onReset={handleReset} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card overflow-hidden rounded-2xl">
                <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
                    <ScanLine className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No results yet</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      Upload and analyze files in section 03 to see results here.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleLoadDemo}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Load demo data
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

    </motion.div>
  );
}
