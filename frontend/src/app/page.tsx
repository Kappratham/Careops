"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MessageSquare,
  ClipboardList,
  Package,
  Bell,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">CareOps</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-primary text-white">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Replace your tool chaos with one platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            One Platform for{" "}
            <span className="gradient-text">All Your Operations</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop juggling between tools. CareOps unifies your leads, bookings,
            communications, forms, inventory, and reporting into a single
            powerful dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gradient-primary text-white h-12 px-8 text-lg">
                Start Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Sound familiar?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "😰", text: "Leads are missed because no one follows up" },
              { icon: "📅", text: "Bookings fall through the cracks" },
              { icon: "📧", text: "Customer messages scattered across tools" },
              { icon: "📋", text: "Forms remain incomplete before appointments" },
              { icon: "📦", text: "Inventory runs out unexpectedly" },
              { icon: "👁️", text: "No real-time visibility into operations" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border hover:shadow-md transition-shadow animate-fade-in"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything in one place
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Set up once, run forever. CareOps connects all your operations into
            a single clear system.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Unified Inbox",
                desc: "All customer communication in one place. Email, SMS, automated messages.",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Smart Bookings",
                desc: "Public booking pages, automatic confirmations, reminders, and no-show tracking.",
              },
              {
                icon: <ClipboardList className="w-6 h-6" />,
                title: "Auto Forms",
                desc: "Forms sent automatically after booking. Track completion and send reminders.",
              },
              {
                icon: <Package className="w-6 h-6" />,
                title: "Inventory Tracking",
                desc: "Track resources per booking. Get alerts before you run out.",
              },
              {
                icon: <Bell className="w-6 h-6" />,
                title: "Smart Alerts",
                desc: "Never miss anything. Alerts for overdue forms, low stock, missed messages.",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Live Dashboard",
                desc: "See everything happening in your business right now from one screen.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Up and running in minutes
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Create your workspace", desc: "Enter your business details and you're started" },
              { step: "2", title: "Connect communications", desc: "Set up email and SMS to start reaching customers" },
              { step: "3", title: "Configure services", desc: "Define what you offer, when you're available" },
              { step: "4", title: "Go live", desc: "Activate and your booking pages, forms, and automations start working" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start bg-white p-6 rounded-xl border">
                <div className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to unify your operations?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join service businesses that replaced 6+ tools with one platform.
          </p>
          <Link href="/register">
            <Button size="lg" className="gradient-primary text-white h-12 px-8 text-lg">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span>CareOps © 2025</span>
          </div>
          <p>Built for service businesses</p>
        </div>
      </footer>
    </div>
  );
}