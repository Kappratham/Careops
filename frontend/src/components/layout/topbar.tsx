"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { workspace } = useAuthStore();

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <span className="text-sm text-muted-foreground">
            {workspace?.status === "active" ? "🟢 Live" : "🟡 Setup"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {workspace?.slug && (
          <Link href={`/p/${workspace.slug}/book`} target="_blank">
            <Button variant="outline" size="sm">View Booking Page</Button>
          </Link>
        )}
        <Link href="/dashboard/alerts">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}