"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "dark" | "light" | "system";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("devloom-theme") as ThemeMode;
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {}
  return "system";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("devloom-theme", mode);
  } catch {}

  let isDark = true;
  if (mode === "light") {
    isDark = false;
  } else if (mode === "dark") {
    isDark = true;
  } else {
    // system
    isDark = !window.matchMedia || window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  const root = document.documentElement;
  if (isDark) {
    root.classList.remove("light");
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
  }

  window.dispatchEvent(
    new CustomEvent("devloom-theme-change", {
      detail: { theme: mode, effectiveTheme: isDark ? "dark" : "light" },
    })
  );
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getStoredTheme();
    setThemeState(initial);

    const isSystemDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const currentEffective =
      initial === "light" ? "light" : initial === "dark" ? "dark" : isSystemDark ? "dark" : "light";

    setEffectiveTheme(currentEffective);
    applyTheme(initial);

    // Listen for theme changes across components
    function handleThemeChange(e: Event) {
      const custom = e as CustomEvent<{ theme: ThemeMode; effectiveTheme: "dark" | "light" }>;
      if (custom.detail) {
        setThemeState(custom.detail.theme);
        setEffectiveTheme(custom.detail.effectiveTheme);
      }
    }

    window.addEventListener("devloom-theme-change", handleThemeChange);

    // Listen for OS theme changes if on system
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleOsThemeChange(e: MediaQueryListEvent) {
      const current = getStoredTheme();
      if (current === "system") {
        applyTheme("system");
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleOsThemeChange);
    } else {
      mediaQuery.addListener(handleOsThemeChange);
    }

    return () => {
      window.removeEventListener("devloom-theme-change", handleThemeChange);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleOsThemeChange);
      } else {
        mediaQuery.removeListener(handleOsThemeChange);
      }
    };
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  return {
    theme,
    effectiveTheme,
    setTheme,
    mounted,
  };
}
