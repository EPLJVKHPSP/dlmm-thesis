"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("dlmm-theme");
    const enabled = stored === "dark";
    document.documentElement.classList.toggle("dark", enabled);
    setDark(enabled);
  }, []);

  function toggle() {
    const enabled = !dark;
    document.documentElement.classList.toggle("dark", enabled);
    window.localStorage.setItem("dlmm-theme", enabled ? "dark" : "light");
    setDark(enabled);
  }

  return <button className="icon-button" type="button" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
    {dark ? "☀" : "☾"}
  </button>;
}
