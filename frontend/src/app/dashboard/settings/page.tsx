"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Integration } from "@/types";
import { toast } from "sonner";
import { Loader2, ExternalLink, Globe, Copy, Mail, MessageSquare } from "lucide-react";

export default function SettingsPage() {
  const { workspace } = useAuthStore();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/workspace/integrations");
      setIntegrations(res.data.integrations);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (path: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${path}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
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
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Workspace configuration and public links</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Workspace Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Business Name</Label>
              <p className="font-medium">{workspace?.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Status</Label>
              <Badge variant={workspace?.status === "active" ? "default" : "secondary"}>{workspace?.status}</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Slug</Label>
              <p className="font-medium">{workspace?.slug}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Timezone</Label>
              <p className="font-medium">{workspace?.timezone}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Contact Email</Label>
              <p className="font-medium">{workspace?.contact_email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Address</Label>
              <p className="font-medium">{workspace?.address || "Not set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5" /> Public Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Contact Form</p>
              <p className="text-xs text-muted-foreground">/p/{workspace?.slug}/contact</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyLink(`/p/${workspace?.slug}/contact`)}>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
              <a href={`/p/${workspace?.slug}/contact`} target="_blank">
                <Button variant="outline" size="sm"><ExternalLink className="w-3 h-3 mr-1" /> Open</Button>
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Booking Page</p>
              <p className="text-xs text-muted-foreground">/p/{workspace?.slug}/book</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyLink(`/p/${workspace?.slug}/book`)}>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
              <a href={`/p/${workspace?.slug}/book`} target="_blank">
                <Button variant="outline" size="sm"><ExternalLink className="w-3 h-3 mr-1" /> Open</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Connected Integrations</CardTitle></CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No integrations configured.</p>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {integration.type === "email" ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    <div>
                      <p className="font-medium text-sm capitalize">{integration.type} - {integration.provider}</p>
                      <p className="text-xs text-muted-foreground">Connected {new Date(integration.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={integration.status === "active" ? "default" : "destructive"}>{integration.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
