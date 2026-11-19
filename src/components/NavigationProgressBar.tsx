"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress bar when route finishes changing
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept clicks on internal links to provide instant visual navigation feedback
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor &&
        anchor.href &&
        anchor.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        try {
          const url = new URL(anchor.href, window.location.href);
          const isInternal = url.origin === window.location.origin;
          const isSamePage =
            url.pathname === window.location.pathname &&
            url.search === window.location.search;

          if (isInternal && !isSamePage) {
            setLoading(true);
            setProgress(25);
            setTimeout(() => setProgress(65), 180);
            setTimeout(() => setProgress(85), 700);
          }
        } catch {
          // Ignore invalid URLs
        }
      }

      // Intercept submit buttons and navigation action buttons
      const button = target.closest("button");
      if (
        button &&
        !button.disabled &&
        (button.type === "submit" || button.dataset.nav === "true")
      ) {
        setLoading(true);
        setProgress(30);
        setTimeout(() => setProgress(65), 180);
        setTimeout(() => setProgress(85), 700);
        // Safety timeout in case navigation does not occur
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 6000);
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-300 ease-out shadow-xs shadow-emerald-500/50"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "all 300ms ease-out" : "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
