import type {
  FileComplexityReceivedPayload,
  ComplexityReport,
  ComplexityUnit,
  ComplexityUnitKind,
  RiskLevel,
  ComplexityMetric,
  ComplexityReason,
  BackendLanguageKey,
} from "@/types/complexity";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const TIME_NOTATIONS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)", "O(2^n)"];
const SPACE_NOTATIONS = ["O(1)", "O(log n)", "O(n)", "O(n²)"];

const FUNCTION_NAMES_BY_LANG: Record<BackendLanguageKey, string[]> = {
  typescript: [
    "parseRequest", "validateSchema", "resolveToken", "fetchUserById",
    "computeMetrics", "applyTransform", "handleWebhook", "buildResponse",
    "retryWithBackoff", "aggregatePipeline", "sanitizeInput", "renderComponent",
  ],
  javascript: [
    "processEvent", "mapReduceData", "chainMiddleware", "resolvePromises",
    "parseJSON", "buildQuery", "handleError", "formatCurrency",
    "debounce", "throttle", "memoize", "deepClone",
  ],
  csharp: [
    "ProcessRequest", "ValidateEntity", "BuildRepository", "ExecuteQuery",
    "SerializeResponse", "HandleException", "ComputeAggregate", "DispatchCommand",
    "ApplyMigration", "ResolveDependency", "MapToDto", "InvokeMiddleware",
  ],
  python: [
    "parse_config", "fetch_data", "validate_input", "compute_hash",
    "serialize_model", "run_pipeline", "handle_request", "aggregate_stats",
    "build_query", "retry_connection", "process_batch", "generate_report",
  ],
  java: [
    "processEntity", "validateRequest", "buildResponse", "executeQuery",
    "resolveBean", "mapToDto", "computeScore", "handleException",
    "applyFilter", "mergeResults", "parsePayload", "dispatchEvent",
  ],
};

const KEYWORDS_BY_LANG: Record<BackendLanguageKey, string[]> = {
  typescript: ["forEach", "map", "filter", "reduce", "async", "await", "try", "catch", "while", "for"],
  javascript: ["forEach", "map", "then", "catch", "setTimeout", "Promise", "reduce", "for", "while"],
  csharp: ["foreach", "LINQ", "async", "await", "try", "catch", "while", "for", "yield", "lock"],
  python: ["for", "while", "try", "except", "async", "await", "yield", "with", "lambda", "map"],
  java: ["for", "while", "try", "catch", "synchronized", "stream", "forEach", "reduce", "flatMap", "Optional"],
};

const REASON_PATTERNS = [
  { pattern: "nested-loop", detail: "Nested iteration detected — inner loop multiplies complexity", impact: "high" as const },
  { pattern: "recursive-call", detail: "Self-referential call without memoization", impact: "critical" as const },
  { pattern: "linear-scan", detail: "Array traversal proportional to input size", impact: "medium" as const },
  { pattern: "hash-lookup", detail: "O(1) map/dict access — efficient", impact: "low" as const },
  { pattern: "sort-operation", detail: "Comparison sort introduces O(n log n) factor", impact: "high" as const },
  { pattern: "allocation-loop", detail: "Memory allocated inside loop body", impact: "high" as const },
  { pattern: "memoized-result", detail: "Result cached — subsequent calls are O(1)", impact: "low" as const },
  { pattern: "string-concat", detail: "String concatenation in loop — O(n²) in some runtimes", impact: "medium" as const },
];

function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateMetric(notations: string[]): ComplexityMetric {
  return {
    notation: pickRandom(notations),
    confidence: Number((0.7 + Math.random() * 0.29).toFixed(2)),
    flags: Math.random() > 0.5 ? [pickRandom(["nested-call", "allocation", "branch-heavy", "io-bound"])] : [],
  };
}

function generateReasons(score: number): ComplexityReason[] {
  const count = score > 60 ? rand(2, 4) : rand(1, 2);
  const patterns = pickRandomN(REASON_PATTERNS, count);
  let line = rand(3, 20);
  return patterns.map((p) => {
    line += rand(2, 8);
    return {
      type: Math.random() > 0.4 ? "time" : "space",
      pattern: p.pattern,
      detail: p.detail,
      impact: p.impact,
      confidence: Number((0.65 + Math.random() * 0.34).toFixed(2)),
      lineNumber: line,
    };
  });
}

