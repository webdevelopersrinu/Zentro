import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { THEME_STORAGE_KEY } from "../config/index.js";

const ThemeContext = createContext(null);

/** The inline script in index.html has already set this before first paint. */
const currentTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(currentTheme);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next = previous === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
