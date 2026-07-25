import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Globe, CheckCircle2, CircleAlert, Plus, Save, ArrowRight, Link2, Trash2, AlertTriangle, } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiEndpoint, HTTP_METHODS, HttpMethod, WebsiteApiGroup } from "@/types";
import { ingestDomainUrl, RoutesAndEndpointsPayload, updateDomainEndpoint, UpdateEndpointPayload } from "@/api/endpoints/logs";
import { usePopUpNotify } from "@/hooks/use-pop-up-notify";
import UrlSchemaImport from "@/components/UrlSchemaImport";
import NavigationGuard from "@/components/NavigationGuard";
import { getallMethodEndpointGrouped } from "@/components/helpers/getallMethodEndpointGrouped";

/* ─── constants ─── */
// const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
// type HttpMethod = (typeof HTTP_METHODS)[number];

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
  const notifyPopUp = usePopUpNotify();
  const [search, setSearch] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [websiteGroups, setWebsiteGroups] = useState<WebsiteApiGroup[]>([]);

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

  /* NEW: names of websites that have never been saved, or were saved and then changed again.
     Used to power the NavigationGuard message and the per-row "unsaved" badge. */
  const unsavedSiteNames = useMemo(() => {
    return websiteGroups
      .filter((w) => w.endpoints.length > 0 && (!w.isSaved || w.hasChanges))
      .map((w) => w.websiteUrl)
      .join(", ");
  }, [websiteGroups]);

  /* discover APIs (mocked) */
  const handleDiscoverApis = async () => {
    if (!websiteUrl.trim()) return notifyPopUp("Please enter a website URL to discover APIs", "error", "Discovery failed");
    setIsDiscovering(true);
    notifyPopUp("Scanning " + websiteUrl + " for API endpoints…", "info", "Discovery started");
    try {

      const apiResponse = await ingestDomainUrl({ DomainUrl: websiteUrl });
      console.log("Turbo Log  ~ handleDiscoverApis ~ apiResponse:", apiResponse);


      if (!apiResponse.success || !apiResponse.data) return notifyPopUp("Failed to discover APIs for " + websiteUrl, "error", "Discovery failed");

      setWebsiteGroups((prev) => [
        ...prev,
        {
          id: apiResponse.data.scanId,
          discoveredAt: new Date().toISOString(),
          websiteUrl: apiResponse.data.domainUrl,
          isSaved: false,
          hasChanges: false,
          endpoints: apiResponse.data.endpoints.map((endpoint) => {
            const method: HttpMethod =
              HTTP_METHODS.find(
                (m) => m === endpoint.suggestedMethods[0]
              ) ?? "GET";

            return {
              id: crypto.randomUUID(),
              inferredPath: endpoint.path,
              correctedPath: endpoint.path,
              method,
              confidence: 100,
              selected: false,
              status: "unverified",
            };
          }),
        },
      ]);

      return notifyPopUp("APIs for " + websiteUrl + " discovered successfully", "success", "Discovery complete");
    } catch (error) {
      notifyPopUp("An error occurred while discovering APIs", "error", "Discovery failed");
      console.error("Error discovering APIs", error);
    } finally {
      setIsDiscovering(false);
    }

  };

  const handleSchemaImport = (groups: WebsiteApiGroup[]) => {
    try {

      const groupsWithSaveState = groups.map((g) => ({
        ...g,
        isSaved: false,
        hasChanges: false,
      }));

      setWebsiteGroups((prev) => [...groupsWithSaveState, ...prev]);
      const endpointCount = groups.reduce((n, g) => n + g.endpoints.length, 0);
      notifyPopUp(
        `${groups.length} site${groups.length !== 1 ? "s" : ""} · ${endpointCount} endpoint${endpointCount !== 1 ? "s" : ""} imported from schema file`,
        "success",
        "Schema import complete",
      );
    } catch (error) {
      console.error("Error importing schema file", error);
      notifyPopUp("An error occurred while importing the schema file", "error", "Schema import failed");
    };
  }

  /* toggle endpoint selected */
  const handleToggleEndpoint = (websiteId: string, endpointId: string) => {
    setWebsiteGroups((prev) =>
      prev.map((w) => {
        if (w.id !== websiteId) return w;
        const updated = w.endpoints.map((e) =>
          e.id !== endpointId ? e : { ...e, selected: !e.selected }
        );
        const ep = updated.find((e) => e.id === endpointId);
        if (ep) {
          const path = ep.correctedPath?.trim() || ep.inferredPath || "endpoint";
          notifyPopUp(
            ep.selected ? path + " added to scan targets" : path + " removed from scan targets",
            ep.selected ? "success" : "info",
            ep.selected ? "Endpoint selected" : "Endpoint deselected",
          );
        }
        return { ...w, endpoints: updated, isSaved: false, hasChanges: true };
      })
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
            isSaved: false,
            hasChanges: true,
          }
      )
    );
    if (value.trim().length > 0) {
      notifyPopUp(value.trim() + " set as the verified route", "success", "Route updated");
    }
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
            isSaved: false,
            hasChanges: true,
          }
      )
    );
    const site = websiteGroups.find((w) => w.id === websiteId);
    const ep = site?.endpoints.find((e) => e.id === endpointId);
    const path = ep?.correctedPath?.trim() || ep?.inferredPath || "endpoint";
    notifyPopUp("Method changed to " + method + " on " + path, "info", "Method updated");
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
        return { ...w, endpoints: [...w.endpoints, newEndpoint], isSaved: false, hasChanges: true };
      })
    );
    notifyPopUp("A blank row was added — fill in the endpoint URL and method", "info", "Endpoint row added");
  };

  /* remove endpoint row */
  const handleRemoveEndpoint = (websiteId: string, endpointId: string) => {
    const site = websiteGroups.find((w) => w.id === websiteId);
    const ep = site?.endpoints.find((e) => e.id === endpointId);
    const path = ep?.correctedPath?.trim() || ep?.inferredPath || "Endpoint";
    setWebsiteGroups((prev) =>
      prev.map((w) =>
        w.id !== websiteId
          ? w
          : { ...w, endpoints: w.endpoints.filter((e) => e.id !== endpointId), isSaved: false, hasChanges: true }
      )
    );
    notifyPopUp(path + " has been removed", "warning", "Endpoint removed");
  };

  /* save (wired to console — replace with real call later) */
  const handleSave = async (website: WebsiteApiGroup) => {
    notifyPopUp("Saving APIs for " + website.websiteUrl + "…", "info", "Save started");

    if (!website.websiteUrl || website.websiteUrl === "") return notifyPopUp("Website URL is empty — cannot save", "error", "Save failed");
    if (website.endpoints.length === 0) {
      return notifyPopUp("No endpoints to save for " + website.websiteUrl, "error", "Save failed");
    }

    try {

      const groupedResult: RoutesAndEndpointsPayload[] = getallMethodEndpointGrouped(website.endpoints);
      if (!groupedResult || groupedResult.length === 0) return notifyPopUp("The selected scan targets do not contain any valid endpoints to scan.", "error", "No valid endpoints found");

      const websitePayload: UpdateEndpointPayload = {
        ScanId: website.id,
        RoutesAndEndpoints: groupedResult
      };

      const apiResponse = await updateDomainEndpoint(websitePayload);

      if (!apiResponse || apiResponse.status !== 200) {
        notifyPopUp("Failed to save APIs for " + website.websiteUrl, "error", "Save failed");
        return;
      }

      setWebsiteGroups((prev) =>
        prev.map((w) =>
          w.id !== website.id ? w : { ...w, isSaved: true, hasChanges: false }
        )
      );

      return notifyPopUp("APIs for " + website.websiteUrl + " saved successfully", "success", "Save complete");

    } catch (error) {
      console.error("Error saving website APIs", error);
      notifyPopUp("Failed to save APIs for " + website.websiteUrl, "error", "Save failed");
    }
  };

  /* next step */
  const handleNext = () => {
    const totalSelected = websiteGroups.reduce((n, w) => n + w.endpoints.filter((e) => e.selected).length, 0);
    if (totalSelected === 0) {
      notifyPopUp("Select at least one endpoint before proceeding to agent selection", "error", "No endpoints selected");
      return;
    }
    notifyPopUp(totalSelected + " endpoint" + (totalSelected !== 1 ? "s" : "") + " queued — head to Agent Scan to launch", "success", "Ready for agent scan");
  };

  const hasUnsavedImports = () => {
    return websiteGroups.some((w) => w.endpoints.length > 0 && (!w.isSaved || w.hasChanges));
  }


  return (
    <div className="flex flex-col  gap-6">
      <NavigationGuard
        when={hasUnsavedImports()}
        title="Unsaved imported endpoints"
        message={`You imported endpoint data from a schema file${unsavedSiteNames ? ` (${unsavedSiteNames})` : ""} but haven't saved it yet.`}
        consequence="Leaving this page will permanently discard all imported endpoints. They will not be queued for scanning and cannot be recovered without re-importing the file."
      />
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

      {/* ── Import from schema file ── */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Import from Schema File</CardTitle>
            <CardDescription>
              Drag in a YAML or JSON file describing a domain and its endpoints — parsed output is logged to the console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlSchemaImport onImport={handleSchemaImport} />
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
          filteredWebsites.map((website, index) => {
            // NEW: derive a single boolean used purely for display — does not affect any API call
            const isUnsaved = !website.isSaved || website.hasChanges;
            return (
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
                        {/* NEW: per-site unsaved indicator */}
                        {isUnsaved ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-[hsl(var(--brand-amber))]/15 text-[hsl(var(--brand-amber))] border-[hsl(var(--brand-amber))]/30"
                          >
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Unsaved
                            </span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-[hsl(var(--brand-emerald))]/15 text-[hsl(var(--brand-emerald))] border-[hsl(var(--brand-emerald))]/30"
                          >
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Saved
                            </span>
                          </Badge>
                        )}
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
                      <Button size="sm" variant={isUnsaved ? "default" : "outline"} onClick={() => handleSave(website)}>
                        <Save className="mr-2 h-4 w-4" />
                        {isUnsaved ? "Save APIs" : "Saved"}
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
                          {/* <TableHead className="w-[90px] text-center">Saved</TableHead> */}
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
                                            // NEW: editing the discovered path also invalidates saved state
                                            isSaved: false,
                                            hasChanges: true,
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
                            {/* <TableCell className="text-center">
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
                            </TableCell> */}

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
            );
          })
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