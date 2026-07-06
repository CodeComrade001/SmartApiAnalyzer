import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Globe,
  CheckCircle2,
  CircleAlert,
  Plus,
  Save,
  ArrowRight,
  Link2,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiEndpoint, WebsiteApiGroup } from "@/types";
import { mockWebsiteApis } from "@/services/data/mockData";
import { UpdateEndpointPayload } from "@/api/endpoints/logs";

/* ─── constants ─── */
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const methodStyles: Record<HttpMethod, string> = {
  GET: "bg-[hsl(var(--brand-cyan))]/15 text-[hsl(var(--brand-cyan))] border-[hsl(var(--brand-cyan))]/30",
  POST: "bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30",
  PUT: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30",
  DELETE: "bg-[hsl(var(--brand-pink))]/15 text-[hsl(var(--brand-pink))] border-[hsl(var(--brand-pink))]/30",
  PATCH: "bg-[hsl(var(--brand-violet))]/15 text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet))]/30",
};

const verificationStyles: Record<string, string> = {
  verified: "bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30",
  unverified: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30",
  ignored: "bg-[hsl(var(--muted))]/20 text-muted-foreground border-border",
  healthy: "bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30",
  degraded: "bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30",
  down: "bg-[hsl(var(--brand-pink))]/15 text-[hsl(var(--brand-pink))] border-[hsl(var(--brand-pink))]/30",
};

/* ─── method select component ─── */
function MethodSelect({
  value,
  onChange,
}: {
  value: HttpMethod;
  onChange: (m: HttpMethod) => void;
}) {
  return (
    <div className="relative">
      <select
        title="HTTP Method"
        value={value}
        onChange={(e) => onChange(e.target.value as HttpMethod)}
        className={`appearance-none cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background pr-6 ${methodStyles[value]}`}
      >
        {HTTP_METHODS.map((m) => (
          <option key={m} value={m} className="bg-background text-foreground font-mono text-xs">
            {m}
          </option>
        ))}
      </select>
      {/* custom caret */}
      <svg
        className="pointer-events-none absolute right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 opacity-60"
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M0 0l5 6 5-6z" />
      </svg>
    </div>
  );
}

