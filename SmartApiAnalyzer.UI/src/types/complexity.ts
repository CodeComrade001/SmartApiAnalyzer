export type BackendLanguageKey = "typescript" | "javascript" | "csharp" | "python" | "java";

export const BACKEND_LANGUAGES: { key: BackendLanguageKey; label: string; ext: string; color: string }[] = [
  { key: "typescript", label: "TypeScript", ext: ".ts / .tsx", color: "blue" },
  { key: "javascript", label: "JavaScript", ext: ".js / .jsx", color: "yellow" },
  { key: "csharp", label: "C#", ext: ".cs", color: "violet" },
  { key: "python", label: "Python", ext: ".py", color: "emerald" },
  { key: "java", label: "Java", ext: ".java", color: "orange" },
];

export const FRAMEWORKS: Record<BackendLanguageKey, string[]> = {
  typescript: ["React", "Next.js", "Angular", "NestJS", "Express", "Remix", "fastify", "Astro", "SvelteKit", "Electron", "Vite"],
  javascript: ["React", "Vue", "Express", "Node.js", "Svelte", "Nuxt", "Remix", "fastify", "Vanilla JS", "Electron", "Vite"],
  csharp: ["ASP.NET Core", "Blazor", ".NET MAUI", "WPF", "WinForms", "Unity", "Xamarin", "Orleans"],
  python: ["Django", "Flask", "FastAPI", "Celery", "Scrapy", "PyTorch", "TensorFlow", "Pandas"],
  java: ["Spring Boot", "Quarkus", "Micronaut", "Android", "Vert.x", "Jakarta EE", "Hibernate"],
};

export const DATASETS: Record<BackendLanguageKey, RegExp[]> = {
  typescript: [/\.ts$/, /\.tsx$/],
  javascript: [/\.js$/, /\.jsx$/],
  csharp: [/\.cs$/],
  python: [/\.py$/],
  java: [/\.java$/],
};

export const IGNORED_PATHS = ["node_modules", ".git", "dist", "build", "bin", "obj"];
export const IGNORED_FILES = ["package-lock.json", "yarn.lock", ".DS_Store", "Thumbs.db"];

export interface SingleFile {
  id: string;
  name: string;
  type: "file";
  language: BackendLanguageKey;
  size: number;
  dir: string;
  file: File;
}

export interface AnalyzeFileUpload {
  name: string;
  language: string;
  size: number;
  file: File;
}

export interface FileComplexityReceivedPayload {
  complexityAnalysis: FileComplexityData;
}

export interface FileComplexityData {
  data: ComplexityReport[];
  success: boolean;
  message: string;
}

export interface ComplexityReport {
  nameOfFile: string;
  success: boolean;
  generatedAt: string;
  tierUsed: "free" | "paid";
  summary: ComplexitySummary;
  details: ComplexityDetails;
}

export interface ComplexitySummary {
  itemsAnalyzed: number;
  totalScore: number;
  avgScore: number;
  avgTimeComplexity: string;
  avgSpaceComplexity: string;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

export interface ComplexityDetails {
  functions: ComplexityUnit[];
  arrows: ComplexityUnit[];
  methods: ComplexityUnit[];
  constructors: ComplexityUnit[];
  getters: ComplexityUnit[];
  setters: ComplexityUnit[];
  callbacks: ComplexityUnit[];
  handlers: ComplexityUnit[];
  staticBlocks: ComplexityUnit[];
  topLevelStatements: ComplexityUnit[];
}

export interface ComplexityUnit {
  id: string;
  kind: ComplexityUnitKind;
  name: string;
  startLine: number;
  endLine: number;
  text: string;
  timeComplexity: ComplexityMetric;
  spaceComplexity: ComplexityMetric;
  timeScore: number;
  spaceScore: number;
  totalScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  reasons: ComplexityReason[];
  matchedKeywords: string[];
  tierUsed: "free" | "paid";
}

export type ComplexityUnitKind =
  | "functions"
  | "arrows"
  | "methods"
  | "constructors"
  | "getters"
  | "setters"
  | "callbacks"
  | "handlers"
  | "staticBlocks"
  | "topLevelStatements";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ComplexityMetric {
  notation: string;
  confidence: number;
  flags: string[];
}

export interface ComplexityReason {
  type: "time" | "space";
  pattern: string;
  detail: string;
  impact: "low" | "medium" | "high" | "critical";
  confidence: number;
  lineNumber: number;
}

export type ViewMode = "card" | "list" | "table";
