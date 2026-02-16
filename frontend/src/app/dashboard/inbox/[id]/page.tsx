"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { ConversationDetail } from "@/types";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Send, User, Mail } from "lucide-react";

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      setConversation(res.data);
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/conversations/${conversationId}/messages`, {
        content: reply,
        channel: "email",
      });
      setReply("");
      await fetchConversation();
      toast.success("Reply sent!");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="page-container">
        <p>Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/inbox")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{conversation.contact_name}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.contact_email} {conversation.contact_phone && `· ${conversation.contact_phone}`}
          </p>
        </div>
        {conversation.automation_paused && (
          <Badge variant="outline">Automation Paused</Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
            <div className={msg.direction === "outbound" ? "message-bubble-outbound" : "message-bubble-inbound"}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs opacity-70 capitalize">{msg.sender_type}</span>
                <Mail className="w-3 h-3 opacity-50" />
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
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
    </div>
  );
}