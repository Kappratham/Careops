"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import api from "@/lib/api";
import { DashboardData } from "@/types";
import { toast } from "sonner";
import {
  Calendar,
  MessageSquare,
  ClipboardList,
  Package,
  Bell,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

function StatCardSkeleton() {
  return (
    <Card className="stat-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page-container space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Couldn’t load dashboard</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Check your connection and try again.
      </p>
      <Button onClick={onRetry} variant="default">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch {
      setError(true);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return <ErrorState onRetry={fetchDashboard} />;
  }

  if (!data) return null;

  const { stats } = data;
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description text-muted-foreground mt-0.5">
            {todayFormatted} · What&apos;s happening in your business
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboard}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{stats.todays_bookings}</p>
              <p className="text-xs text-muted-foreground truncate">Today&apos;s Bookings</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{stats.unread_conversations}</p>
              <p className="text-xs text-muted-foreground truncate">Unread Messages</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{stats.pending_forms}</p>
              <p className="text-xs text-muted-foreground truncate">Pending Forms</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{stats.low_stock_items}</p>
              <p className="text-xs text-muted-foreground truncate">Low Stock</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Second Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card border-0 shadow-sm">
          <div className="text-center py-2">
            <p className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
              {stats.completed_bookings}
            </p>
            <p className="text-xs text-muted-foreground">Completed Today</p>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm">
          <div className="text-center py-2">
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              {stats.no_show_bookings}
            </p>
            <p className="text-xs text-muted-foreground">No Shows</p>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm">
          <div className="text-center py-2">
            <p className="text-lg font-bold tabular-nums">{stats.total_contacts}</p>
            <p className="text-xs text-muted-foreground">Total Contacts</p>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm">
          <div className="text-center py-2">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {stats.new_contacts_today}
            </p>
            <p className="text-xs text-muted-foreground">New Today</p>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Today&apos;s Bookings</CardTitle>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.todays_bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center rounded-lg bg-muted/30">
                No bookings today
              </p>
            ) : (
              <div className="space-y-3">
                {data.todays_bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.service_name} · {booking.start_time}
                        </p>
                      </div>
                    </div>
                    <Badge className={`status-badge status-${booking.status} shrink-0 ml-2`}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Bookings</CardTitle>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.upcoming_bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center rounded-lg bg-muted/30">
                No upcoming bookings
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcoming_bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{booking.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.service_name} · {booking.booking_date}
                        </p>
                      </div>
                    </div>
                    <Badge className={`status-badge status-${booking.status} shrink-0 ml-2`}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" /> Active Alerts
          </CardTitle>
          <Link href="/dashboard/alerts">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recent_alerts.length === 0 ? (
            <div className="text-center py-8 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All clear! No active alerts.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recent_alerts.map((alert) => (
                <Link key={alert.id} href={alert.link_to || "/dashboard/alerts"}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors severity-${alert.severity}`}
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs opacity-70">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                {stats.overdue_forms}
              </p>
              <p className="text-xs text-muted-foreground">Overdue Forms</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                {stats.completed_forms}
              </p>
              <p className="text-xs text-muted-foreground">Completed Forms</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                {stats.critical_stock_items}
              </p>
              <p className="text-xs text-muted-foreground">Critical Stock</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
