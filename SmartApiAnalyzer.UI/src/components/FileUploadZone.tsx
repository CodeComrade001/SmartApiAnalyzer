import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileCode2, AlertCircle, ChevronDown, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DATASETS,
  IGNORED_FILES,
  type BackendLanguageKey,
  type SingleFile,
} from "@/types/complexity";

function isIgnored(name: string, ignoredPatterns: string[]): boolean {
  if (IGNORED_FILES.includes(name)) return true;
  return ignoredPatterns.some((pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed || trimmed.startsWith("#")) return false;
    // glob-like: leading * matches partial
    if (trimmed.startsWith("*")) {
      return name.endsWith(trimmed.slice(1));
    }
    return name === trimmed || name.endsWith(`/${trimmed}`);
  });
}

function matchesLanguage(fileName: string, lang: BackendLanguageKey): boolean {
  return DATASETS[lang].some((p: { test: (arg0: string) => any; }) => p.test(fileName));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const LANG_COLORS: Record<BackendLanguageKey, string> = {
  typescript: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
  javascript: "from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/20",
  csharp: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
  python: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
  java: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20",
};

const ACCEPT_BY_LANG: Record<BackendLanguageKey, string> = {
  typescript: ".ts,.tsx",
  javascript: ".js,.jsx",
  csharp: ".cs",
  python: ".py",
  java: ".java",
};

interface Props {
  language: BackendLanguageKey;
  framework: string;
  allowFolderUpload?: boolean;
  ignoredPatterns: string[];
  onAnalyze: (files: SingleFile[]) => void;
  isAnalyzing: boolean;
}

// export default function FileUploadZone({ language, ignoredPatterns, onAnalyze, isAnalyzing }: Props) {
//   const [files, setFiles] = useState<SingleFile[]>([]);
//   const [dragging, setDragging] = useState(false);
//   const [wrongLangFiles, setWrongLangFiles] = useState<string[]>([]);
//   const [ignoredDropped, setIgnoredDropped] = useState<string[]>([]);
//   const [showAll, setShowAll] = useState(false);
//   const inputRef = useRef<HTMLInputElement>(null);

//   // Clear files when language changes
//   useEffect(() => {
//     setFiles([]);
//     setWrongLangFiles([]);
//     setIgnoredDropped([]);
//   }, [language]);

//   const addFiles = useCallback(
//     (incoming: File[]) => {
//       const accepted: SingleFile[] = [];
//       const wrongLang: string[] = [];
//       const ignoredList: string[] = [];

//       for (const file of incoming) {
//         // Check ignore patterns
//         if (isIgnored(file.name, ignoredPatterns)) {
//           ignoredList.push(file.name);
//           continue;
//         }
//         // Enforce single language
//         if (!matchesLanguage(file.name, language)) {
//           wrongLang.push(file.name);
//           continue;
//         }
//         // Deduplicate
//         if (files.some((f) => f.name === file.name)) continue;
//         accepted.push({
//           id: `${file.name}-${Date.now()}-${Math.random()}`,
//           name: file.name,
//           type: "file",
//           language,
//           size: file.size,
//           dir: "",
//           file,
//         });
//       }

//       setFiles((prev) => [...prev, ...accepted]);
//       setWrongLangFiles(wrongLang.slice(0, 5));
//       setIgnoredDropped(ignoredList.slice(0, 5));
//     },
//     [files, language, ignoredPatterns]
//   );

//   const onDrop = useCallback(
//     (e: React.DragEvent) => {
//       e.preventDefault();
//       setDragging(false);
//       addFiles(Array.from(e.dataTransfer.files));
//     },
//     [addFiles]
//   );

//   const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       addFiles(Array.from(e.target.files));
//       e.target.value = "";
//     }
//   };

//   const remove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
//   const clear = () => {
//     setFiles([]);
//     setWrongLangFiles([]);
//     setIgnoredDropped([]);
//   };

//   const visibleFiles = showAll ? files : files.slice(0, 6);

//   return (
//     <div className="space-y-4">
//       {/* Drop area */}
//       <div
//         onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
//         onDragLeave={() => setDragging(false)}
//         onDrop={onDrop}
//         onClick={() => inputRef.current?.click()}
//         className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
//           dragging
//             ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet))]/5"
//             : "border-border/60 hover:border-[hsl(var(--brand-violet))]/60 hover:bg-muted/30"
//         }`}
//       >
//         <input
//           ref={inputRef}
//           type="file"
//           multiple
//           className="hidden"
//           accept={ACCEPT_BY_LANG[language]}
//           onChange={onInputChange}
//         />
//         <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
//         <AnimatePresence>
//           {dragging && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 rounded-xl bg-[hsl(var(--brand-violet))]/10"
//             />
//           )}
//         </AnimatePresence>

//         <motion.div
//           animate={{ y: dragging ? -4 : 0 }}
//           transition={{ type: "spring", stiffness: 300 }}
//           className="relative flex flex-col items-center gap-3"
//         >
//           <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br transition-all ${
//             dragging
//               ? "border-[hsl(var(--brand-violet))]/50 from-[hsl(var(--brand-violet))]/30 to-[hsl(var(--brand-cyan))]/10"
//               : "border-border/50 from-muted/40 to-muted/10 group-hover:from-[hsl(var(--brand-violet))]/20"
//           }`}>
//             <Upload className={`h-6 w-6 transition-colors ${dragging ? "text-[hsl(var(--brand-violet))]" : "text-muted-foreground group-hover:text-[hsl(var(--brand-violet))]"}`} />
//           </div>
//           <div>
//             <p className="text-sm font-semibold">
//               {dragging ? "Drop files to analyze" : "Drag and drop source files"}
//             </p>
//             <p className="mt-1 text-xs text-muted-foreground">
//               or click to browse — accepts{" "}
//               <span className={`font-semibold ${LANG_COLORS[language].split(" ").find(c => c.startsWith("text-")) ?? ""}`}>
//                 {ACCEPT_BY_LANG[language].split(",").join(", ")}
//               </span>{" "}
//               only
//             </p>
//           </div>
//         </motion.div>
//       </div>

//       {/* Wrong language warning */}
//       <AnimatePresence>
//         {wrongLangFiles.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             className="flex items-start gap-2 rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-xs text-pink-400"
//           >
//             <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" />
//             <span>
//               Wrong language — only one language per upload. Skipped: {wrongLangFiles.join(", ")}
//             </span>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Ignored by .complexityignore warning */}
//       <AnimatePresence>
//         {ignoredDropped.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400"
//           >
//             <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
//             <span>Excluded by .complexityignore: {ignoredDropped.join(", ")}</span>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* File list */}
//       <AnimatePresence>
//         {files.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: 8 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="space-y-2"
//           >
//             <div className="flex items-center justify-between">
//               <span className="text-xs font-medium text-muted-foreground">
//                 {files.length} file{files.length !== 1 ? "s" : ""} queued
//               </span>
//               <button
//                 onClick={clear}
//                 className="text-[11px] text-muted-foreground transition hover:text-foreground"
//               >
//                 Clear all
//               </button>
//             </div>

//             <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
//               {visibleFiles.map((f) => (
//                 <motion.div
//                   key={f.id}
//                   initial={{ opacity: 0, scale: 0.97 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   className={`flex items-center gap-2.5 rounded-xl border bg-gradient-to-br px-3 py-2.5 ${LANG_COLORS[f.language]}`}
//                 >
//                   <FileCode2 className="h-4 w-4 shrink-0 opacity-70" />
//                   <div className="min-w-0 flex-1">
//                     <p className="truncate text-xs font-medium">{f.name}</p>
//                     <p className="text-[10px] opacity-60">{formatBytes(f.size)}</p>
//                   </div>
//                   <button
//                     onClick={() => remove(f.id)}
//                     className="shrink-0 rounded-full p-0.5 opacity-50 transition hover:opacity-100"
//                   >
//                     <X className="h-3.5 w-3.5" />
//                   </button>
//                 </motion.div>
//               ))}
//             </div>

//             {files.length > 6 && (
//               <button
//                 onClick={() => setShowAll(!showAll)}
//                 className="flex w-full items-center justify-center gap-1 rounded-xl border border-border/40 py-2 text-xs text-muted-foreground transition hover:bg-muted/30"
//               >
//                 <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
//                 {showAll ? "Show less" : `Show ${files.length - 6} more files`}
//               </button>
//             )}

//             <Button
//               className="w-full rounded-xl"
//               disabled={isAnalyzing || files.length === 0}
//               onClick={() => onAnalyze(files)}
//               style={{
//                 background: isAnalyzing
//                   ? undefined
//                   : "linear-gradient(135deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))",
//               }}
//             >
//               {isAnalyzing ? (
//                 <span className="flex items-center gap-2">
//                   <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
//                   Analyzing {files.length} file{files.length !== 1 ? "s" : ""}…
//                 </span>
//               ) : (
//                 `Analyze ${files.length} file${files.length !== 1 ? "s" : ""}`
//               )}
//             </Button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

export default function FileUploadZone({
  language,
  framework,
  ignoredPatterns,
  allowFolderUpload,
  onAnalyze,
  isAnalyzing,
}: Props) {
  const [files, setFiles] = useState<SingleFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [wrongLangFiles, setWrongLangFiles] = useState<string[]>([]);
  const [ignoredDropped, setIgnoredDropped] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles([]);
    setWrongLangFiles([]);
    setIgnoredDropped([]);
  }, [language, framework]);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const accepted: SingleFile[] = [];
      const wrongLang: string[] = [];
      const ignoredList: string[] = [];

      for (const file of incoming) {
        const relativePath =
          (file as any).webkitRelativePath || file.name;

        // ignore patterns
        if (
          isIgnored(file.name, ignoredPatterns) ||
          isIgnored(relativePath, ignoredPatterns)
        ) {
          ignoredList.push(relativePath);
          continue;
        }

        // language filtering
        if (!matchesLanguage(file.name, language)) {
          wrongLang.push(relativePath);
          continue;
        }

        // dedupe by path
        if (
          files.some(
            (f) =>
              (f.path || f.name) === relativePath
          )
        )
          continue;

        accepted.push({
          id: `${relativePath}-${Date.now()}-${Math.random()}`,
          name: file.name,
          path: relativePath,
          type: "file",
          language,
          size: file.size,
          dir:
            relativePath.includes("/")
              ? relativePath.split("/").slice(0, -1).join("/")
              : "",
          file,
        });
      }

      setFiles((prev) => [...prev, ...accepted]);
      setWrongLangFiles(wrongLang.slice(0, 5));
      setIgnoredDropped(ignoredList.slice(0, 5));
    },
    [files, language, ignoredPatterns]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const remove = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const clear = () => {
    setFiles([]);
    setWrongLangFiles([]);
    setIgnoredDropped([]);
  };

  const visibleFiles = showAll ? files : files.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragging
          ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet))]/5"
          : "border-border/60 hover:border-[hsl(var(--brand-violet))]/60 hover:bg-muted/30"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={ACCEPT_BY_LANG[language]}
          {...(allowFolderUpload
            ? {
              webkitdirectory: "true",
              directory: "true",
            }
            : {})}
          onChange={onInputChange}
        />

        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

        <motion.div
          animate={{ y: dragging ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative flex flex-col items-center gap-3"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
            <Upload className="h-6 w-6 text-muted-foreground group-hover:text-[hsl(var(--brand-violet))]" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              {dragging
                ? allowFolderUpload
                  ? "Drop project folder here"
                  : "Drop files to analyze"
                : allowFolderUpload
                  ? "Drag & drop full project folder"
                  : "Drag & drop source files"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse{" "}
              {allowFolderUpload ? "folder/files" : "files"} — accepts{" "}
              {ACCEPT_BY_LANG[language].split(",").join(", ")}
            </p>
          </div>
        </motion.div>
      </div>

      {/* wrong language */}
      {wrongLangFiles.length > 0 && (
        <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-xs text-pink-400">
          Wrong language skipped: {wrongLangFiles.join(", ")}
        </div>
      )}

      {/* ignored */}
      {ignoredDropped.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
          Excluded by .complexityignore: {ignoredDropped.join(", ")}
        </div>
      )}

      {/* file queue */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} queued
            </span>

            <button
              onClick={clear}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Clear all
            </button>
          </div>

          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleFiles.map((f) => (
              <div
                key={f.id}
                className={`rounded-xl border px-3 py-2 ${LANG_COLORS[f.language]}`}
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 opacity-70" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {f.path || f.name}
                    </p>
                    <p className="text-[10px] opacity-60">
                      {formatBytes(f.size)}
                    </p>
                  </div>

                  <button title="Open file" onClick={() => remove(f.id)}>
                    <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {files.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full rounded-xl border border-border/40 py-2 text-xs"
            >
              {showAll
                ? "Show less"
                : `Show ${files.length - 6} more files`}
            </button>
          )}

          <Button
            className="w-full rounded-xl"
            disabled={isAnalyzing}
            onClick={() => onAnalyze(files)}
          >
            {isAnalyzing
              ? `Analyzing ${files.length} files...`
              : `Analyze ${files.length} file${files.length !== 1 ? "s" : ""
              }`}
          </Button>
        </div>
      )}
    </div>
  );
}
