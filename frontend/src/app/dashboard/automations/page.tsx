"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { AutomationLog } from "@/types";
import { toast } from "sonner";
import { Zap, Loader2, CheckCircle2, XCircle, SkipForward } from "lucide-react";

export default function AutomationsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/automations/logs");
      setLogs(res.data.logs);
    } catch {
      toast.error("Failed to load automation logs");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-600" />;
      case "skipped": return <SkipForward className="w-4 h-4 text-yellow-600" />;
      default: return <Zap className="w-4 h-4 text-blue-600" />;
    }
  };

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      new_contact: "New Contact",
      booking_created: "Booking Created",
      staff_reply: "Staff Reply",
      inventory_low: "Inventory Low",
      email_send: "Email Sent",
      form_overdue: "Form Overdue",
    };
    return labels[event] || event;
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
          <h1 className="page-title">Automations</h1>
          <p className="page-description">Event-driven automation execution history</p>
        </div>
      </div>

      {/* Rules Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Active Automation Rules</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { event: "New Contact", action: "Send welcome message" },
              { event: "Booking Created", action: "Send confirmation + forms" },
              { event: "Booking Created", action: "Deduct inventory" },
              { event: "Staff Reply", action: "Pause automation" },
              { event: "Inventory Low", action: "Create alert" },
              { event: "Form Overdue", action: "Send reminder" },
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-medium">{rule.event}</span>
                  <span className="text-muted-foreground"> → {rule.action}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      {logs.length === 0 ? (
        <div className="empty-state">
          <Zap className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No automation activity yet</h3>
          <p className="text-sm text-muted-foreground">Automations will trigger when contacts or bookings are created.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="animate-fade-in">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{getEventLabel(log.event_type)}</Badge>
                      <span className="text-sm">{log.action_taken}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  <Badge className={log.status === "success" ? "bg-green-100 text-green-800" : log.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                    {log.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}