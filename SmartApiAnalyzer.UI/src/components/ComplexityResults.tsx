import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileCode2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  LayoutGrid,
  List,
  Table2,
  Maximize2,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type {
  FileComplexityReceivedPayload,
  ComplexityReport,
  ComplexityUnit,
  RiskLevel,
} from "@/types/complexity";

/* ─── constants ─── */
const PAGE_SIZE = 10;

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  fontSize: "12px",
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; icon: LucideIcon; bg: string; pill: string }> = {
  CRITICAL: {
    label: "Critical",
    color: "hsl(var(--brand-pink))",
    icon: AlertTriangle,
    bg: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30",
    pill: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  },
  HIGH: {
    label: "High",
    color: "hsl(var(--brand-amber))",
    icon: AlertCircle,
    bg: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30",
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  MEDIUM: {
    label: "Medium",
    color: "hsl(var(--brand-cyan))",
    icon: Info,
    bg: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30",
    pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  },
  LOW: {
    label: "Low",
    color: "hsl(var(--brand-emerald))",
    icon: CheckCircle2,
    bg: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
};

const RISK_PIE_COLORS: Record<RiskLevel, string> = {
  CRITICAL: "hsl(var(--brand-pink))",
  HIGH: "hsl(var(--brand-amber))",
  MEDIUM: "hsl(var(--brand-cyan))",
  LOW: "hsl(var(--brand-emerald))",
};

const accentMap: Record<string, string> = {
  violet: "from-[hsl(var(--brand-violet))]/20 to-transparent border-[hsl(var(--brand-violet))]/30 text-[hsl(var(--brand-violet))]",
  cyan: "from-[hsl(var(--brand-cyan))]/20 to-transparent border-[hsl(var(--brand-cyan))]/30 text-[hsl(var(--brand-cyan))]",
  pink: "from-[hsl(var(--brand-pink))]/20 to-transparent border-[hsl(var(--brand-pink))]/30 text-[hsl(var(--brand-pink))]",
  amber: "from-[hsl(var(--brand-amber))]/20 to-transparent border-[hsl(var(--brand-amber))]/30 text-[hsl(var(--brand-amber))]",
  emerald: "from-[hsl(var(--brand-emerald))]/20 to-transparent border-[hsl(var(--brand-emerald))]/30 text-[hsl(var(--brand-emerald))]",
};

/* ─── shared helpers ─── */
function scoreColor(score: number) {
  if (score >= 80) return "text-pink-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 35) return "text-cyan-400";
  return "text-emerald-400";
}

function dominantRisk(r: ComplexityReport): RiskLevel {
  if (r.summary.criticalRiskCount > 0) return "CRITICAL";
  if (r.summary.highRiskCount > 0) return "HIGH";
  if (r.summary.mediumRiskCount > 0) return "MEDIUM";
  return "LOW";
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const cfg = RISK_CONFIG[risk];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-gradient-to-br ${cfg.bg}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score, className = "" }: { score: number; className?: string }) {
  const pct = Math.min(100, score);
  const color =
    score >= 80 ? "hsl(var(--brand-pink))"
      : score >= 60 ? "hsl(var(--brand-amber))"
        : score >= 35 ? "hsl(var(--brand-cyan))"
          : "hsl(var(--brand-emerald))";
  return (
    <div className={`h-1.5 w-full rounded-full bg-border/50 ${className}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ─── UnitRow (collapsible detail row used in full view) ─── */
function UnitRow({ unit }: { unit: ComplexityUnit }) {
  const [open, setOpen] = useState(false);
  const barColor =
    unit.riskLevel === "CRITICAL" ? "hsl(var(--brand-pink))"
      : unit.riskLevel === "HIGH" ? "hsl(var(--brand-amber))"
        : unit.riskLevel === "MEDIUM" ? "hsl(var(--brand-cyan))"
          : "hsl(var(--brand-emerald))";

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/30"
      >
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-mono font-semibold truncate">{unit.name}</span>
            <RiskBadge risk={unit.riskLevel} />
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
              L{unit.startLine}–{unit.endLine}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBar score={unit.totalScore} className="flex-1" />
            <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>
              {unit.totalScore}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{unit.timeComplexity.notation}</span>
          <span className="flex items-center gap-1"><Database className="h-3 w-3" />{unit.spaceComplexity.notation}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-border/40 bg-muted/10"
          >
            <div className="px-4 py-3 space-y-3">
              {unit.matchedKeywords.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Matched patterns</p>
                  <div className="flex flex-wrap gap-1">
                    {unit.matchedKeywords.map((k) => (
                      <span key={k} className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 font-mono text-[10px]">{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {unit.reasons.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Analysis reasons</p>
                  <ul className="space-y-1.5">
                    {unit.reasons.map((r, i) => {
                      const impactColor =
                        r.impact === "critical" ? "text-pink-400"
                          : r.impact === "high" ? "text-amber-400"
                            : r.impact === "medium" ? "text-cyan-400" : "text-emerald-400";
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${impactColor.replace("text", "bg")}`} />
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground">{r.pattern}</span>
                            <span className="mx-1 text-muted-foreground/40">·</span>
                            <span className="text-muted-foreground">{r.detail}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div className="flex gap-4 border-t border-border/30 pt-2">
                <div><p className="text-[10px] text-muted-foreground">Time</p><p className="text-sm font-bold">{unit.timeScore}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Space</p><p className="text-sm font-bold">{unit.spaceScore}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Confidence</p><p className="text-sm font-bold">{(unit.confidence * 100).toFixed(0)}%</p></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Full view (dedicated detail panel for a single file) ─── */
function FileFullView({ report, onClose }: { report: ComplexityReport; onClose: () => void }) {
  const s = report.summary;
  const allUnits: ComplexityUnit[] = [
    ...report.details.functions,
    ...report.details.methods,
    ...report.details.arrows,
    ...report.details.callbacks,
    ...report.details.constructors,
    ...report.details.handlers,
  ].sort((a, b) => b.totalScore - a.totalScore);

  const risk = dominantRisk(report);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onClose}
            className="mt-0.5 flex items-center gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-1.5 text-xs transition hover:bg-muted/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to results
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-lg font-bold">{report.nameOfFile}</h3>
              <RiskBadge risk={risk} />
            </div>
            <p className="text-xs text-muted-foreground">
              {s.itemsAnalyzed} units · avg score {s.avgScore} · {new Date(report.generatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Units", value: s.itemsAnalyzed, color: "violet" },
          { label: "Avg score", value: s.avgScore, color: s.avgScore >= 80 ? "pink" : s.avgScore >= 60 ? "amber" : "emerald" },
          { label: "Total score", value: s.totalScore, color: "cyan" },
          { label: "Critical", value: s.criticalRiskCount, color: "pink" },
          { label: "High", value: s.highRiskCount, color: "amber" },
          { label: "Medium", value: s.mediumRiskCount, color: "cyan" },
          { label: "Low", value: s.lowRiskCount, color: "emerald" },
        ].map((c) => (
          <Card key={c.label} className={`glass-card overflow-hidden border bg-gradient-to-br ${accentMap[c.color]}`}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className="mt-0.5 text-xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Complexity notation */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          Avg time: <strong className="ml-1">{s.avgTimeComplexity}</strong>
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-xs">
          <Database className="h-3 w-3 text-muted-foreground" />
          Avg space: <strong className="ml-1">{s.avgSpaceComplexity}</strong>
        </span>
      </div>

      {/* All units */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {allUnits.length} unit{allUnits.length !== 1 ? "s" : ""} — sorted by score (highest first)
          </p>
        </div>
        <div className="space-y-2">
          {allUnits.map((u) => <UnitRow key={u.id} unit={u} />)}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Grid card (compact, opens full view on click) ─── */
function GridCard({ report, onView }: { report: ComplexityReport; onView: () => void }) {
  const s = report.summary;
  const risk = dominantRisk(report);
  const sc = scoreColor(s.avgScore);

  return (
    <Card className="glass-card group overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--brand-violet))]/30 bg-[hsl(var(--brand-violet))]/10">
            <FileCode2 className="h-4 w-4 text-[hsl(var(--brand-violet))]" />
          </div>
          <span className={`text-3xl font-bold tabular-nums ${sc}`}>{s.avgScore}</span>
        </div>
        <p className="truncate font-mono text-sm font-semibold">{report.nameOfFile}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <RiskBadge risk={risk} />
          <span className="rounded-full border border-border/50 bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground">
            {s.itemsAnalyzed} units
          </span>
        </div>
        <ScoreBar score={s.avgScore} className="mt-3" />
        <div className="mt-3 grid grid-cols-2 gap-x-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{s.avgTimeComplexity}</span>
          <span className="flex items-center gap-1"><Database className="h-2.5 w-2.5" />{s.avgSpaceComplexity}</span>
        </div>
      </div>
      <div className="border-t border-border/40 bg-muted/5 px-5 py-3">
        <button
          onClick={onView}
          className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          View full details
        </button>
      </div>
    </Card>
  );
}

/* ─── List row (compact single-line, opens full view) ─── */
function ListRow({ report, index, onView }: { report: ComplexityReport; index: number; onView: () => void }) {
  const s = report.summary;
  const risk = dominantRisk(report);
  const sc = scoreColor(s.avgScore);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/10 px-4 py-3 transition hover:bg-muted/20">
      <span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground/50">{String(index + 1).padStart(2, "0")}</span>
      <FileCode2 className="h-4 w-4 shrink-0 text-[hsl(var(--brand-violet))]/60" />
      <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium">{report.nameOfFile}</span>
      <div className="hidden shrink-0 sm:block w-32">
        <ScoreBar score={s.avgScore} />
      </div>
      <span className={`shrink-0 font-mono text-sm font-bold tabular-nums ${sc}`}>{s.avgScore}</span>
      <div className="hidden shrink-0 md:block"><RiskBadge risk={risk} /></div>
      <span className="hidden shrink-0 text-[10px] text-muted-foreground lg:block">{s.itemsAnalyzed} units</span>
      <button
        onClick={onView}
        className="ml-1 shrink-0 rounded-lg border border-border/50 bg-muted/20 p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        title="View full details"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Table view ─── */
function TableView({ reports, onView }: { reports: ComplexityReport[]; onView: (r: ComplexityReport) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/20">
            {["#", "File", "Units", "Avg Score", "Risk", "Time", "Space", "Crit", "High", "Med", "Low", ""].map((h, i) => (
              <th key={i} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:pl-4 last:pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => {
            const s = r.summary;
            const risk = dominantRisk(r);
            const sc = scoreColor(s.avgScore);
            return (
              <tr
                key={r.nameOfFile}
                className="border-b border-border/30 transition last:border-0 hover:bg-muted/10"
              >
                <td className="pl-4 py-3 font-mono text-[10px] text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</td>
                <td className="px-3 py-3 font-mono text-xs font-medium max-w-[200px] truncate">{r.nameOfFile}</td>
                <td className="px-3 py-3 tabular-nums text-xs">{s.itemsAnalyzed}</td>
                <td className="px-3 py-3">
                  <span className={`font-bold tabular-nums text-sm ${sc}`}>{s.avgScore}</span>
                </td>
                <td className="px-3 py-3"><RiskBadge risk={risk} /></td>
                <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">{s.avgTimeComplexity}</td>
                <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">{s.avgSpaceComplexity}</td>
                <td className="px-3 py-3 tabular-nums text-xs text-pink-400 font-semibold">{s.criticalRiskCount || "—"}</td>
                <td className="px-3 py-3 tabular-nums text-xs text-amber-400 font-semibold">{s.highRiskCount || "—"}</td>
                <td className="px-3 py-3 tabular-nums text-xs text-cyan-400 font-semibold">{s.mediumRiskCount || "—"}</td>
                <td className="px-3 py-3 tabular-nums text-xs text-emerald-400 font-semibold">{s.lowRiskCount || "—"}</td>
                <td className="pr-4 py-3">
                  <button
                    onClick={() => onView(r)}
                    className="rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1 text-[10px] font-medium transition hover:bg-muted/50"
                  >
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Pagination controls ─── */
function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 px-4 py-2.5">
      <span className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> files
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Page {currentPage + 1} / {totalPages}
        </span>
        <button
          title="Previous page"
          onClick={onPrev}
          disabled={currentPage === 0}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-muted/20 transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          title="Next page"
          onClick={onNext}
          disabled={currentPage >= totalPages - 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-muted/20 transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── View mode toggle ─── */
type ViewMode = "grid" | "list" | "table";
const VIEW_OPTS: { mode: ViewMode; icon: LucideIcon; label: string }[] = [
  { mode: "grid", icon: LayoutGrid, label: "Grid" },
  { mode: "list", icon: List, label: "List" },
  { mode: "table", icon: Table2, label: "Table" },
];

/* ─── Main export ─── */
interface Props {
  payload: FileComplexityReceivedPayload;
  onReset: () => void;
}

export default function ComplexityResults({ payload, onReset }: Props) {
  const reports = payload.complexityAnalysis.data;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<ComplexityReport | null>(null);

  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const pageReports = reports.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleView = (r: ComplexityReport) => {
    setSelectedReport(r);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleClose = () => setSelectedReport(null);
  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    setSelectedReport(null);
  };

  /* aggregate */
  const totals = reports.reduce(
    (acc, r) => {
      acc.items += r.summary.itemsAnalyzed;
      acc.critical += r.summary.criticalRiskCount;
      acc.high += r.summary.highRiskCount;
      acc.medium += r.summary.mediumRiskCount;
      acc.low += r.summary.lowRiskCount;
      acc.scoreSum += r.summary.avgScore;
      return acc;
    },
    { items: 0, critical: 0, high: 0, medium: 0, low: 0, scoreSum: 0 }
  );
  const overallAvg = reports.length ? Math.round(totals.scoreSum / reports.length) : 0;
  const overallRisk: RiskLevel =
    overallAvg >= 80 ? "CRITICAL" : overallAvg >= 60 ? "HIGH" : overallAvg >= 35 ? "MEDIUM" : "LOW";

  const riskPieData = [
    { name: "Critical", value: totals.critical, risk: "CRITICAL" as RiskLevel },
    { name: "High", value: totals.high, risk: "HIGH" as RiskLevel },
    { name: "Medium", value: totals.medium, risk: "MEDIUM" as RiskLevel },
    { name: "Low", value: totals.low, risk: "LOW" as RiskLevel },
  ].filter((d) => d.value > 0);

  const barData = reports.map((r) => ({
    file: r.nameOfFile.replace(/\.[^.]+$/, "").slice(-14),
    avg: r.summary.avgScore,
  }));

  const summaryCards = [
    { label: "Files analyzed", value: reports.length, color: "violet" },
    { label: "Units analyzed", value: totals.items, color: "cyan" },
    { label: "Avg complexity", value: overallAvg, color: overallRisk === "CRITICAL" ? "pink" : overallRisk === "HIGH" ? "amber" : "emerald" },
    { label: "Critical units", value: totals.critical, color: "pink" },
    { label: "High-risk units", value: totals.high, color: "amber" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Analysis Results</h2>
            <RiskBadge risk={overallRisk} />
          </div>
          <p className="text-sm text-muted-foreground">
            {payload.complexityAnalysis.message} ·{" "}
            {new Date(reports[0]?.generatedAt ?? "").toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-2 text-sm transition hover:bg-muted/40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Analyze new files
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {summaryCards.map((c) => (
          <Card key={c.label} className={`glass-card overflow-hidden border bg-gradient-to-br ${accentMap[c.color]}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts ── */}
      <AnimatePresence>
        {!selectedReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Risk Distribution</CardTitle>
                <CardDescription>Units by risk level across all files</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {riskPieData.map((entry, i) => (
                        <Cell key={i} fill={RISK_PIE_COLORS[entry.risk]} stroke="hsl(var(--card))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Complexity by File</CardTitle>
                <CardDescription>Average score per file</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="complexBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-violet))" stopOpacity={1} />
                        <stop offset="95%" stopColor="hsl(var(--brand-cyan))" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="file" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="avg" name="Avg score" fill="url(#complexBar)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── File breakdown ── */}
      <AnimatePresence mode="wait">
        {selectedReport ? (
          <motion.div key="full-view">
            <FileFullView report={selectedReport} onClose={handleClose} />
          </motion.div>
        ) : (
          <motion.div key="file-list" className="space-y-3">
            {/* toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                File breakdown
                {reports.length > PAGE_SIZE && (
                  <span className="ml-2 font-normal normal-case">
                    · {reports.length} files total
                  </span>
                )}
              </h3>
              {/* view mode toggle */}
              <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/20 p-1">
                {VIEW_OPTS.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => { setViewMode(mode); setCurrentPage(0); }}
                    title={label}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${viewMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* grid view */}
            {viewMode === "grid" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageReports.map((r) => (
                  <GridCard key={r.nameOfFile} report={r} onView={() => handleView(r)} />
                ))}
              </div>
            )}

            {/* list view */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {pageReports.map((r, i) => (
                  <ListRow
                    key={r.nameOfFile}
                    report={r}
                    index={currentPage * PAGE_SIZE + i}
                    onView={() => handleView(r)}
                  />
                ))}
              </div>
            )}

            {/* table view */}
            {viewMode === "table" && (
              <TableView reports={pageReports} onView={handleView} />
            )}

            {/* pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={reports.length}
                pageSize={PAGE_SIZE}
                onPrev={() => handlePageChange(currentPage - 1)}
                onNext={() => handlePageChange(currentPage + 1)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
