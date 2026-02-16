"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import api from "@/lib/api";
import { Booking, FormSubmission } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Calendar, Clock, User, Mail, Phone,
  CheckCircle2, XCircle, AlertTriangle, FileText, Copy, MapPin,
} from "lucide-react";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      const [bookingRes, formsRes] = await Promise.all([
        api.get(`/bookings/${bookingId}`),
        api.get("/forms/submissions"),
      ]);
      setBooking(bookingRes.data);
      setForms(
        formsRes.data.submissions.filter((f: FormSubmission) => f.booking_id === bookingId)
      );
    } catch {
      toast.error("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      toast.success(`Booking marked as ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to update");
    }
  };

  const copyFormLink = (token: string) => {
    const url = `${window.location.origin}/p/forms/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Form link copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-container">
        <p>Booking not found</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bookings
      </Button>

      {/* Booking Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Booking Details
            </CardTitle>
            <Badge className={`status-badge status-${booking.status} text-sm`}>
              {booking.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium text-lg">{booking.service_name}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {booking.booking_date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {booking.start_time} - {booking.end_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{booking.service_duration} min</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Customer</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  {booking.customer_email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {booking.customer_email}
                    </p>
                  )}
                  {booking.customer_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {booking.customer_phone}
                    </p>
                  )}
                </div>
              </div>
              <Link href={`/dashboard/contacts/${booking.contact_id}`}>
                <Button variant="outline" size="sm">View Contact Profile</Button>
              </Link>
            </div>
          </div>

          {booking.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1">{booking.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          {booking.status === "confirmed" && (
            <>
              <Separator />
              <div className="flex gap-3">
                <Button onClick={() => updateStatus("completed")} className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                </Button>
                <Button variant="outline" onClick={() => updateStatus("no_show")}>
                  <AlertTriangle className="w-4 h-4 mr-2" /> No Show
                </Button>
                <Button variant="outline" className="text-red-600" onClick={() => updateStatus("cancelled")}>
                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Linked Forms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" /> Linked Forms ({forms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No forms linked to this booking</p>
          ) : (
            <div className="space-y-3">
              {forms.map((form) => (
                <div key={form.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{form.form_name || "Form"}</p>
                      {form.deadline && (
                        <p className="text-xs text-muted-foreground">
                          Deadline: {new Date(form.deadline).toLocaleString()}
                        </p>
                      )}
                      {form.submitted_at && (
                        <p className="text-xs text-green-600">
                          Submitted: {new Date(form.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`status-badge status-${form.status}`}>{form.status}</Badge>
                    {form.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => copyFormLink(form.token)}>
                        <Copy className="w-3 h-3 mr-1" /> Copy Link
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}