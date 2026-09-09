import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Database, LockKeyhole, CircleDashed } from "lucide-react";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentConfigForm } from "@/components/AgentConfigForm";
import { categoryMeta, type AgentKey } from "@/data/agentCatalog";
import { agentConfigurationByKey, getAgentCategory } from "@/data/agentConfigurations";
import { DeploymentFieldValue } from "@/data/deploymentModules";

type ConfigValues = Record<string, DeploymentFieldValue>;

function getStoredValues(agentKey: AgentKey): ConfigValues {
  const definition = agentConfigurationByKey[agentKey];
  if (typeof window === "undefined") return { ...definition.defaultValues };
  try {
    const stored = window.localStorage.getItem(`pulse-agent-config:${agentKey}`);
    return stored ? { ...definition.defaultValues, ...(JSON.parse(stored) as ConfigValues) } : { ...definition.defaultValues };
  } catch {
    return { ...definition.defaultValues };
  }
}

function formatSavedTime(timestamp: string | null) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function UnknownAgentConfiguration() {
  return (
    <Card className="glass-card rounded-2xl border-amber-500/25">
      <CardContent className="flex flex-col items-start gap-4 p-7">
        <CircleDashed className="size-7 text-amber-400" />
        <div>
          <h1 className="text-xl font-semibold">Agent configuration not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose an agent from the Agent Scan page.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/agents">Return to Agent Scan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AgentConfigurationPage() {
  const { agentKey: routeAgentKey } = useParams<{ agentKey?: string }>();
  const agentKey = routeAgentKey as AgentKey | undefined;
  const definition = agentKey ? agentConfigurationByKey[agentKey] : undefined;
  const [savedValues, setSavedValues] = useState<ConfigValues>(() => definition ? getStoredValues(definition.key) : {});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState("Local-only configuration; no analysis or scan is generated here.");

  useEffect(() => {
    if (!definition) return;
    setSavedValues(getStoredValues(definition.key));
    setSavedAt(null);
    setNotice("Local-only configuration; no analysis or scan is generated here.");
  }, [definition]);

  if (!definition) return <UnknownAgentConfiguration />;

  const Icon = definition.icon;
  const meta = categoryMeta[getAgentCategory(definition.key)];

  const handleSave = (values: ConfigValues) => {
    const timestamp = new Date().toISOString();
    window.localStorage.setItem(`pulse-agent-config:${definition.key}`, JSON.stringify(values));
    setSavedValues(values);
    setSavedAt(timestamp);
    setNotice("Configuration applied locally. Agent Scan behavior is unchanged.");
  };

  const handleReset = () => {
    setNotice("Defaults loaded into this form. Apply configuration to persist the reset.");
  };

  return (
    <div className="space-y-7" data-testid={`page-agent-configuration-${definition.key}`}>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/agents"><ArrowLeft className="size-4" /> Back to Agent Scan</Link>
        </Button>
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[hsl(var(--deployment-ink))] p-6 shadow-2xl sm:p-8">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[hsl(var(--agent-config-accent))]/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`border-current/40 bg-current/10 font-mono text-[10px] uppercase tracking-[0.18em] ${meta.color}`}>
                  {meta.label} agent
                </Badge>
                <Badge variant="outline" className="border-border/70 bg-background/10 text-[10px] text-muted-foreground">
                  Provisional configuration
                </Badge>
              </div>
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border ${meta.border} ${meta.bg}`}>
                  <Icon className={`size-5 ${meta.color}`} />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{definition.eyebrow}</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{definition.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{definition.description}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-64">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <Database className="mb-3 size-4 text-[hsl(var(--agent-config-accent))]" />
                <p className="font-medium text-white">Local state</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Stored in this browser only.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <LockKeyhole className="mb-3 size-4 text-[hsl(var(--deployment-signal))]" />
                <p className="font-medium text-white">No execution</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">No scan or analysis is run.</p>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 text-[hsl(var(--agent-config-accent))]" />
          <span>{notice}</span>
        </div>
        {savedAt && <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Last applied {formatSavedTime(savedAt)}</span>}
      </div>

      <AgentConfigForm
        definition={definition}
        initialValues={savedValues}
        lastSavedAt={formatSavedTime(savedAt)}
        onSave={handleSave}
        onReset={handleReset}
      />

      <Card className="glass-card rounded-2xl border-border/40">
        <CardHeader className="px-5 pb-3 pt-5">
          <CardTitle className="text-sm">Contract boundary</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">This screen is intentionally isolated from scan results and agent execution.</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">
          When a backend contract is introduced, this module can swap its persistence adapter without changing the configuration fields or navigation.
        </CardContent>
      </Card>
    </div>
  );
}