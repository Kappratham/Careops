"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { FormTemplate, FormSubmission } from "@/types";
import { toast } from "sonner";
import { ClipboardList, Loader2, FileText, Clock, CheckCircle2, AlertTriangle, ExternalLink, Copy } from "lucide-react";

export default function FormsPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tmplRes, subRes] = await Promise.all([
        api.get("/forms/templates"),
        api.get("/forms/submissions"),
      ]);
      setTemplates(tmplRes.data.templates);
      setSubmissions(subRes.data.submissions);
    } catch {
      toast.error("Failed to load forms data");
    } finally {
      setLoading(false);
    }
  };

  const copyFormLink = (token: string) => {
    const url = `${window.location.origin}/p/forms/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Form link copied!");
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const completedCount = submissions.filter((s) => s.status === "completed").length;
  const overdueCount = submissions.filter((s) => s.status === "overdue").length;

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
          <h1 className="page-title">Forms</h1>
          <p className="page-description">Manage form templates and track submissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-xl font-bold">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-3 mt-4">
          {submissions.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No form submissions yet</h3>
              <p className="text-sm text-muted-foreground">Forms are sent automatically after bookings are created.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <Card key={sub.id} className="animate-fade-in hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{sub.form_name || "Form"}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                          <span>{sub.contact_name}</span>
                          <span>·</span>
                          <span>Booking: {sub.booking_date}</span>
                        </div>
                        {sub.deadline && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Deadline: {new Date(sub.deadline).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`status-badge status-${sub.status}`}>{sub.status}</Badge>
                      {sub.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => copyFormLink(sub.token)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy Link
                        </Button>
                      )}
                      {sub.status === "completed" && sub.submitted_at && (
                        <span className="text-xs text-muted-foreground">
                          Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-3 mt-4">
          {templates.length === 0 ? (
            <div className="empty-state">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No form templates</h3>
              <p className="text-sm text-muted-foreground">Create templates during onboarding or in settings.</p>
            </div>
          ) : (
            templates.map((tmpl) => (
              <Card key={tmpl.id} className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tmpl.name}</p>
                      <p className="text-sm text-muted-foreground">{tmpl.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tmpl.fields.length} fields · Deadline: {tmpl.deadline_hours}h before appointment
                      </p>
                    </div>
                    <Badge variant={tmpl.is_active ? "default" : "secondary"}>
                      {tmpl.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}