import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Database, LockKeyhole, RotateCcw } from "lucide-react";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeploymentConfigForm } from "@/components/DeploymentConfigForm";
import { DeploymentModule, deploymentModuleBySlug } from "@/data/deploymentModules";

type ConfigValues = Record<string, string | number | boolean>;

function getStoredValues(module: DeploymentModule): ConfigValues {
  if (typeof window === "undefined") return { ...module.defaultValues };
  try {
    const stored = window.localStorage.getItem(`pulse-deployment-config:${module.key}`);
    if (!stored) return { ...module.defaultValues };
    return { ...module.defaultValues, ...(JSON.parse(stored) as ConfigValues) };
  } catch {
    return { ...module.defaultValues };
  }
}

function formatSavedTime(timestamp: string | null) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function UnknownDeploymentModule() {
  return (
    <Card className="glass-card rounded-2xl border-amber-500/25">
      <CardContent className="flex flex-col items-start gap-4 p-7">
        <CircleDashed className="size-7 text-amber-400" />
        <div>
          <h1 className="text-xl font-semibold">Configuration module not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a deployment intelligence module from the sidebar.</p>
        </div>
        <Button asChild variant="outline" size="sm" data-testid="button-return-deployment">
          <Link href="/dashboard/deployment-intelligence/risk-assessment">Open Risk Assessment</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DeploymentIntelligencePage({ moduleSlug: configuredSlug }: { moduleSlug?: string }) {
  const { module: routeSlug } = useParams<{ module?: string }>();
  const moduleSlug = configuredSlug ?? routeSlug;
  const module = moduleSlug ? deploymentModuleBySlug[moduleSlug] : undefined;
  const storedDefaults = useMemo(() => (module ? getStoredValues(module) : {}), [module]);
  const [savedValues, setSavedValues] = useState<ConfigValues>(storedDefaults);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState("Local-only configuration; no deployment result is generated here.");

  useEffect(() => {
    if (!module) return;
    setSavedValues(getStoredValues(module));
    setSavedAt(null);
    setNotice("Local-only configuration; no deployment result is generated here.");
  }, [module]);

  if (!module) return <UnknownDeploymentModule />;

  const Icon = module.icon;

  const handleSave = (values: ConfigValues) => {
    const timestamp = new Date().toISOString();
    window.localStorage.setItem(`pulse-deployment-config:${module.key}`, JSON.stringify(values));
    setSavedValues(values);
    setSavedAt(timestamp);
    setNotice("Configuration applied locally. It is ready for a future backend contract.");
  };

  const handleReset = (values: ConfigValues) => {
    setNotice("Defaults loaded into this form. Apply configuration to persist the reset.");
    void values;
  };

  return (
    <div className="space-y-7" data-testid={`page-${module.slug}`}>
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[hsl(var(--deployment-ink))] p-6 shadow-2xl sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[hsl(var(--deployment-signal))]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-[hsl(var(--deployment-signal))]/40 bg-[hsl(var(--deployment-signal))]/10 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--deployment-signal))]">
                Deployment Intelligence
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/10 text-[10px] text-muted-foreground">
                Provisional configuration
              </Badge>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--deployment-teal))]/35 bg-[hsl(var(--deployment-teal))]/10">
                <Icon className="size-5 text-[hsl(var(--deployment-teal))]" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{module.eyebrow}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{module.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{module.description}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-64">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <Database className="mb-3 size-4 text-[hsl(var(--deployment-teal))]" />
              <p className="font-medium text-white">Local state</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Stored in this browser only.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <LockKeyhole className="mb-3 size-4 text-[hsl(var(--deployment-signal))]" />
              <p className="font-medium text-white">No execution</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">No analysis or deployment is run.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="status-deployment-notice">
          <CheckCircle2 className="size-4 text-[hsl(var(--deployment-teal))]" />
          <span>{notice}</span>
        </div>
        {savedAt && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground" data-testid="text-last-saved">
            Last applied {formatSavedTime(savedAt)}
          </span>
        )}
      </div>

      <DeploymentConfigForm
        module={module}
        initialValues={savedValues}
        lastSavedAt={formatSavedTime(savedAt)}
        onSave={handleSave}
        onReset={handleReset}
      />

      <Card className="glass-card rounded-2xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-3 pt-5">
          <div>
            <CardTitle className="text-sm">Contract boundary</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">This screen is intentionally isolated from scan results and agent execution.</p>
          </div>
          <RotateCcw className="size-4 text-muted-foreground/60" />
        </CardHeader>
        <CardContent className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">
          When a backend contract is introduced, this module can swap its persistence adapter without changing the configuration fields or navigation.
        </CardContent>
      </Card>
    </div>
  );
}