import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, FileText, CreditCard, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const usageMetrics = [
  {
    label: "API Requests",
    current: 1.4,
    max: 2,
    unit: "M",
    pct: 70,
    note: "Resets in 12 days",
    accent: "violet",
  },
  {
    label: "Active Endpoints",
    current: 30,
    max: 50,
    unit: "",
    pct: 60,
    note: "Current billing cycle",
    accent: "cyan",
  },
  {
    label: "Data Retention",
    current: 7,
    max: 30,
    unit: " days",
    pct: 23,
    note: "Upgrade for longer retention",
    accent: "pink",
  },
  {
    label: "Team Seats",
    current: 6,
    max: 10,
    unit: "",
    pct: 60,
    note: "4 invitations available",
    accent: "amber",
  },
];

const tiers = [
  {
    name: "Developer",
    price: "$0",
    cadence: "/mo",
    desc: "Perfect for side projects.",
    features: ["50k requests / mo", "5 active endpoints", "3 days retention", "Community support"],
    cta: "Current plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/mo",
    desc: "For growing engineering teams.",
    popular: true,
    features: [
      "2M requests / mo",
      "50 active endpoints",
      "30 days retention",
      "Cost insights & alerts",
      "Email support, 24h SLA",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    desc: "For mission-critical APIs.",
    features: [
      "Unlimited requests & endpoints",
      "1 year retention",
      "SAML SSO + RBAC",
      "Dedicated success manager",
      "99.99% uptime SLA",
    ],
    cta: "Contact sales",
  },
];

const invoices = [
  { date: "Apr 1, 2026", amount: "$49.00", status: "Paid", id: "INV-2026-04-001" },
  { date: "Mar 1, 2026", amount: "$49.00", status: "Paid", id: "INV-2026-03-001" },
  { date: "Feb 1, 2026", amount: "$49.00", status: "Paid", id: "INV-2026-02-001" },
  { date: "Jan 1, 2026", amount: "$49.00", status: "Paid", id: "INV-2026-01-001" },
];

export default function Subscription() {
  const { toast } = useToast();
  const handleUpgrade = (plan: string) =>
    toast({ title: "Plan selected", description: `You selected the ${plan} plan. (mock UI)` });

  return (
    <div className="flex flex-col gap-8">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription &amp; Billing</h1>
          <p className="text-muted-foreground">Manage your plan, monitor usage, and download invoices.</p>
        </div>
        <Badge variant="outline" className="glass">
          <Sparkles className="mr-1.5 h-3 w-3 text-[hsl(var(--brand-violet))]" />
          Pro plan • Renews May 1, 2026
        </Badge>
      </motion.div>

      {/* Usage cards */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {usageMetrics.map((m) => (
          <motion.div key={m.label} variants={fadeUp}>
            <Card className={`glass-card border-[hsl(var(--brand-${m.accent}))]/30 h-full`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                <CardDescription className="text-base font-semibold text-foreground">
                  {m.current}{m.unit} <span className="text-xs font-normal text-muted-foreground">/ {m.max}{m.unit}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={m.pct} className="h-2" />
                <p className="mt-2 text-[11px] text-muted-foreground">{m.note}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Plans */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <motion.div key={t.name} variants={fadeUp}>
            <Card
              className={`relative flex h-full flex-col rounded-2xl ${
                t.popular
                  ? "glass-strong border-[hsl(var(--brand-violet))]/40 shadow-2xl glow-violet"
                  : "glass-card"
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-pink))] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight">{t.price}</span>
                  {t.cadence && <span className="ml-1 text-sm text-muted-foreground">{t.cadence}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand-emerald))]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={t.popular ? "default" : "outline"}
                  disabled={t.disabled}
                  onClick={() => handleUpgrade(t.name)}
                >
                  {t.cta}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Billing details */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid gap-5 md:grid-cols-2">
        <motion.div variants={fadeUp}>
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment method
              </CardTitle>
              <CardDescription>Auto-billed monthly on the 1st.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] text-xs font-bold text-white">
                    VISA
                  </div>
                  <div>
                    <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                    <div className="text-xs text-muted-foreground">Expires 09/28</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Spend forecast
              </CardTitle>
              <CardDescription>Projected end-of-month cost.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold gradient-text">$49.00</span>
                <span className="text-sm text-muted-foreground">/ $49 limit</span>
              </div>
              <Progress value={100} className="mt-4 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Based on current usage. No overages on Pro.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Invoice history */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoice history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-border/40">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border/40">
                      <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                      <td className="px-4 py-3">{inv.date}</td>
                      <td className="px-4 py-3 text-right font-medium">{inv.amount}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Download PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
