"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Light, dark, or whatever the device prefers. It sets a class before paint, so nothing flashes. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
