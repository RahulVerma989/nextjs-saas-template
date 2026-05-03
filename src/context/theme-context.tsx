'use client';

/**
 * Theme system — thin wrapper around `next-themes`.
 *
 * Why a wrapper:
 *   - next-themes is the source of truth (battle-tested SSR, system
 *     preference tracking, no flicker).
 *   - We expose a `toggleTheme()` helper so existing call sites that
 *     used the old context hook keep working with one less prop wired
 *     through.
 *   - All components (landing + dashboard) read theme from the same
 *     provider mounted in the root layout, so the toggle never goes
 *     out of sync with the .dark class.
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useTheme as useNextTheme } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Disable transitions on theme flip to avoid jarring color jumps
      // across the whole tree (we'd rather the toggle feel instant).
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

/**
 * Theme hook compatible with the old ThemeContext API.
 *
 * Returns:
 *   - `theme`           — what the user explicitly chose ('light' | 'dark' | 'system')
 *   - `resolvedTheme`   — what's actually applied right now ('light' | 'dark')
 *   - `setTheme(theme)` — set explicit choice
 *   - `toggleTheme()`   — flip between light and dark (resolves 'system' first)
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  const toggleTheme = () => {
    const current = resolvedTheme ?? systemTheme ?? theme ?? 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: (theme ?? 'system') as 'light' | 'dark' | 'system',
    resolvedTheme: (resolvedTheme ?? 'light') as 'light' | 'dark',
    setTheme,
    toggleTheme,
  };
}
