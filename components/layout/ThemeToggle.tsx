"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const LABEL = { system: "System theme", light: "Light theme", dark: "Dark theme" } as const;

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Cycles system, light, dark. The choice is remembered in this browser. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    let stored: Theme = "system";
    try {
      const value = window.localStorage.getItem("theme");
      if (value === "light" || value === "dark") stored = value;
    } catch {
      // Storage can be blocked; the page still follows the system theme.
    }
    setTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (window.localStorage.getItem("theme") as Theme | null) ?? "system";
      if (current === "system") apply("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // Ignore: the theme still applies for this page view.
    }
    apply(next);
  }

  const Icon = ICON[theme];

  return (
    <button suppressHydrationWarning
      type="button"
      onClick={cycle}
      aria-label={`${LABEL[theme]}. Change theme`}
      title={LABEL[theme]}
      className="glass-strong shape-cut flex h-9 w-9 shrink-0 items-center justify-center text-soft transition [--cut:9px] [--r:10px] hover:text-ink active:scale-95"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}

/** Runs before paint so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;
