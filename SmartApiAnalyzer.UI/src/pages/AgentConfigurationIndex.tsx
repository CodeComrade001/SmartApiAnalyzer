import { ArrowRight, Settings2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AGENTS, categoryMeta, type AgentCategory } from "@/data/agentCatalog";
import { agentConfigurationByKey, getAgentCategory } from "@/data/agentConfigurations";

const categories: AgentCategory[] = ["validation", "security", "performance", "alerting"];
const orderedConfigurations = AGENTS.map((agent) => agentConfigurationByKey[agent.key]);

export default function AgentConfigurationIndex() {
  return (
    <div className="space-y-7" data-testid="page-agent-configuration-index">
      <header className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-card p-6 shadow-2xl sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-25" />
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 gap-2 border-violet-400/40 bg-violet-400/10 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300">
              <Settings2 className="size-3" />
              Agent configuration library
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Configure every scan signal</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tune the thresholds, policies, request profiles, and notification rules for each agent before you run a scan.
              These settings are provisional and stored locally until a backend contract is connected.
            </p>
          </div>
          <Link href="/dashboard/agents">
            <Button variant="outline" className="gap-2 rounded-full">
              Back to Agent Scan
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="space-y-7">
        {categories.map((category) => {
          const meta = categoryMeta[category];
          const Icon = meta.icon;
          const definitions = orderedConfigurations.filter((definition) => getAgentCategory(definition.key) === category);
          return (
            <section key={category} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className={`flex size-8 items-center justify-center rounded-xl ${meta.bg}`}>
                  <Icon className={`size-4 ${meta.color}`} />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold ${meta.color}`}>{meta.label} agents</h2>
                  <p className="text-[11px] text-muted-foreground">{definitions.length} configurable signal{definitions.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {definitions.map((definition) => {
                  const AgentIcon = definition.icon;
                  return (
                    <Link key={definition.key} href={`/dashboard/agents/configuration/${definition.key}`}>
                      <Card className="group h-full cursor-pointer rounded-2xl border-border/50 bg-card/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-card hover:shadow-xl hover:shadow-violet-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex size-9 items-center justify-center rounded-xl ${meta.bg}`}>
                            <AgentIcon className={`size-4 ${meta.color}`} />
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold">{definition.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{definition.description}</p>
                        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">{definition.key}</p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}