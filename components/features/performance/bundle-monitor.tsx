/**
 * Bundle Monitor Component
 * Development tool za praćenje bundle size i performance
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BundleMonitor() {
  const [metrics, setMetrics] = useState<{
    jsSize: number;
    cssSize: number;
    loadTime: number;
  } | null>(null);

  useEffect(() => {
    if (process.env['NODE_ENV'] !== "development") return;

    const measureBundle = () => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      const styles = Array.from(document.querySelectorAll("link[rel='stylesheet']"));
      
      let jsSize = 0;
      let cssSize = 0;

      scripts.forEach((script) => {
        const src = script.getAttribute("src");
        if (src) {
          // Estimate size (in production, use Resource Timing API)
          jsSize += 100; // Placeholder
        }
      });

      styles.forEach((style) => {
        const href = style.getAttribute("href");
        if (href) {
          cssSize += 50; // Placeholder
        }
      });

      const loadTime = performance.timing
        ? performance.timing.loadEventEnd - performance.timing.navigationStart
        : 0;

      setMetrics({
        jsSize,
        cssSize,
        loadTime,
      });
    };

    if (document.readyState === "complete") {
      measureBundle();
      return;
    }
    
    window.addEventListener("load", measureBundle);
    return () => window.removeEventListener("load", measureBundle);
  }, []);

  if (process.env['NODE_ENV'] !== "development" || !metrics) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs p-2">
      <CardContent className="p-0">
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-transparent text-white border-white/20">
            JS: ~{metrics.jsSize}KB
          </Badge>
          <Badge variant="outline" className="bg-transparent text-white border-white/20">
            CSS: ~{metrics.cssSize}KB
          </Badge>
          <Badge variant="outline" className="bg-transparent text-white border-white/20">
            Load: {metrics.loadTime}ms
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

