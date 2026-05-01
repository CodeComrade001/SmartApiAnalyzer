import React, { lazy, Suspense, useEffect, useState } from "react";

const HeroScene = lazy(() => import("./HeroScene"));

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

class HeroErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function CssFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slow drifting blobs */}
      <div
        className="absolute -left-32 top-1/4 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl animate-float"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(var(--brand-violet)), transparent 70%)",
        }}
      />
      <div
        className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl animate-float"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--brand-cyan)), transparent 70%)",
          animationDelay: "1.5s",
        }}
      />
      <div
        className="absolute -right-20 bottom-1/4 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl animate-float"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, hsl(var(--brand-pink)), transparent 70%)",
          animationDelay: "3s",
        }}
      />
      <div
        className="absolute left-1/3 bottom-1/3 h-[300px] w-[300px] rounded-full opacity-30 blur-3xl animate-float"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--brand-amber)), transparent 70%)",
          animationDelay: "2s",
        }}
      />
      {/* Subtle ring */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow"
        width="500"
        height="500"
        viewBox="0 0 500 500"
        fill="none"
      >
        <circle cx="250" cy="250" r="180" stroke="url(#ringGrad)" strokeWidth="1" strokeOpacity="0.3" />
        <circle cx="250" cy="250" r="220" stroke="url(#ringGrad)" strokeWidth="1" strokeOpacity="0.2" />
        <circle cx="250" cy="250" r="140" stroke="url(#ringGrad)" strokeWidth="1" strokeOpacity="0.4" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="500" y2="500">
            <stop stopColor="hsl(var(--brand-violet))" />
            <stop offset="0.5" stopColor="hsl(var(--brand-cyan))" />
            <stop offset="1" stopColor="hsl(var(--brand-pink))" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function HeroBackground() {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  useEffect(() => {
    setWebglOk(detectWebGL());
  }, []);

  if (webglOk === null || !webglOk) {
    return <CssFallback />;
  }

  return (
    <HeroErrorBoundary fallback={<CssFallback />}>
      <Suspense fallback={<CssFallback />}>
        <HeroScene />
      </Suspense>
    </HeroErrorBoundary>
  );
}
