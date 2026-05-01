import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  User,
  Bell,
  Palette,
  Plug,
  Trash2,
  Github,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { motion } from "framer-motion";

const integrations = [
  { name: "Slack", desc: "Send alerts to channels", connected: true, icon: Mail },
  { name: "GitHub", desc: "Link deployments to commits", connected: true, icon: Github },
  { name: "PagerDuty", desc: "Escalate critical incidents", connected: false, icon: Bell },
  { name: "Datadog", desc: "Forward metrics to Datadog", connected: false, icon: Plug },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const mockApiKey = "spa_prod_9f8e7d6c5b4a3f2e1d0c";

  const copyKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    toast({ title: "Copied", description: "API key copied to your clipboard." });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, integrations, and preferences.</p>
      </motion.div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="glass-card grid h-11 w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="account">
            <User className="mr-2 h-3.5 w-3.5" /> Account
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="mr-2 h-3.5 w-3.5" /> API
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="mr-2 h-3.5 w-3.5" /> Integrations
          </TabsTrigger>
        </TabsList>

        {/* ACCOUNT */}
        <TabsContent value="account" className="mt-6 space-y-5">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Visible to teammates in your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue="Alex Morgan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex@pulse.io" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Staff Engineer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Input id="org" defaultValue="Acme Engineering" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/40 bg-muted/20">
              <Button>Save changes</Button>
            </CardFooter>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand-emerald))]" />
                Two-factor authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium">Authenticator app</p>
                <p className="text-xs text-muted-foreground">Google Authenticator, 1Password, or any TOTP app.</p>
              </div>
              <Switch defaultChecked />
            </CardContent>
          </Card>

          <Card className="glass-card border-[hsl(var(--brand-pink))]/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-pink))]">
                <Trash2 className="h-4 w-4" /> Danger zone
              </CardTitle>
              <CardDescription>Irreversible actions. Proceed with care.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between rounded-xl border border-[hsl(var(--brand-pink))]/30 bg-[hsl(var(--brand-pink))]/5 p-4">
              <div>
                <p className="text-sm font-medium">Delete workspace</p>
                <p className="text-xs text-muted-foreground">All data, dashboards, and integrations will be removed.</p>
              </div>
              <Button variant="destructive" size="sm">Delete workspace</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="mt-6 space-y-5">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>API keys</CardTitle>
              <CardDescription>Use these to authenticate the Pulse SDK in your services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Production key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="api-key"
                      type={showKey ? "text" : "password"}
                      value={mockApiKey}
                      readOnly
                      className="pl-9 font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button variant="outline" onClick={copyKey}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Created Jan 14, 2026 • Last used 2 minutes ago.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/40 bg-muted/20 gap-2">
              <Button variant="outline">Roll key</Button>
              <Button variant="outline">Generate staging key</Button>
            </CardFooter>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Webhook endpoints</CardTitle>
              <CardDescription>Receive real-time events about your APIs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { url: "https://hooks.acme.com/pulse/alerts", events: "alerts.*", status: "active" },
                { url: "https://hooks.acme.com/pulse/insights", events: "insights.*", status: "active" },
              ].map((w, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">{w.url}</p>
                    <p className="text-xs text-muted-foreground">Events: {w.events}</p>
                  </div>
                  <Badge variant="outline" className="bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30">
                    {w.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full">+ Add webhook</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance" className="mt-6 space-y-5">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how Pulse looks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`relative overflow-hidden rounded-xl border p-4 text-left transition ${
                      theme === t
                        ? "border-[hsl(var(--brand-violet))]/60 bg-[hsl(var(--brand-violet))]/5"
                        : "border-border/40 hover:border-border"
                    }`}
                  >
                    <div className={`mb-3 flex h-16 items-end gap-1 rounded-lg p-2 ${
                      t === "light" ? "bg-slate-100" : t === "dark" ? "bg-slate-900" : "bg-gradient-to-r from-slate-100 to-slate-900"
                    }`}>
                      <div className={`h-3 w-1/3 rounded ${t === "light" ? "bg-slate-300" : "bg-slate-700"}`} />
                      <div className={`h-6 w-1/3 rounded ${t === "light" ? "bg-violet-400" : "bg-violet-500"}`} />
                      <div className={`h-4 w-1/3 rounded ${t === "light" ? "bg-cyan-400" : "bg-cyan-500"}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{t}</span>
                      {theme === t && (
                        <Badge variant="outline" className="bg-[hsl(var(--brand-violet))]/15 text-[hsl(var(--brand-violet))]">
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Density</CardTitle>
              <CardDescription>Adjust spacing across the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select defaultValue="comfortable">
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-6 space-y-5">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Connected services</CardTitle>
              <CardDescription>Wire Pulse into the tools your team already uses.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {integrations.map((it) => (
                <div
                  key={it.name}
                  className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--brand-violet))]/20 to-[hsl(var(--brand-cyan))]/20">
                      <it.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{it.desc}</p>
                    </div>
                  </div>
                  {it.connected ? (
                    <Badge variant="outline" className="bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30">
                      Connected
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline">Connect</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </CardTitle>
              <CardDescription>Choose when Pulse should reach out.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { id: "err", title: "Error rate spikes", desc: "Email when error rate exceeds 5%", on: true },
                { id: "cost", title: "Cost anomalies", desc: "Notify if projected monthly cost jumps >20%", on: true },
                { id: "weekly", title: "Weekly digest", desc: "Performance summary every Monday", on: false },
                { id: "deploy", title: "Deployment regressions", desc: "Catch p95 increases tied to specific commits", on: true },
              ].map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor={n.id} className="text-sm">{n.title}</Label>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch id={n.id} defaultChecked={n.on} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
