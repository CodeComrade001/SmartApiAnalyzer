import { useEffect, useState } from "react";
import { Check, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DeploymentFieldValue, DeploymentModule, DeploymentField } from "@/data/deploymentModules";

type DeploymentFormValues = Record<string, DeploymentFieldValue>;

interface DeploymentConfigFormProps {
  module: DeploymentModule;
  initialValues: DeploymentFormValues;
  lastSavedAt?: string | null;
  compact?: boolean;
  onSave: (values: DeploymentFormValues) => void;
  onReset: (values: DeploymentFormValues) => void;
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: DeploymentField;
  value: DeploymentFieldValue;
  onChange: (value: DeploymentFieldValue) => void;
}) {
  if (field.type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/45 bg-muted/10 px-3.5 py-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">{field.label}</label>
          {field.help && <p className="text-[11px] leading-relaxed text-muted-foreground">{field.help}</p>}
        </div>
        <Switch
          data-testid={`switch-${field.id}`}
          checked={Boolean(value)}
          onCheckedChange={onChange}
          aria-label={field.label}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label data-testid={`label-${field.id}`} className="text-sm font-medium">{field.label}</label>
      {field.type === "select" ? (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger data-testid={`select-${field.id}`} className="bg-background/50">
            <SelectValue placeholder={field.placeholder ?? "Choose an option"} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value} data-testid={`option-${field.id}-${option.value}`}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "textarea" ? (
        <Textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          data-testid={`textarea-${field.id}`}
          placeholder={field.placeholder}
          className="min-h-24 resize-y bg-background/50"
        />
      ) : (
        <Input
          value={field.type === "number" ? String(value ?? "") : String(value ?? "")}
          onChange={(event) => onChange(
            field.type === "number"
              ? event.target.value === "" ? "" : event.target.valueAsNumber
              : event.target.value,
          )}
          data-testid={`input-${field.id}`}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          className="bg-background/50"
          type={field.type}
        />
      )}
      {field.help && <p className="text-[11px] leading-relaxed text-muted-foreground">{field.help}</p>}
    </div>
  );
}

export function DeploymentConfigForm({
  module,
  initialValues,
  lastSavedAt,
  compact = false,
  onSave,
  onReset,
}: DeploymentConfigFormProps) {
  const [values, setValues] = useState<DeploymentFormValues>(initialValues);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const enabled = Boolean(values.enabled);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const updateValue = (id: string, value: DeploymentFieldValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(values);
  };

  const handleReset = () => {
    const defaults = { ...module.defaultValues };
    setValues(defaults);
    onReset(defaults);
  };

  return (
    <form
      onSubmit={handleSave}
      className={compact ? "space-y-4" : "space-y-6"}
      data-testid={`form-${module.slug}`}
    >
      <Card className="glass-card overflow-hidden rounded-2xl border-[hsl(var(--deployment-signal))]/20">
        <CardHeader className={compact ? "px-4 pb-3 pt-4" : "px-5 pb-4 pt-5"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--deployment-signal))]/25 bg-[hsl(var(--deployment-signal))]/10">
                <SlidersHorizontal className="size-4 text-[hsl(var(--deployment-signal))]" />
              </div>
              <div>
                <CardTitle className="text-sm">Configuration state</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Local provisional settings. No analysis is executed from this screen.
                </CardDescription>
              </div>
            </div>
            <Badge
              data-testid="status-config-save"
              variant="outline"
              className={isDirty
                ? "border-[hsl(var(--deployment-signal))]/40 text-[hsl(var(--deployment-signal))]"
                : "border-emerald-500/35 text-emerald-400"}
            >
              {isDirty ? "Unsaved changes" : lastSavedAt ? `Saved ${lastSavedAt}` : "Not saved yet"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className={compact ? "px-4 pb-4" : "px-5 pb-5"}>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/55 bg-[hsl(var(--deployment-signal))]/[0.06] px-4 py-3.5">
            <div>
              <label className="text-sm font-semibold">Module enabled</label>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {enabled ? "Ready to be connected when the deployment contract is available." : "Configuration is retained but this module is inactive."}
              </p>
            </div>
            <Switch
              data-testid="switch-module-enabled"
              checked={enabled}
              onCheckedChange={(value) => updateValue("enabled", value)}
              aria-label="Enable deployment module"
            />
          </div>
        </CardContent>
      </Card>

      {module.groups.map((group) => (
        <Card key={group.id} className="glass-card rounded-2xl">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="text-sm">{group.title}</CardTitle>
            <CardDescription className="max-w-2xl text-xs leading-relaxed">{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 px-5 pb-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <FieldEditor
                  field={field}
                  value={values[field.id] ?? ""}
                  onChange={(value) => updateValue(field.id, value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isDirty ? (
            <span className="flex items-center gap-1.5 text-[hsl(var(--deployment-signal))]">
              <span className="size-1.5 rounded-full bg-[hsl(var(--deployment-signal))]" />
              Changes are local until applied
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Check className="size-3.5" />
              Configuration is in sync
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="button-reset-config"
            onClick={handleReset}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="size-3.5" />
            Reset defaults
          </Button>
          <Button
            type="submit"
            size="sm"
            data-testid="button-save-config"
            disabled={!isDirty}
            className="gap-1.5 bg-[hsl(var(--deployment-signal))] text-[hsl(var(--deployment-ink))] hover:bg-[hsl(var(--deployment-signal))]/90"
          >
            <Save className="size-3.5" />
            Apply configuration
          </Button>
        </div>
      </div>
    </form>
  );
}