"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import api from "@/lib/api";
import { Alert } from "@/types";
import { toast } from "sonner";
import { Bell, Loader2, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Info } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/alerts");
      setAlerts(res.data.alerts);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      await api.put(`/alerts/${id}/dismiss`);
      toast.success("Alert dismissed");
      fetchAlerts();
    } catch {
      toast.error("Failed to dismiss alert");
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-description">{alerts.length} active alerts</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
          <h3 className="font-medium mb-1">All clear!</h3>
          <p className="text-sm text-muted-foreground">No active alerts. Everything is running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`animate-fade-in hover:shadow-md transition-shadow ${alert.severity === "critical" ? "border-red-300" : alert.severity === "warning" ? "border-yellow-300" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.title}</p>
                        <Badge className={`severity-${alert.severity}`}>{alert.severity}</Badge>
                      </div>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.link_to && (
                      <Link href={alert.link_to}>
                        <Button variant="outline" size="sm">
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}