/* ─── page ─── */
export default function ApiDiscovery() {
  const [search, setSearch] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [websiteGroups, setWebsiteGroups] = useState<WebsiteApiGroup[]>(mockWebsiteApis);
  const [apiUpdateEndpointPayload, setApiUpdateEndpointPayload] = useState<UpdateEndpointPayload>({ scanId: "", routesAndEndpoints: [] });

  /* search filter */
  const filteredWebsites = useMemo(() => {
    if (!search.trim()) return websiteGroups;
    const lower = search.toLowerCase();
    return websiteGroups.filter(
      (w) =>
        w.websiteUrl.toLowerCase().includes(lower) ||
        w.endpoints.some((e) => e.inferredPath.toLowerCase().includes(lower))
    );
  }, [search, websiteGroups]);

  /* discover APIs (mocked) */
  const handleDiscoverApis = async () => {
    if (!websiteUrl.trim()) return;
    setIsDiscovering(true);
    setTimeout(() => {
      const newSite: WebsiteApiGroup = {
        id: crypto.randomUUID(),
        websiteUrl,
        discoveredAt: new Date().toISOString(),
        endpoints: [
          {
            id: crypto.randomUUID(),
            inferredPath: `${websiteUrl}/api/v1/users`,
            correctedPath: "",
            method: "GET",
            confidence: 91,
            selected: true,
            status: "verified",
          },
          {
            id: crypto.randomUUID(),
            inferredPath: `${websiteUrl}/api/v1/orders`,
            correctedPath: "",
            method: "POST",
            confidence: 73,
            selected: false,
            status: "unverified",
          },
          {
            id: crypto.randomUUID(),
            inferredPath: `${websiteUrl}/graphql`,
            correctedPath: "",
            method: "POST",
            confidence: 62,
            selected: false,
            status: "unverified",
          },
        ],
      };
      setWebsiteGroups((prev) => [newSite, ...prev]);
      setWebsiteUrl("");
      setIsDiscovering(false);
    }, 1200);
  };

  /* toggle endpoint selected */
  const handleToggleEndpoint = (websiteId: string, endpointId: string) => {
    setWebsiteGroups((prev) =>
      prev.map((w) =>
        w.id !== websiteId
          ? w
          : {
            ...w,
            endpoints: w.endpoints.map((e) =>
              e.id !== endpointId ? e : { ...e, selected: !e.selected }
            ),
          }
      )
    );
  };

  /* update corrected URL */
  const handleApiUrlChange = (websiteId: string, endpointId: string, value: string) => {
    setWebsiteGroups((prev) =>
      prev.map((w) =>
        w.id !== websiteId
          ? w
          : {
            ...w,
            endpoints: w.endpoints.map((e) =>
              e.id !== endpointId
                ? e
                : {
                  ...e,
                  correctedPath: value,
                  status: value.trim().length > 0 ? "verified" : e.status,
                }
            ),
          }
      )
    );
  };

  /* update HTTP method */
  const handleMethodChange = (websiteId: string, endpointId: string, method: HttpMethod) => {
    setWebsiteGroups((prev) =>
      prev.map((w) =>
        w.id !== websiteId
          ? w
          : {
            ...w,
            endpoints: w.endpoints.map((e) =>
              e.id !== endpointId ? e : { ...e, method }
            ),
          }
      )
    );
  };

  /* add new blank endpoint row */
  const handleAddEndpoint = (websiteId: string) => {
    setWebsiteGroups((prev) =>
      prev.map((w) => {
        if (w.id !== websiteId) return w;
        const newEndpoint: ApiEndpoint = {
          id: crypto.randomUUID(),
          inferredPath: "",
          correctedPath: "",
          method: "GET",
          confidence: 0,
          selected: false,
          status: "ignored",
        };
        return { ...w, endpoints: [...w.endpoints, newEndpoint] };
      })
    );
  };

  /* remove endpoint row */
  const handleRemoveEndpoint = (websiteId: string, endpointId: string) => {
    setWebsiteGroups((prev) =>
      prev.map((w) =>
        w.id !== websiteId
          ? w
          : { ...w, endpoints: w.endpoints.filter((e) => e.id !== endpointId) }
      )
    );
  };

  /* save (wired to console — replace with real call later) */
  const handleSave = (website: WebsiteApiGroup) => {
    // const website = websiteGroups.find((w) => w.id === websiteId);
    console.log("Saving website APIs", website);
  };

  /* next step */
  const handleNext = () => {
    console.log("Go to agent selection");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Discovery</h1>
          <p className="text-muted-foreground">Discover, verify, and manage API endpoints for your websites.</p>
        </div>
      </motion.div>

      {/* ── Add website ── */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add Website</CardTitle>
            <CardDescription>Enter a website URL to automatically discover API endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://company.com"
                className="pl-9"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDiscoverApis()}
              />
            </div>
            <Button onClick={handleDiscoverApis} disabled={isDiscovering || !websiteUrl.trim()}>
              {isDiscovering ? "Discovering…" : "Discover APIs"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Search ── */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search websites or endpoints…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Website groups ── */}
      <div className="flex flex-col gap-6">
        {filteredWebsites.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
              No websites found.
            </CardContent>
          </Card>
        ) : (
          filteredWebsites.map((website, index) => (
            <motion.div
              key={website.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      {website.websiteUrl}
                    </CardTitle>
                    <CardDescription>
                      {website.endpoints.length} discovered endpoint{website.endpoints.length !== 1 ? "s" : ""}
                      {" · "}
                      {website.endpoints.filter((e) => e.selected).length} selected
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAddEndpoint(website.id)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Endpoint
                    </Button>
                    <Button size="sm" onClick={() => handleSave(website)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save APIs
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[52px]">Use</TableHead>
                        <TableHead className="w-[110px]">Method</TableHead>
                        <TableHead>Discovered Endpoint</TableHead>
                        <TableHead>Correct API URL</TableHead>
                        <TableHead className="w-[90px] text-center">Confidence</TableHead>
                        <TableHead className="w-[110px] text-center">Status</TableHead>
                        <TableHead className="w-[44px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {website.endpoints.map((endpoint) => (
                        <TableRow key={endpoint.id} className={endpoint.selected ? "" : "opacity-60"}>
                          {/* select */}
                          <TableCell>
                            <Checkbox
                              checked={endpoint.selected}
                              onCheckedChange={() => handleToggleEndpoint(website.id, endpoint.id)}
                            />
                          </TableCell>

                          {/* method dropdown */}
                          <TableCell>
                            <MethodSelect
                              value={endpoint.method as HttpMethod}
                              onChange={(m) => handleMethodChange(website.id, endpoint.id, m)}
                            />
                          </TableCell>

                          {/* discovered path — editable if blank */}
                          <TableCell>
                            {endpoint.inferredPath ? (
                              <span className="font-mono text-xs truncate max-w-[200px] block">
                                {endpoint.inferredPath}
                              </span>
                            ) : (
                              <Input
                                placeholder="https://api.example.com/path"
                                className="h-7 font-mono text-xs"
                                value={endpoint.inferredPath}
                                onChange={(e) =>
                                  setWebsiteGroups((prev) =>
                                    prev.map((w) =>
                                      w.id !== website.id
                                        ? w
                                        : {
                                          ...w,
                                          endpoints: w.endpoints.map((ep) =>
                                            ep.id !== endpoint.id
                                              ? ep
                                              : { ...ep, inferredPath: e.target.value }
                                          ),
                                        }
                                    )
                                  )
                                }
                              />
                            )}
                          </TableCell>

                          {/* corrected URL */}
                          <TableCell>
                            <Input
                              value={endpoint.correctedPath ?? ""}
                              placeholder="Enter correct API URL…"
                              className="h-7 font-mono text-xs"
                              onChange={(e) =>
                                handleApiUrlChange(website.id, endpoint.id, e.target.value)
                              }
                            />
                          </TableCell>

                          {/* confidence */}
                          <TableCell className="text-center">
                            {endpoint.confidence > 0 ? (
                              <Badge
                                variant="secondary"
                                className={`tabular-nums text-[10px] ${endpoint.confidence >= 85
                                  ? "text-emerald-400"
                                  : endpoint.confidence >= 65
                                    ? "text-amber-400"
                                    : "text-muted-foreground"
                                  }`}
                              >
                                {endpoint.confidence}%
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </TableCell>

                          {/* status */}
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${verificationStyles[endpoint.status] ?? ""}`}
                            >
                              <span className="flex items-center gap-1">
                                {endpoint.status === "verified" || endpoint.status === "healthy" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <CircleAlert className="h-3 w-3" />
                                )}
                                {endpoint.status}
                              </span>
                            </Badge>
                          </TableCell>

                          {/* delete */}
                          <TableCell>
                            <button
                              onClick={() => handleRemoveEndpoint(website.id, endpoint.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[hsl(var(--brand-pink))]/10 hover:text-[hsl(var(--brand-pink))]"
                              title="Remove endpoint"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* empty state row */}
                      {website.endpoints.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                            No endpoints yet. Click "Add Endpoint" to add one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Next step ── */}
      <div className="flex items-center justify-end gap-3">
        <p className="text-xs text-muted-foreground">
          Configure endpoints, then proceed to agent selection.
        </p>
        <Button size="lg" onClick={handleNext}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
