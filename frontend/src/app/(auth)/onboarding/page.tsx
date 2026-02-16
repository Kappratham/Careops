"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import {
  Building2, Mail, FileText, Calendar, ClipboardList, Package, Users, Rocket,
  CheckCircle2, Circle, Loader2, ArrowRight, ArrowLeft, Zap, Plus, Trash2,
  LucideIcon,
} from "lucide-react";

interface StepInfo {
  id: number;
  title: string;
  icon: LucideIcon;
  description: string;
}

interface AvailSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ServiceForm {
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  location_type: string;
  buffer_minutes: number;
  availability_slots: AvailSlot[];
}

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  placeholder: string;
}

interface FormTemplateForm {
  name: string;
  description: string;
  fields: FormField[];
  deadline_hours: number;
}

interface InventoryForm {
  name: string;
  unit: string;
  current_quantity: number;
  low_threshold: number;
}

interface StaffForm {
  email: string;
  full_name: string;
  permissions: Record<string, boolean>;
}

const STEPS: StepInfo[] = [
  { id: 1, title: "Workspace", icon: Building2, description: "Business details" },
  { id: 2, title: "Communications", icon: Mail, description: "Email & SMS" },
  { id: 3, title: "Contact Form", icon: FileText, description: "Public form" },
  { id: 4, title: "Services", icon: Calendar, description: "Booking types" },
  { id: 5, title: "Forms", icon: ClipboardList, description: "Post-booking" },
  { id: 6, title: "Inventory", icon: Package, description: "Resources" },
  { id: 7, title: "Team", icon: Users, description: "Staff members" },
  { id: 8, title: "Activate", icon: Rocket, description: "Go live!" },
];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo",
  "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_SLOTS: AvailSlot[] = [
  { day_of_week: 0, start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 2, start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 3, start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 4, start_time: "09:00", end_time: "17:00", is_active: true },
];

const DEFAULT_FIELDS: FormField[] = [
  { name: "full_name", label: "Full Name", type: "text", required: true, options: null, placeholder: "Enter your full name" },
  { name: "phone", label: "Phone Number", type: "phone", required: true, options: null, placeholder: "Your phone number" },
  { name: "notes", label: "Additional Notes", type: "textarea", required: false, options: null, placeholder: "Anything we should know?" },
];

