"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type ThemePreset = "brutalist" | "goplan-staff";

/**
 * Hook that applies role-based theme presets based on the current route.
 * - /dashboard/student/* -> brutalist theme
 * - /dashboard/admin/* -> goplan-staff theme (green)
 * - /dashboard/advisor/* -> goplan-staff theme (green)
 */
export function useRoleBasedTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    let themePreset: ThemePreset = "brutalist"; // default

    if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/advisor")) {
      themePreset = "goplan-staff";
    } else if (pathname.startsWith("/dashboard/student")) {
      themePreset = "brutalist";
    }

    // Apply the theme
    html.setAttribute("data-theme-preset", themePreset);

    // Cleanup is not needed since we want the theme to persist
    // The theme will be updated when navigation changes
  }, [pathname]);
}
