import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  ClipboardList,
  FileText,
  Route,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// Admin navigation items
export const adminSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Admin Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Courses",
        url: "/dashboard/admin/courses",
        icon: BookOpen,
      },
      {
        title: "Programs",
        url: "/dashboard/admin/programs",
        icon: GraduationCap,
      },
      {
        title: "Semesters",
        url: "/dashboard/admin/semesters",
        icon: Calendar,
      },
      {
        title: "Users",
        url: "/dashboard/admin/users",
        icon: Users,
      },
    ],
  },
];

// Student navigation items
export const studentSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Student Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/student",
        icon: LayoutDashboard,
      },
      {
        title: "Transcript & Progress",
        url: "/dashboard/student/transcript",
        icon: ClipboardList,
      },
      {
        title: "Planner",
        url: "/dashboard/student/planner",
        icon: Route,
      },
      {
        title: "History",
        url: "/dashboard/student/history",
        icon: FileText,
      },
    ],
  },
];

// Advisor navigation items
export const advisorSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Advisor Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/advisor",
        icon: LayoutDashboard,
      },
      {
        title: "Students",
        url: "/dashboard/advisor/students",
        icon: Users,
      },
    ],
  },
];

// Default sidebar items (when no role is detected)
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "GoPlan",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
];

// Helper function to get sidebar items based on user role
export function getSidebarItemsForRole(role: string | null): NavGroup[] {
  switch (role) {
    case "ADMIN":
      return adminSidebarItems;
    case "STUDENT":
      return studentSidebarItems;
    case "ADVISOR":
      return advisorSidebarItems;
    default:
      return sidebarItems;
  }
}
