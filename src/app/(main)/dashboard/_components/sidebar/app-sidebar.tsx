"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { getSidebarItemsForRole, sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

interface CurrentUser {
  user_id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  STUDENT: "Student",
  ADVISOR: "Advisor",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const navItems = user ? getSidebarItemsForRole(user.role) : sidebarItems;

  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
    : "Guest";

  const userEmail = user?.email || "";
  const userRole = user?.role ? roleLabels[user.role] || user.role : "";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                <Link prefetch={false} href="/">
                  <Image
                    src="/logo.png"
                    alt={`${APP_CONFIG.name} logo`}
                    width={32}
                    height={32}
                    className="h-8 w-8"
                    priority
                  />
                  <span className="text-base font-semibold">{APP_CONFIG.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} userRole={user?.role || null} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userName,
            email: userEmail,
            role: userRole,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
