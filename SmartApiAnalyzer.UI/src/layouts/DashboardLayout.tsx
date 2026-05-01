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
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Endpoints", href: "/dashboard/endpoints", icon: Activity },
  { name: "Insights", href: "/dashboard/insights", icon: Zap },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className=" flex min-h-screen w-full">
        <Sidebar className="border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
          <SidebarHeader className="p-4 border-b border-border/60">
            <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg animated-gradient">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <span className="truncate">Pulse</span>
              <Badge variant="outline" className="ml-auto text-[9px] uppercase tracking-wider">
                Pro
              </Badge>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Analytics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        tooltip={item.name}
                      >
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
                    <SidebarMenuButton asChild>
                      <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to site</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Upgrade card */}
            <div className="px-2 mt-auto pt-6">
              <div className="glass-card relative overflow-hidden rounded-xl p-4">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[hsl(var(--brand-violet))]/30 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[hsl(var(--brand-cyan))]/30 blur-2xl" />
                <div className="relative">
                  <Sparkles className="mb-2 h-4 w-4 text-[hsl(var(--brand-violet))]" />
                  <p className="text-xs font-semibold">Unlock anomaly AI</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Get predictive cost forecasting on Enterprise.
                  </p>
                  <Button size="sm" className="mt-3 w-full text-xs" variant="outline">
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full animated-gradient text-white">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="truncate text-sm font-medium">Alex Morgan</div>
                    <div className="truncate text-[11px] text-muted-foreground">alex@pulse.io</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className=" flex flex-1 flex-col ">
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

              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-pink))]" />
                <span className="sr-only">Notifications</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
    </SidebarProvider>
  );
}
