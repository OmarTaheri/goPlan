"use client";

import { useRoleBasedTheme } from "@/hooks/use-role-based-theme";

/**
 * Client component that initializes the role-based theme.
 * Must be mounted in the dashboard layout to apply correct theme per role.
 */
export function RoleBasedThemeProvider({ children }: { children: React.ReactNode }) {
  useRoleBasedTheme();
  return <>{children}</>;
}
