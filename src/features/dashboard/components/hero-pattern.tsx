"use client";

import { useEffect, useState } from "react";
import { WavyBackground } from "@/components/ui/wavy-background";

const FALLBACK_COLORS = ["#2dd4bf", "#22d3ee", "#388df8", "#818cf8"];

export function HeroPattern() {
  const [colors, setColors] = useState(FALLBACK_COLORS);

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      setColors([
        style.getPropertyValue("--hero-1").trim() || FALLBACK_COLORS[0],
        style.getPropertyValue("--hero-2").trim() || FALLBACK_COLORS[1],
        style.getPropertyValue("--hero-3").trim() || FALLBACK_COLORS[2],
        style.getPropertyValue("--hero-4").trim() || FALLBACK_COLORS[3],
      ]);
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-40" />
      <div className="absolute inset-0 hidden lg:block">
        <WavyBackground
          colors={colors}
          backgroundFill="transparent"
          blur={4}
          speed="slow"
          waveOpacity={0.1}
          waveWidth={60}
          waveYOffset={250}
          containerClassName="h-full"
          className="hidden"
        />
      </div>
    </div>
  );
}