function createDefaultService(): ServiceForm {
  return {
    name: "", description: "", duration_minutes: 30, price: "",
    location_type: "virtual", buffer_minutes: 0,
    availability_slots: DEFAULT_SLOTS.map((s) => ({ ...s })),
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, fetchUser, fetchWorkspace, fetchOnboarding, workspace, onboarding } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [contactEmail, setContactEmail] = useState("");
  const [emailProvider, setEmailProvider] = useState("resend");
  const [emailApiKey, setEmailApiKey] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Thank you for reaching out! We will get back to you shortly.");
  const [services, setServices] = useState<ServiceForm[]>([createDefaultService()]);
  const [formTemplates, setFormTemplates] = useState<FormTemplateForm[]>([{
    name: "Intake Form", description: "Please fill this before your appointment",
    fields: DEFAULT_FIELDS.map((f) => ({ ...f })), deadline_hours: 24,
  }]);
  const [inventoryItems, setInventoryItems] = useState<InventoryForm[]>([
    { name: "", unit: "pieces", current_quantity: 0, low_threshold: 5 },
  ]);
  const [staffMembers, setStaffMembers] = useState<StaffForm[]>([
    { email: "", full_name: "", permissions: { inbox: true, bookings: true, forms: true, inventory: false } },
  ]);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated()) { router.push("/login"); return; }
      await fetchUser();
      setPageLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (workspace && onboarding) {
      if (workspace.status === "active") { router.push("/dashboard"); return; }
      setCurrentStep(Math.max(onboarding.current_step, 1));
      if (user?.email) setContactEmail(user.email);
    }
  }, [workspace, onboarding]);

  const handleStep1 = async () => {
    if (!businessName.trim()) { toast.error("Business name is required"); return; }
    if (!contactEmail.trim()) { toast.error("Contact email is required"); return; }
    setLoading(true);
    try {
      if (!workspace) { await api.post("/workspace/", { name: businessName, address, timezone, contact_email: contactEmail }); }
      else { await api.put("/workspace/", { name: businessName, address, timezone, contact_email: contactEmail }); }
      await api.put("/workspace/onboarding/step/2");
      await fetchWorkspace(); await fetchOnboarding();
      toast.success("Workspace created!"); setCurrentStep(2);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleStep2 = async () => {
    setLoading(true);
    try {
      await api.post("/workspace/integrations", { type: "email", provider: emailProvider, config: { api_key: emailApiKey || "mock_key", from_email: contactEmail } });
      if (smsEnabled) { await api.post("/workspace/integrations", { type: "sms", provider: "mock", config: { from_number: "+1234567890" } }); }
      await api.put("/workspace/onboarding/step/3"); await fetchOnboarding();
      toast.success("Communications configured!"); setCurrentStep(3);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    setLoading(true);
    try {
      await api.put("/workspace/", {
        contact_form_config: { fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "phone", required: false },
          { name: "message", label: "Message", type: "textarea", required: false },
        ] }, welcome_message_template: welcomeMessage,
      });
      await api.put("/workspace/onboarding/step/4"); await fetchOnboarding();
      toast.success("Contact form configured!"); setCurrentStep(4);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleStep4 = async () => {
    const valid = services.filter((s) => s.name.trim());
    if (valid.length === 0) { toast.error("Add at least one service"); return; }
    setLoading(true);
    try {
      for (const svc of valid) {
        await api.post("/services", {
          name: svc.name, description: svc.description, duration_minutes: svc.duration_minutes,
          price: svc.price ? parseFloat(svc.price) : null, location_type: svc.location_type,
          buffer_minutes: svc.buffer_minutes, availability_slots: svc.availability_slots.filter((s) => s.is_active),
        });
      }
      await api.put("/workspace/onboarding/step/5"); await fetchOnboarding();
      toast.success("Services created!"); setCurrentStep(5);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleStep5 = async () => {
    setLoading(true);
    try {
      for (const tmpl of formTemplates.filter((f) => f.name.trim())) { await api.post("/forms/templates", tmpl); }
      await api.put("/workspace/onboarding/step/6"); await fetchOnboarding();
      toast.success("Forms configured!"); setCurrentStep(6);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleStep6 = async () => {
    setLoading(true);
    try {
      for (const item of inventoryItems.filter((i) => i.name.trim())) { await api.post("/inventory", item); }
      await api.put("/workspace/onboarding/step/7"); await fetchOnboarding();
      toast.success("Inventory set up!"); setCurrentStep(7);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleStep7 = async () => {
    setLoading(true);
    try {
      for (const m of staffMembers.filter((s) => s.email.trim() && s.full_name.trim())) { await api.post("/workspace/staff", m); }
      await api.put("/workspace/onboarding/step/8"); await fetchOnboarding();
      toast.success("Team invited!"); setCurrentStep(8);
    } catch (error: any) { toast.error(error.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await api.post("/workspace/activate"); await fetchWorkspace(); await fetchOnboarding();
      toast.success("🎉 Workspace activated!"); router.push("/dashboard");
    } catch (error: any) { toast.error(error.response?.data?.detail || "Cannot activate yet"); }
    finally { setLoading(false); }
  };

  const skipStep = async (next: number) => {
    try { await api.put(`/workspace/onboarding/step/${next}`); await fetchOnboarding(); } catch { /* skip */ }
    setCurrentStep(next);
  };

  const updateService = (idx: number, field: keyof ServiceForm, value: any) => {
    setServices((prev) => { const u = [...prev]; u[idx] = { ...u[idx], [field]: value }; return u; });
  };

  const updateServiceSlot = (sIdx: number, dayIdx: number, active: boolean) => {
    setServices((prev) => {
      const u = [...prev];
      const svc = { ...u[sIdx], availability_slots: [...u[sIdx].availability_slots] };
      const eIdx = svc.availability_slots.findIndex((s) => s.day_of_week === dayIdx);
      if (active && eIdx === -1) { svc.availability_slots.push({ day_of_week: dayIdx, start_time: "09:00", end_time: "17:00", is_active: true }); }
      else if (eIdx !== -1) { svc.availability_slots[eIdx] = { ...svc.availability_slots[eIdx], is_active: active }; }
      u[sIdx] = svc; return u;
    });
  };

  const isStepDone = (id: number): boolean => {
    if (!onboarding) return false;
    const map: Record<number, boolean> = {
      1: onboarding.workspace_created, 2: onboarding.communication_setup,
      3: onboarding.contact_form_created, 4: onboarding.services_created,
      5: onboarding.forms_created, 6: onboarding.inventory_created,
      7: onboarding.team_invited, 8: onboarding.workspace_activated,
    };
    return map[id] || false;
  };

  if (pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const BackContinue = ({ back, onContinue, skip }: { back: number; onContinue: () => void; skip?: number }) => (
    <div className="flex flex-wrap gap-3 pt-4">
      <Button variant="outline" onClick={() => setCurrentStep(back)} className="h-11"><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
      {skip && <Button variant="outline" onClick={() => skipStep(skip)} className="h-11">Skip</Button>}
      <Button onClick={onContinue} className="flex-1 min-w-[200px] h-11 gradient-primary text-white" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Save & Continue <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
          <span className="font-bold text-lg">CareOps Setup</span>
          <span className="text-sm text-muted-foreground ml-auto">Step {currentStep} of 8</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Stepper */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border p-4 lg:sticky lg:top-24">
            <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Setup Steps</h3>
            <div className="space-y-1">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const done = isStepDone(step.id);
                const active = currentStep === step.id;
                return (
                  <button key={step.id}
                    onClick={() => { if (step.id <= (onboarding?.current_step || 1) + 1) setCurrentStep(step.id); }}
                    className={`onboarding-step w-full text-left ${active ? "onboarding-step-active" : done ? "onboarding-step-done" : "onboarding-step-pending"}`}>
                    {done ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Icon className="w-5 h-5 flex-shrink-0" />}
                    <div><div className="text-sm font-medium">{step.title}</div><div className="text-xs opacity-70">{step.description}</div></div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {currentStep === 1 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Building2 className="w-5 h-5" /> Create Your Workspace</CardTitle>
                <CardDescription>Enter your business information to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input placeholder="Bright Smile Dental Clinic" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea placeholder="123 Main St, City, State, ZIP" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMEZONES.map((tz) => (<SelectItem key={tz} value={tz}>{tz}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email *</Label>
                    <Input type="email" placeholder="contact@business.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-11 w-full" />
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={handleStep1} className="w-full h-11 gradient-primary text-white" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save & Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Mail className="w-5 h-5" /> Set Up Communications</CardTitle>
                <CardDescription>Connect email and SMS to reach your customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Email Provider</Label>
                  <Select value={emailProvider} onValueChange={setEmailProvider}>
                    <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend (Recommended)</SelectItem>
                      <SelectItem value="mock">Mock (For Testing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>API Key {emailProvider === "mock" && "(optional for mock)"}</Label>
                  <Input placeholder="re_xxxxxxxxxxxx" value={emailApiKey} onChange={(e) => setEmailApiKey(e.target.value)} className="h-11 w-full" />
                  <p className="text-xs text-muted-foreground">Get your free API key from resend.com</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div><Label>Enable SMS</Label><p className="text-xs text-muted-foreground">SMS notifications for customers</p></div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
                <BackContinue back={1} onContinue={handleStep2} />
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><FileText className="w-5 h-5" /> Configure Contact Form</CardTitle>
                <CardDescription>Set up the public form customers will use to reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-3">Default form fields:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Name (required)", "Email (required)", "Phone (optional)", "Message (optional)"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />{f}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Welcome Message (sent automatically)</Label>
                  <Textarea rows={4} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} className="w-full" />
                  <p className="text-xs text-muted-foreground">Sent to customers when they submit the contact form.</p>
                </div>
                <BackContinue back={2} onContinue={handleStep3} />
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Calendar className="w-5 h-5" /> Set Up Services</CardTitle>
                <CardDescription>Define the services or meetings customers can book</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {services.map((svc, idx) => (
                  <div key={idx} className="border rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Service {idx + 1}</h4>
                      {services.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => setServices((p) => p.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Service Name *</Label>
                        <Input placeholder="e.g. Consultation" value={svc.name} onChange={(e) => updateService(idx, "name", e.target.value)} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input type="number" value={svc.duration_minutes} onChange={(e) => updateService(idx, "duration_minutes", parseInt(e.target.value) || 30)} className="h-11 w-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input placeholder="0.00 (optional)" value={svc.price} onChange={(e) => updateService(idx, "price", e.target.value)} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Select value={svc.location_type} onValueChange={(v) => updateService(idx, "location_type", v)}>
                          <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="virtual">Virtual</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Describe this service..." value={svc.description} onChange={(e) => updateService(idx, "description", e.target.value)} rows={2} className="w-full" />
                    </div>
                    <div className="space-y-3">
                      <Label>Availability</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {DAYS.map((day, dayIdx) => {
                          const slot = svc.availability_slots.find((s) => s.day_of_week === dayIdx);
                          return (
                            <div key={dayIdx} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border">
                              <Switch checked={slot?.is_active || false} onCheckedChange={(c) => updateServiceSlot(idx, dayIdx, c)} />
                              <span className="text-sm font-medium">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setServices((p) => [...p, createDefaultService()])}>
                  <Plus className="w-4 h-4 mr-2" /> Add Another Service
                </Button>
                <BackContinue back={3} onContinue={handleStep4} />
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="w-5 h-5" /> Post-Booking Forms</CardTitle>
                <CardDescription>Forms sent automatically after a booking is created</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {formTemplates.map((form, idx) => (
                  <div key={idx} className="border rounded-xl p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Form Name</Label>
                        <Input value={form.name} onChange={(e) => { const u = [...formTemplates]; u[idx] = { ...u[idx], name: e.target.value }; setFormTemplates(u); }} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Deadline (hours before appointment)</Label>
                        <Input type="number" value={form.deadline_hours} onChange={(e) => { const u = [...formTemplates]; u[idx] = { ...u[idx], deadline_hours: parseInt(e.target.value) || 24 }; setFormTemplates(u); }} className="h-11 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={(e) => { const u = [...formTemplates]; u[idx] = { ...u[idx], description: e.target.value }; setFormTemplates(u); }} rows={2} className="w-full" />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Included Fields:</p>
                      <div className="flex flex-wrap gap-2">
                        {form.fields.map((f, fi) => (
                          <span key={fi} className="text-xs bg-white px-2.5 py-1 rounded-md border font-medium">{f.label}{f.required && " *"}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <BackContinue back={4} onContinue={handleStep5} skip={6} />
              </CardContent>
            </Card>
          )}

          {currentStep === 6 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Package className="w-5 h-5" /> Set Up Inventory</CardTitle>
                <CardDescription>Track resources and supplies used per booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {inventoryItems.map((item, idx) => (
                  <div key={idx} className="border rounded-xl p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Item Name</Label>
                        <Input placeholder="e.g. Gloves" value={item.name} onChange={(e) => { const u = [...inventoryItems]; u[idx] = { ...u[idx], name: e.target.value }; setInventoryItems(u); }} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input placeholder="pieces" value={item.unit} onChange={(e) => { const u = [...inventoryItems]; u[idx] = { ...u[idx], unit: e.target.value }; setInventoryItems(u); }} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Qty</Label>
                        <Input type="number" value={item.current_quantity} onChange={(e) => { const u = [...inventoryItems]; u[idx] = { ...u[idx], current_quantity: parseInt(e.target.value) || 0 }; setInventoryItems(u); }} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Low Alert At</Label>
                        <Input type="number" value={item.low_threshold} onChange={(e) => { const u = [...inventoryItems]; u[idx] = { ...u[idx], low_threshold: parseInt(e.target.value) || 5 }; setInventoryItems(u); }} className="h-11 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setInventoryItems((p) => [...p, { name: "", unit: "pieces", current_quantity: 0, low_threshold: 5 }])}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
                <BackContinue back={5} onContinue={handleStep6} skip={7} />
              </CardContent>
            </Card>
          )}

          {currentStep === 7 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Users className="w-5 h-5" /> Invite Your Team</CardTitle>
                <CardDescription>Add staff members who will handle daily operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {staffMembers.map((member, idx) => (
                  <div key={idx} className="border rounded-xl p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="Jane Smith" value={member.full_name} onChange={(e) => { const u = [...staffMembers]; u[idx] = { ...u[idx], full_name: e.target.value }; setStaffMembers(u); }} className="h-11 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="jane@business.com" value={member.email} onChange={(e) => { const u = [...staffMembers]; u[idx] = { ...u[idx], email: e.target.value }; setStaffMembers(u); }} className="h-11 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(member.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border">
                            <Switch checked={value} onCheckedChange={(c) => {
                              const u = [...staffMembers]; u[idx] = { ...u[idx], permissions: { ...u[idx].permissions, [key]: c } }; setStaffMembers(u);
                            }} />
                            <span className="text-sm font-medium capitalize">{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setStaffMembers((p) => [...p, { email: "", full_name: "", permissions: { inbox: true, bookings: true, forms: true, inventory: false } }])}>
                  <Plus className="w-4 h-4 mr-2" /> Add Staff Member
                </Button>
                <BackContinue back={6} onContinue={handleStep7} skip={8} />
              </CardContent>
            </Card>
          )}

          {currentStep === 8 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Rocket className="w-5 h-5" /> Activate Your Workspace</CardTitle>
                <CardDescription>Review your setup and go live</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  {STEPS.slice(0, 7).map((step) => {
                    const done = isStepDone(step.id);
                    const required = [1, 2, 4].includes(step.id);
                    return (
                      <div key={step.id} className={`flex items-center gap-3 p-4 rounded-lg ${done ? "bg-green-50 border border-green-200" : required ? "bg-red-50 border border-red-200" : "bg-gray-50 border"}`}>
                        {done ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                        <span className={`text-sm font-medium flex-1 ${done ? "text-green-800" : ""}`}>{step.title}</span>
                        {required && !done && <span className="text-xs text-red-500 font-medium">Required</span>}
                        {!required && !done && <span className="text-xs text-muted-foreground">Optional</span>}
                        {done && <span className="text-xs text-green-600 font-medium">Complete ✓</span>}
                      </div>
                    );
                  })}
                </div>
                <Separator />
                {onboarding?.can_activate ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-800 font-medium flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> All required steps complete! You can activate now.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800 font-medium flex items-center gap-2"><Circle className="w-5 h-5" /> Complete required steps before activating.</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(7)} className="h-11"><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
                  <Button onClick={handleActivate} className="flex-1 min-w-[200px] h-12 gradient-primary text-white text-lg" disabled={loading || !onboarding?.can_activate}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Rocket className="w-5 h-5 mr-2" />}
                    {loading ? "Activating..." : "🚀 Activate Workspace"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}