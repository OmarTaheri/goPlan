"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { persistPreference } from "@/lib/preferences-storage";
import { applyThemeMode } from "@/lib/theme-utils";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import type { ThemeMode } from "@/types/preferences/theme";

/**
 * Simplified theme controls - only allows toggling between light/dark mode.
 * Theme preset is controlled by role-based routing, not user preference.
 */
export function SimplifiedThemeControls() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const onThemeModeChange = async (mode: ThemeMode | "") => {
    if (!mode) return;
    applyThemeMode(mode);
    setThemeMode(mode);
    persistPreference("theme_mode", mode);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline">
          {themeMode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Appearance</Label>
            <p className="text-muted-foreground text-[10px]">Switch between light and dark mode</p>
          </div>
          <ToggleGroup
            size="sm"
            variant="outline"
            type="single"
            value={themeMode}
            onValueChange={onThemeModeChange}
            className="w-full"
          >
            <ToggleGroupItem value="light" aria-label="Light mode" className="flex-1 gap-1">
              <Sun className="h-3 w-3" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark mode" className="flex-1 gap-1">
              <Moon className="h-3 w-3" />
              Dark
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
