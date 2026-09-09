import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Activity,
  Zap,
  CreditCard,
  Settings,
  LayoutDashboard,
  Search,
  Bell,
  User,
  ArrowLeft,
  Sparkles,
  FileCode2,
  Server,
  Bot,
  ChevronsUpDown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { MissionBriefToggle, MissionBrief } from "@/components/MissionBrief";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ScanTerminal } from "@/components/ScanTerminal";
import { deploymentModules } from "@/data/deploymentModules";

const analyticsNavItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Endpoints", href: "/dashboard/endpoints", icon: Activity },
  { name: "Insights", href: "/dashboard/insights", icon: Zap },
];

const toolsNavItems = [
  { name: "Code Complexity", href: "/dashboard/code-complexity", icon: FileCode2 },
  { name: "Agent Scan", href: "/dashboard/agents", icon: Bot },
  { name: "Agent Configuration", href: "/dashboard/agents/configuration", icon: Settings },
  { name: "MCP Server", href: "/dashboard/mcp-server", icon: Server },
];

const deploymentNavGroups = [
  {
    label: "Release risk & permission",
    slugs: ["risk-assessment", "readiness-permission", "failure-prediction"],
  },
  {
    label: "Change intelligence",
    slugs: ["dependency-impact", "cross-system-readiness", "change-collision"],
  },
  {
    label: "Delivery orchestration",
    slugs: ["deployment-ordering", "pr-context", "workaround-expiration"],
  },
].map((group) => ({
  ...group,
  items: group.slugs.map((slug) => {
    const module = deploymentModules.find((candidate) => candidate.slug === slug);
    if (!module) throw new Error(`Missing Deployment Intelligence module: ${slug}`);
    return {
      name: module.navLabel,
      href: `/dashboard/deployment-intelligence/${module.slug}`,
      icon: module.icon,
    };
  }),
}));

const accountNavItems = [
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">

          {/* ── Logo / brand ── */}
          <SidebarHeader className="border-b border-border/60">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild tooltip="Pulse">
                  <Link href="/">
                    <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg animated-gradient">
                      <LayoutDashboard className="h-4 w-4 text-white" />
                    </div>
                    <div className="grid flex-1 overflow-hidden text-left leading-tight">
                      <span className="truncate font-semibold text-sidebar-foreground">Pulse</span>
                      <span className="truncate text-[10px] text-muted-foreground">Pro Plan</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Analytics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {analyticsNavItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location === item.href} tooltip={item.name}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsNavItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location === item.href} tooltip={item.name}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Deployment Intelligence</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-3">
                  {deploymentNavGroups.map((group) => (
                    <div key={group.label}>
                      <div className="ml-1">
                        <SidebarGroupLabel>
                          {group.label}
                        </SidebarGroupLabel>
                      </div>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={location === item.href} tooltip={item.name}>
                              <Link href={item.href}>
                                <item.icon className="h-4 w-4 " />
                                <span>{item.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountNavItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location === item.href} tooltip={item.name}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Resources</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Back to site">
                      <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to site</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Upgrade card — hidden in icon mode */}
            <div className="mt-auto px-2 pb-2 pt-4 group-data-[collapsible=icon]:hidden">
              <div className="glass-card relative overflow-hidden rounded-xl p-4">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[hsl(var(--brand-violet))]/30 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[hsl(var(--brand-cyan))]/30 blur-2xl" />
                <div className="relative">
                  <Sparkles className="mb-2 h-4 w-4 text-[hsl(var(--brand-violet))]" />
                  <p className="text-xs font-semibold">Unlock anomaly AI</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Get predictive cost forecasting on Enterprise.
                  </p>
                  <Button size="sm" className="mt-3 w-full text-xs" variant="outline">
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </SidebarContent>

          {/* ── User footer ── */}
          <SidebarFooter className="border-t border-border/60">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      tooltip="Alex Morgan"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full animated-gradient text-white">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="grid flex-1 overflow-hidden text-left leading-tight">
                        <span className="truncate text-sm font-medium">Alex Morgan</span>
                        <span className="truncate text-[11px] text-muted-foreground">alex@pulse.io</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Billing</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="relative flex flex-1 flex-col">
          {/* ── topbar ── */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/60 glass-strong px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-center gap-3 md:gap-4">
              <form className="ml-auto flex-1 sm:flex-initial">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search endpoints, traces, queries..."
                    className="w-full bg-muted/40 pl-8 sm:w-[260px] md:w-[200px] lg:w-[320px]"
                  />
                </div>
              </form>

              <Select defaultValue="production">
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>

              <ThemeToggle className="h-9 w-9" />
              <MissionBriefToggle />

              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-pink))]" />
                <span className="sr-only">Notifications</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 flex-col relative  p-4 md:p-6 lg:p-8">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-7xl"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* ── overlays ── */}
      <MissionBrief />
      <NotificationCenter />
      <ScanTerminal />
    </SidebarProvider>
  );
}
