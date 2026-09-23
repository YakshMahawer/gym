"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When route changes, complete and dismiss progress bar
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Global link click listener for instant 0ms response
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("https://wa.me") || href.startsWith("mailto:") || target.target === "_blank") {
        return;
      }

      // Check if it's an internal route that differs from current path
      const currentFull = `${pathname}${window.location.search}`;
      if (href !== currentFull && !href.startsWith("http")) {
        setIsNavigating(true);
        setProgress(35);
        setTimeout(() => setProgress((p) => (p === 35 ? 75 : p)), 180);
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [pathname]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-slate-900 via-rose-600 to-emerald-500 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(225,29,72,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 150ms ease-out, opacity 250ms ease-in" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}
