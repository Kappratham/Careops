"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard, MessageSquare, Users, Calendar, ClipboardList,
  Package, Bell, Zap, Settings, LogOut, UserPlus, LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string | null;
  ownerOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null, ownerOnly: false },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare, permission: "inbox", ownerOnly: false },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users, permission: "inbox", ownerOnly: false },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar, permission: "bookings", ownerOnly: false },
  { href: "/dashboard/forms", label: "Forms", icon: ClipboardList, permission: "forms", ownerOnly: false },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package, permission: "inventory", ownerOnly: false },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell, permission: null, ownerOnly: false },
  { href: "/dashboard/automations", label: "Automations", icon: Zap, permission: null, ownerOnly: true },
  { href: "/dashboard/team", label: "Team", icon: UserPlus, permission: null, ownerOnly: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: null, ownerOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, workspace, logout } = useAuthStore();

  const isOwner = user?.role === "owner";

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isOwner) return true;
    if (item.ownerOnly) return false;
    if (item.permission && user?.permissions) {
      return user.permissions[item.permission] === true;
    }
    return !item.permission;
  });

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col sticky top-0">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">{workspace?.name || "CareOps"}</div>
            <div className="text-xs text-muted-foreground">
              {isOwner ? "Owner" : "Staff"} · {workspace?.slug || ""}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={isActive ? "sidebar-link-active" : "sidebar-link"}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.full_name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-red-500 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}