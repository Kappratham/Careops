"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import api from "@/lib/api";
import { Contact, Booking, Conversation } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, User, Mail, Phone, Calendar,
  MessageSquare, Clock, FileText,
} from "lucide-react";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [contactId]);

  const fetchData = async () => {
    try {
      const [contactRes, bookingsRes, convRes] = await Promise.all([
        api.get(`/contacts/${contactId}`),
        api.get("/bookings"),
        api.get("/conversations"),
      ]);
      setContact(contactRes.data);

      // Filter bookings and conversations for this contact
      setBookings(
        bookingsRes.data.bookings.filter((b: Booking) => b.contact_id === contactId)
      );
      setConversations(
        convRes.data.conversations.filter((c: Conversation) => c.contact_id === contactId)
      );
    } catch {
      toast.error("Failed to load contact");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="page-container">
        <p>Contact not found</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Button variant="ghost" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
      </Button>

      {/* Contact Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{contact.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {contact.email}
                  </span>
                )}
                {contact.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {contact.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{contact.source}</Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Bookings ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No bookings</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">{booking.service_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.booking_date} at {booking.start_time}
                        </p>
                      </div>
                      <Badge className={`status-badge status-${booking.status}`}>
                        {booking.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Conversations ({conversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No conversations</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <Link key={conv.id} href={`/dashboard/inbox/${conv.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">{conv.subject || "Conversation"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {conv.last_message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!conv.is_read && (
                          <Badge className="bg-primary text-white text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}