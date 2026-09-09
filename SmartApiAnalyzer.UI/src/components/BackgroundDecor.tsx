import { ReactNode } from "react";
import {
  Activity,
  Code2,
  GitBranch,
  Server,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface BackgroundDecorProps {
  children: ReactNode;
}

const techSignals = [
  {
    icon: Code2,
    label: "Endpoint signal",
    value: "GET /checkout",
    detail: "p95 318ms",
    position: "left-[2%] top-[10%]",
  },
  {
    icon: GitBranch,
    label: "Release context",
    value: "deploy v2.18.4",
    detail: "risk window",
    position: "right-[2%] top-[18%]",
  },
  {
    icon: Activity,
    label: "Performance",
    value: "P95 latency",
    detail: "↓ 12.4%",
    position: "left-[5%] top-[52%]",
  },
  {
    icon: Server,
    label: "Runtime surface",
    value: "14 services",
    detail: "all regions online",
    position: "right-[5%] top-[58%]",
  },
  {
    icon: ShieldCheck,
    label: "Security gate",
    value: "Policy passed",
    detail: "7 checks aligned",
    position: "left-[12%] bottom-[8%]",
  },
];

export function BackgroundDecor({ children }: BackgroundDecorProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      >
        {/* Grid */}
        <div className="absolute inset-0 bg-grid opacity-[0.12]" />

        {/* Ambient glow */}
        <motion.div
          className="
            absolute
            left-1/2
            top-[10%]
            size-[32rem]
            -translate-x-1/2
            rounded-full
            bg-[hsl(var(--brand-violet))]/[0.06]
            blur-3xl
          "
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="
            absolute
            -right-64
            top-[45%]
            size-[32rem]
            rounded-full
            bg-[hsl(var(--brand-cyan))]/[0.05]
            blur-3xl
          "
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="
            absolute
            -left-64
            top-[70%]
            size-[32rem]
            rounded-full
            bg-[hsl(var(--brand-pink))]/[0.05]
            blur-3xl
          "
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating technical signals */}
        <div className="absolute inset-0 hidden z-10 lg:block">
          {techSignals.map((signal, index) => {
            const SignalIcon = signal.icon;

            return (
              <motion.div
                key={signal.label}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: [0.08, 0.20, 0.08],
                  y: [0, index % 2 === 0 ? -18 : 18, 0],
                  rotate: [
                    0,
                    index % 2 === 0 ? 1 : -1,
                    0,
                  ],
                }}
                transition={{
                  opacity: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.4,
                  },

                  y: {
                    duration: 6 + index,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5,
                  },

                  rotate: {
                    duration: 8 + index,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5,
                  },
                }}
                className={`absolute ${signal.position}`}
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-border/20
                    bg-background/20
                    px-3
                    py-2
                    backdrop-blur-[2px]
                  "
                >
                  <div
                    className="
                      flex
                      size-7
                      items-center
                      justify-center
                      rounded-lg
                      bg-muted/30
                    "
                  >
                    <SignalIcon className="size-3.5 text-muted-foreground/70" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
                      {signal.label}
                    </p>

                    <p className="mt-0.5 text-[10px] font-medium text-foreground/50">
                      {signal.value}
                    </p>

                    <p className="text-[9px] text-muted-foreground/50">
                      {signal.detail}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Foreground content */}
      <div className="relative z-15">
        {children}
      </div>
    </div>
  );
}