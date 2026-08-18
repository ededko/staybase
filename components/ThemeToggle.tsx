"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const themes: Theme[] = ["system", "light", "dark"];
const labels = { system: "Авто", light: "Світла", dark: "Темна" };
const icons = { system: "◐", light: "☀", dark: "☾" };

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("staybase-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("staybase-theme") as Theme | null;
    const next = themes.includes(saved as Theme) ? saved! : "system";
    applyTheme(next);
    const frame = requestAnimationFrame(() => setTheme(next));
    return () => cancelAnimationFrame(frame);
  }, []);

  function cycleTheme() {
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    applyTheme(next);
  }

  return <button type="button" onClick={cycleTheme} className="theme-toggle" title={`Тема: ${labels[theme]}`} aria-label={`Тема: ${labels[theme]}`}><span>{icons[theme]}</span><span className="hidden sm:inline">{labels[theme]}</span></button>;
}
