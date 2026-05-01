import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Download, Activity, Clock, AlertTriangle, Server } from "lucide-react";
import { Endpoint } from "@/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { mockEndpoints } from "@/services/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const statusStyles: Record<string, string> = {
  healthy: "bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30",
  degraded: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30",
  down: "bg-[hsl(var(--brand-pink))]/15 text-[hsl(var(--brand-pink))] border-[hsl(var(--brand-pink))]/30",
};

const methodStyles: Record<string, string> = {
  GET: "bg-[hsl(var(--brand-cyan))]/15 text-[hsl(var(--brand-cyan))]",
  POST: "bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))]",
  PUT: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))]",
  DELETE: "bg-[hsl(var(--brand-pink))]/15 text-[hsl(var(--brand-pink))]",
  PATCH: "bg-[hsl(var(--brand-violet))]/15 text-[hsl(var(--brand-violet))]",
};

const sparklineData = (seed: number) =>
  Array.from({ length: 24 }).map((_, i) => ({
    x: i,
    y: 50 + Math.sin(i * 0.5 + seed) * 20 + Math.random() * 25,
  }));


export default function Endpoints() {
  //mock data testing - replace with real data fetching logic 
  const endpoints = mockEndpoints
  const isLoading = false

  const [search, setSearch] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);

  const filtered = endpoints?.filter(
    (ep) =>
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.service.toLowerCase().includes(search.toLowerCase())
  );

  const stats = endpoints
    ? {
      total: endpoints.length,
      healthy: endpoints.filter((e) => e.status === "healthy").length,
      degraded: endpoints.filter((e) => e.status === "degraded").length,
      down: endpoints.filter((e) => e.status === "down").length,
    }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Endpoints</h1>
          <p className="text-muted-foreground">Performance &amp; health across all your API routes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Stat strip */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total endpoints", value: stats?.total ?? "—", icon: Server, accent: "violet" },
          { label: "Healthy", value: stats?.healthy ?? "—", icon: Activity, accent: "emerald" },
          { label: "Degraded", value: stats?.degraded ?? "—", icon: Clock, accent: "amber" },
          { label: "Down", value: stats?.down ?? "—", icon: AlertTriangle, accent: "pink" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`glass-card border-[hsl(var(--brand-${s.accent}))]/30`}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold">{s.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--brand-${s.accent}))]/15 text-[hsl(var(--brand-${s.accent}))]`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>All routes</CardTitle>
              <CardDescription>Click a row for trace, query, and dependency detail.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search paths or services..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">p95</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No endpoints found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((endpoint) => (
                    <TableRow
                      key={endpoint.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedEndpoint(endpoint)}
                    >
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${methodStyles[endpoint.method] ?? ""}`}>
                          {endpoint.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">{endpoint.path}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{endpoint.service}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{endpoint.avgLatency}ms</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{endpoint.p95Latency}ms</TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm ${endpoint.errorRate > 1 ? "text-[hsl(var(--brand-pink))]" : ""
                          }`}
                      >
                        {endpoint.errorRate}%
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {endpoint.requestVolume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={statusStyles[endpoint.status] ?? ""}>
                          {endpoint.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <Drawer
        open={!!selectedEndpoint}
        onOpenChange={(open) => !open && setSelectedEndpoint(null)}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-4xl">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-sm ${selectedEndpoint ? methodStyles[selectedEndpoint.method] ?? "" : ""
                    }`}
                >
                  {selectedEndpoint?.method}
                </Badge>
                <span className="font-mono">{selectedEndpoint?.path}</span>
              </DrawerTitle>
              <DrawerDescription>
                Service: {selectedEndpoint?.service} • ID: {selectedEndpoint?.id}
              </DrawerDescription>
            </DrawerHeader>

            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-4">
              {[
                { label: "Status", value: selectedEndpoint?.status, isStatus: true },
                { label: "Avg latency", value: `${selectedEndpoint?.avgLatency}ms` },
                { label: "Error rate", value: `${selectedEndpoint?.errorRate}%` },
                { label: "Cost score", value: `${selectedEndpoint?.costScore}/100` },
              ].map((m) => (
                <Card key={m.label} className="glass-card">
                  <CardContent className="p-4">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    {m.isStatus && selectedEndpoint ? (
                      <Badge variant="outline" className={statusStyles[selectedEndpoint.status]}>
                        {selectedEndpoint.status}
                      </Badge>
                    ) : (
                      <p className="text-xl font-bold">{m.value}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="px-4 pb-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm">Latency, last 24h</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {selectedEndpoint && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData(selectedEndpoint.path.length)}>
                        <defs>
                          <linearGradient id="drawerLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--brand-violet))" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="hsl(var(--brand-violet))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="x" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="y"
                          stroke="hsl(var(--brand-violet))"
                          strokeWidth={2}
                          fill="url(#drawerLatency)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <DrawerFooter>
              <Button>View full trace</Button>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
