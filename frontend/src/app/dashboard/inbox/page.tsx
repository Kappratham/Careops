"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { Conversation, ConversationDetail } from "@/types";
import { toast } from "sonner";
import {
  MessageSquare, Search, Send, Loader2, Mail, ArrowLeft, User,
} from "lucide-react";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/conversations");
      setConversations(res.data.conversations);
    } catch {
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/conversations/${id}`);
      setSelected(res.data);
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/conversations/${selected.id}/messages`, {
        content: reply,
        channel: "email",
      });
      setReply("");
      await selectConversation(selected.id);
      await fetchConversations();
      toast.success("Reply sent!");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) =>
    !search || c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Conversation List */}
      <div className={`w-full md:w-96 border-r flex flex-col bg-white ${selected ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Inbox
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state py-16">
              <MessageSquare className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`inbox-item ${!conv.is_read ? "inbox-item-unread" : ""} ${selected?.id === conv.id ? "bg-muted" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${!conv.is_read ? "font-semibold" : "font-medium"}`}>
                      {conv.contact_name || "Unknown"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.contact_email}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge className="bg-primary text-white text-xs">{conv.unread_count}</Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className={`flex-1 flex flex-col bg-white ${!selected ? "hidden md:flex" : "flex"}`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select a conversation to view</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelected(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{selected.contact_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.contact_email} {selected.contact_phone && `· ${selected.contact_phone}`}
                </p>
              </div>
              {selected.automation_paused && (
                <Badge variant="outline" className="ml-auto">Automation Paused</Badge>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {selected.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={msg.direction === "outbound" ? "message-bubble-outbound" : "message-bubble-inbound"}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs opacity-70 capitalize">{msg.sender_type}</span>
                      <Mail className="w-3 h-3 opacity-50" />
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="min-h-[60px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
                  }}
                />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} className="gradient-primary text-white self-end">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}