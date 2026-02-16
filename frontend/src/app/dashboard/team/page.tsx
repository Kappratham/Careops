"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import api from "@/lib/api";
import { Staff } from "@/types";
import { toast } from "sonner";
import { Users, Loader2, Plus, Mail, Shield } from "lucide-react";

export default function TeamPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: "", full_name: "",
    permissions: { inbox: true, bookings: true, forms: true, inventory: false },
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get("/workspace/staff");
      setStaff(res.data.staff);
    } catch {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const inviteStaff = async () => {
    if (!newStaff.email.trim() || !newStaff.full_name.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      await api.post("/workspace/staff", newStaff);
      toast.success("Staff member invited!");
      setShowInvite(false);
      setNewStaff({ email: "", full_name: "", permissions: { inbox: true, bookings: true, forms: true, inventory: false } });
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to invite");
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
          <h1 className="page-title">Team</h1>
          <p className="page-description">Manage staff members and permissions</p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white"><Plus className="w-4 h-4 mr-2" /> Invite Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Staff Member</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Jane Smith" value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jane@business.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
              </div>
              <div className="space-y-3">
                <Label>Permissions</Label>
                {Object.entries(newStaff.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key}</span>
                    <Switch checked={value} onCheckedChange={(checked) => setNewStaff({
                      ...newStaff,
                      permissions: { ...newStaff.permissions, [key]: checked },
                    })} />
                  </div>
                ))}
              </div>
              <Button onClick={inviteStaff} className="w-full gradient-primary text-white">Send Invite</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {staff.length === 0 ? (
        <div className="empty-state">
          <Users className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No staff members yet</h3>
          <p className="text-sm text-muted-foreground">Invite team members to help manage daily operations.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {staff.map((member) => (
            <Card key={member.id} className="animate-fade-in hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-primary">{member.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.full_name}</p>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {member.email}
                    </p>
                    {member.permissions && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(member.permissions).map(([key, value]) => (
                          value && <Badge key={key} variant="outline" className="text-xs capitalize">{key}</Badge>
                        ))}
                      </div>
                    )}
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