function generateUnit(
  id: string,
  kind: ComplexityUnitKind,
  lang: BackendLanguageKey,
  nameOverride?: string,
  scoreOverride?: number
): ComplexityUnit {
  const names = FUNCTION_NAMES_BY_LANG[lang];
  const name = nameOverride ?? pickRandom(names);
  const startLine = rand(1, 200);
  const lineLength = rand(8, 60);
  const timeScore = scoreOverride ?? rand(5, 95);
  const spaceScore = rand(5, 80);
  const totalScore = Math.round(timeScore * 0.6 + spaceScore * 0.4);

  return {
    id,
    kind,
    name,
    startLine,
    endLine: startLine + lineLength,
    text: `// ${name} — ${lineLength} lines`,
    timeComplexity: generateMetric(TIME_NOTATIONS),
    spaceComplexity: generateMetric(SPACE_NOTATIONS),
    timeScore,
    spaceScore,
    totalScore,
    riskLevel: riskFromScore(totalScore),
    confidence: Number((0.7 + Math.random() * 0.29).toFixed(2)),
    reasons: generateReasons(totalScore),
    matchedKeywords: pickRandomN(KEYWORDS_BY_LANG[lang], rand(1, 4)),
    tierUsed: "free",
  };
}

function generateReport(fileName: string, lang: BackendLanguageKey): ComplexityReport {
  const fnCount = rand(3, 7);
  const methodCount = rand(2, 6);
  const arrowCount = rand(1, 5);
  const callbackCount = rand(0, 3);

  let uid = 0;
  const mkId = () => `${fileName.replace(/[^a-z0-9]/gi, "_")}_${++uid}`;

  const functions = Array.from({ length: fnCount }, () => generateUnit(mkId(), "functions", lang));
  const methods = Array.from({ length: methodCount }, () => generateUnit(mkId(), "methods", lang));
  const arrows = Array.from({ length: arrowCount }, () => generateUnit(mkId(), "arrows", lang));
  const callbacks = Array.from({ length: callbackCount }, () => generateUnit(mkId(), "callbacks", lang));

  const allUnits = [...functions, ...methods, ...arrows, ...callbacks];
  const scores = allUnits.map((u) => u.totalScore);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const avgScore = scores.length ? Math.round(totalScore / scores.length) : 0;

  const criticalRiskCount = allUnits.filter((u) => u.riskLevel === "CRITICAL").length;
  const highRiskCount = allUnits.filter((u) => u.riskLevel === "HIGH").length;
  const mediumRiskCount = allUnits.filter((u) => u.riskLevel === "MEDIUM").length;
  const lowRiskCount = allUnits.filter((u) => u.riskLevel === "LOW").length;

  const timeNotations = allUnits.map((u) => u.timeComplexity.notation);
  const spaceNotations = allUnits.map((u) => u.spaceComplexity.notation);
  const avgTime = pickRandom(timeNotations);
  const avgSpace = pickRandom(spaceNotations);

  return {
    nameOfFile: fileName,
    success: true,
    generatedAt: new Date().toISOString(),
    tierUsed: "free",
    summary: {
      itemsAnalyzed: allUnits.length,
      totalScore,
      avgScore,
      avgTimeComplexity: avgTime,
      avgSpaceComplexity: avgSpace,
      criticalRiskCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    },
    details: {
      functions,
      arrows,
      methods,
      constructors: [],
      getters: [],
      setters: [],
      callbacks,
      handlers: [],
      staticBlocks: [],
      topLevelStatements: [],
    },
  };
}

export async function analyzeFiles(
  files: { name: string; language: BackendLanguageKey }[]
): Promise<FileComplexityReceivedPayload> {
  await delay(1400 + Math.random() * 600);
  const reports = files.map((f) => generateReport(f.name, f.language));
  return {
    complexityAnalysis: {
      data: reports,
      success: true,
      message: `Analyzed ${reports.length} file${reports.length !== 1 ? "s" : ""} successfully.`,
    },
  };
}

