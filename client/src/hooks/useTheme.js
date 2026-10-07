// hooks/useTheme.js
// ONE shared theme state for the whole app — no Context needed.
//
// How it works (beginner-friendly):
//   - The current theme lives in three places that are always kept in sync:
//     1. module-level `currentTheme` variable (fast, in memory)
//     2. <html data-theme="..."> (this is what the CSS reads)
//     3. localStorage (so the choice survives reloads)
//   - Every component that calls useTheme() subscribes via the `listeners`
//     set. When any one of them changes the theme, all others re-render
//     with the new value. This is why the toggle in the sidebar and the
//     theme cards in Settings never disagree with each other.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'linkgraveyard_theme';

function readTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

// Initialized once when this module first loads. main.jsx also applies the
// saved theme before first paint, so there is no flash of the wrong theme.
let currentTheme = readTheme();
const listeners = new Set();

function setTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return;
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  // Tell every mounted component using this hook to re-render.
  listeners.forEach((notify) => notify(theme));
}

export function useTheme() {
  const [theme, setThemeState] = useState(currentTheme);

  useEffect(() => {
    listeners.add(setThemeState);
    // Unsubscribe on unmount so we don't leak listeners.
    return () => {
      listeners.delete(setThemeState);
    };
  }, []);

  return [theme, setTheme];
}
