"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { Booking } from "@/types";
import { toast } from "sonner";
import { Calendar, Loader2, Clock, User, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await api.get(`/bookings${params}`);
      setBookings(res.data.bookings);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      toast.success(`Booking marked as ${status}`);
      fetchBookings();
    } catch {
      toast.error("Failed to update booking");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "no_show": return <XCircle className="w-4 h-4 text-orange-600" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-description">Manage all your appointments</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No bookings found</h3>
          <p className="text-sm text-muted-foreground">Bookings will appear here when customers book through your public page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(booking.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{booking.customer_name}</p>
                        <Badge className={`status-badge status-${booking.status}`}>{booking.status}</Badge>
                        {booking.form_status && (
                          <Badge variant="outline" className={`status-badge status-${booking.form_status}`}>
                            Forms: {booking.form_status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.booking_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.start_time} - {booking.end_time}</span>
                        <span>{booking.service_name}</span>
                      </div>
                      {booking.customer_email && (
                        <p className="text-xs text-muted-foreground mt-1">{booking.customer_email} {booking.customer_phone && `· ${booking.customer_phone}`}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === "confirmed" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, "completed")}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, "no_show")}>
                          <AlertTriangle className="w-4 h-4 mr-1" /> No Show
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus(booking.id, "cancelled")}>
                          <XCircle className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      </>
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