// Deterministic demo payload for 5 TypeScript files
export function getDemoPayload(): FileComplexityReceivedPayload {
  const demoFiles = [
    "authService.ts",
    "userController.ts",
    "paymentProcessor.ts",
    "dataTransformer.ts",
    "apiMiddleware.ts",
    "apiMiddleware-1.ts",
    "apiMiddleware-2.ts",
    "apiMiddleware-3.ts",
    "apiMiddleware-4.ts",
    "apiMiddleware-5.ts",
    "apiMiddleware-6.ts",
    "apiMiddleware-7.ts",
  ];

  const fixedUnits: Record<string, { name: string; timeScore: number; spaceScore: number }[]> = {
    "authService.ts": [
      { name: "resolveToken", timeScore: 82, spaceScore: 45 },
      { name: "validateSchema", timeScore: 64, spaceScore: 38 },
      { name: "retryWithBackoff", timeScore: 91, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 28, spaceScore: 20 },
      { name: "sanitizeInput", timeScore: 35, spaceScore: 18 },
    ],
    "userController.ts": [
      { name: "parseRequest", timeScore: 43, spaceScore: 32 },
      { name: "buildResponse", timeScore: 22, spaceScore: 15 },
      { name: "aggregatePipeline", timeScore: 88, spaceScore: 72 },
      { name: "handleWebhook", timeScore: 56, spaceScore: 40 },
    ],
    "paymentProcessor.ts": [
      { name: "computeMetrics", timeScore: 95, spaceScore: 78 },
      { name: "applyTransform", timeScore: 77, spaceScore: 55 },
      { name: "retryWithBackoff", timeScore: 88, spaceScore: 62 },
      { name: "sanitizeInput", timeScore: 30, spaceScore: 18 },
      { name: "resolveToken", timeScore: 61, spaceScore: 44 },
      { name: "validateSchema", timeScore: 48, spaceScore: 30 },
    ],
    "dataTransformer.ts": [
      { name: "aggregatePipeline", timeScore: 72, spaceScore: 58 },
      { name: "applyTransform", timeScore: 55, spaceScore: 36 },
      { name: "parseRequest", timeScore: 38, spaceScore: 22 },
      { name: "buildResponse", timeScore: 19, spaceScore: 12 },
    ],
    "apiMiddleware.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-1.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-2.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-3.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-4.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-5.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-6.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
    "apiMiddleware-7.ts": [
      { name: "handleWebhook", timeScore: 48, spaceScore: 35 },
      { name: "sanitizeInput", timeScore: 26, spaceScore: 14 },
      { name: "resolveToken", timeScore: 67, spaceScore: 48 },
      { name: "computeMetrics", timeScore: 84, spaceScore: 60 },
      { name: "fetchUserById", timeScore: 31, spaceScore: 22 },
    ],
  };

  const reports: ComplexityReport[] = demoFiles.map((fileName) => {
    const unitDefs = fixedUnits[fileName];
    console.log("Turbo Log  ~ getDemoPayload ~ unitDefs:", unitDefs);
    let uid = 0;
    const mkId = () => `demo_${fileName.replace(/[^a-z0-9]/gi, "_")}_${++uid}`;

    const functions: ComplexityUnit[] = unitDefs.slice(0, 3).map((u) =>
      generateUnit(mkId(), "functions", "typescript", u.name, u.timeScore)
    );
    const methods: ComplexityUnit[] = unitDefs.slice(3).map((u) =>
      generateUnit(mkId(), "methods", "typescript", u.name, u.timeScore)
    );
    const arrows: ComplexityUnit[] = [
      generateUnit(mkId(), "arrows", "typescript", undefined, rand(15, 55)),
    ];

    const allUnits = [...functions, ...methods, ...arrows];
    const scores = allUnits.map((u) => u.totalScore);
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round(totalScore / scores.length);

    return {
      nameOfFile: fileName,
      success: true,
      generatedAt: "2025-05-05T10:32:14.000Z",
      tierUsed: "free",
      summary: {
        itemsAnalyzed: allUnits.length,
        totalScore,
        avgScore,
        avgTimeComplexity: pickRandom(["O(n)", "O(n log n)", "O(n²)"]),
        avgSpaceComplexity: pickRandom(["O(1)", "O(n)", "O(log n)"]),
        criticalRiskCount: allUnits.filter((u) => u.riskLevel === "CRITICAL").length,
        highRiskCount: allUnits.filter((u) => u.riskLevel === "HIGH").length,
        mediumRiskCount: allUnits.filter((u) => u.riskLevel === "MEDIUM").length,
        lowRiskCount: allUnits.filter((u) => u.riskLevel === "LOW").length,
      },
      details: {
        functions,
        arrows,
        methods,
        constructors: [],
        getters: [],
        setters: [],
        callbacks: [],
        handlers: [],
        staticBlocks: [],
        topLevelStatements: [],
      },
    };
  });

  return {
    complexityAnalysis: {
      data: reports,
      success: true,
      message: "Demo: Analyzed 5 files successfully.",
    },
  };
}
