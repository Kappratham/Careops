"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, CheckCircle2, Calendar, Clock, ArrowRight, ArrowLeft, Zap, MapPin } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface PublicService {
  id: string; name: string; description: string; duration_minutes: number;
  price: number | null; location_type: string; address: string | null;
}

interface TimeSlot { start_time: string; end_time: string; }

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [services, setServices] = useState<PublicService[]>([]);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmData, setConfirmData] = useState<any>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/${slug}/services`);
      setServices(res.data.services);
      setBusinessName(res.data.business_name);
    } catch {
      toast.error("Business not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (serviceId: string, date: string) => {
    setSlotsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/public/${slug}/slots/${serviceId}?target_date=${date}`);
      setSlots(res.data.slots);
    } catch {
      toast.error("Failed to load available times");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedService) fetchSlots(selectedService.id, date);
  };

  const handleBook = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!selectedService || !selectedSlot) return;

    setBooking(true);
    try {
      const res = await axios.post(`${API_URL}/public/${slug}/book`, {
        service_id: selectedService.id,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        customer_name: name,
        customer_email: email || null,
        customer_phone: phone || null,
      });
      setConfirmData(res.data);
      setConfirmed(true);
      toast.success("Booking confirmed!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  // Get tomorrow as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <div className="space-y-2 text-sm text-muted-foreground mt-4">
              <p><strong>Service:</strong> {confirmData?.service_name}</p>
              <p><strong>Date:</strong> {confirmData?.booking_date}</p>
              <p><strong>Time:</strong> {confirmData?.start_time} - {confirmData?.end_time}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">You will receive a confirmation email shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">{businessName}</h1>
          <p className="text-muted-foreground">Book an appointment</p>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold">Select a Service</h2>
            {services.map((svc) => (
              <Card key={svc.id} className={`cursor-pointer hover:shadow-md transition-all ${selectedService?.id === svc.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setSelectedService(svc); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{svc.name}</h3>
                      {svc.description && <p className="text-sm text-muted-foreground">{svc.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {svc.duration_minutes} min</span>
                        {svc.price && <span>${svc.price}</span>}
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {svc.location_type}</span>
                      </div>
                    </div>
                    {selectedService?.id === svc.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={() => { if (selectedService) setStep(2); else toast.error("Select a service"); }}
              className="w-full h-11 gradient-primary text-white" disabled={!selectedService}>
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <h2 className="text-lg font-semibold">Select Date & Time</h2>
            <p className="text-sm text-muted-foreground">{selectedService?.name} · {selectedService?.duration_minutes} min</p>

            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input type="date" min={minDate} value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="h-11" />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <Label>Available Times</Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No available slots for this date. Try another date.</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <Button key={slot.start_time} variant={selectedSlot?.start_time === slot.start_time ? "default" : "outline"}
                        className={selectedSlot?.start_time === slot.start_time ? "gradient-primary text-white" : ""}
                        onClick={() => setSelectedSlot(slot)}>
                        {slot.start_time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button onClick={() => { if (selectedSlot) setStep(3); else toast.error("Select a time slot"); }}
              className="w-full h-11 gradient-primary text-white" disabled={!selectedSlot}>
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 3: Your Details */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <h2 className="text-lg font-semibold">Your Details</h2>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 text-sm">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{selectedService?.name}</p>
                    <p className="text-muted-foreground">{selectedDate} at {selectedSlot?.start_time} - {selectedSlot?.end_time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="(optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
              </div>
            </div>

            <Button onClick={handleBook} className="w-full h-12 gradient-primary text-white text-lg" disabled={booking}>
              {booking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              {booking ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}