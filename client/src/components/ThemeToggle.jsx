// components/ThemeToggle.jsx
// A small sun/moon button that flips between the Midnight Archive (dark)
// and Paper Archive (light) themes. Placed on the landing page nav, the
// auth pages, the sidebar, and the mobile top bar — so it's reachable
// from every screen.

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
