import { Link, useLocation } from "wouter";
import { LayoutDashboard, Github, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Showcase", href: "#showcase" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Top Nav */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed left-0 right-0 top-4 z-50 px-4"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full glass-strong px-5 py-2.5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg animated-gradient">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Pulse</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9 rounded-full" />
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 rounded-full md:inline-flex"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="rounded-full"
            >
              Open dashboard
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="relative mt-32 border-t border-border/50 bg-background/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg animated-gradient">
                  <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold tracking-tight">Pulse</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Real-time API performance &amp; cost intelligence for modern engineering teams.
              </p>
            </div>
            {[
              {
                title: "Product",
                items: ["Overview", "Endpoints", "Insights", "Subscription", "Settings"],
              },
              {
                title: "Resources",
                items: ["Documentation", "API Reference", "Changelog", "Status", "Roadmap"],
              },
              {
                title: "Company",
                items: ["About", "Customers", "Careers", "Privacy", "Terms"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it}>
                      <a className="text-sm text-muted-foreground transition hover:text-foreground" href="#">
                        {it}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-8 md:flex-row md:items-center">
            <p className="text-xs text-muted-foreground">
              © 2026 Pulse Analytics. All rights reserved.
            </p>
            <div className="flex gap-2">
              {["SOC 2", "GDPR", "ISO 27001", "HIPAA"].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
