import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import DashboardLayout from "@/layouts/DashboardLayout";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Spinner } from "@/components/ui/spinner";
import Dashboard from "./pages/Dashboard";
import Endpoints from "./pages/Endpoints";
import Insights from "./pages/Insights";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";
import Landing from "./pages/Landing";
import CodeComplexity from "./pages/CodeComplexity";
import MCPServer from "./pages/MCPServer";
import { ScanProvider } from "./context/ScanContext";
import AgentsPage from "./pages/Agents";
import AgentConfigurationIndex from "./pages/AgentConfigurationIndex";
import AgentConfigurationPage from "./pages/AgentConfiguration";
import DeploymentIntelligencePage from "./pages/DeploymentIntelligence";

const deploymentRoutes = [
  "risk-assessment",
  "dependency-impact",
  "cross-system-readiness",
  "change-collision",
  "deployment-ordering",
  "pr-context",
  "failure-prediction",
  "workaround-expiration",
  "readiness-permission",
] as const;

function LoadingFallback() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center p-8">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isMarketing = location === "/" || location.startsWith("/#");

  if (isMarketing) {
    return (
      <MarketingLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            <Route path="/" component={Landing} />
          </Switch>
        </Suspense>
      </MarketingLayout>
    );
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/endpoints" component={Endpoints} />
          <Route path="/dashboard/insights" component={Insights} />
          <Route path="/dashboard/code-complexity" component={CodeComplexity} />
          <Route path="/dashboard/mcp-server" component={MCPServer} />
          <Route path="/dashboard/agents" component={AgentsPage} />
          <Route path="/dashboard/agents/configuration" component={AgentConfigurationIndex} />
          <Route path="/dashboard/agents/configuration/:agentKey" component={AgentConfigurationPage} />
          {deploymentRoutes.map((moduleSlug) => (
            <Route key={moduleSlug} path={`/dashboard/deployment-intelligence/${moduleSlug}`}>
              {() => <DeploymentIntelligencePage moduleSlug={moduleSlug} />}
            </Route>
          ))}
          <Route path="/dashboard/subscription" component={Subscription} />
          <Route path="/dashboard/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ScanProvider>
      <ThemeProvider defaultTheme="dark" storageKey="analyzer-theme">
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </ScanProvider>
  );
}

export default App;
