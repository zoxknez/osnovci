/**
 * Parent-Child Communication Hub
 * In-app messaging između roditelja i deteta
 */

"use client";

import { formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";
import { Loader, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { showErrorToast } from "@/components/features/error-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "STUDENT" | "GUARDIAN";
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: Array<{
    id: string;
    url: string;
    type: "image" | "file";
    name: string;
  }>;
}

interface ChatInterfaceProps {
  studentId: string;
  guardianId: string;
  currentUserId: string;
  currentUserRole: "STUDENT" | "GUARDIAN";
}

export function ChatInterface({
  studentId,
  guardianId,
  currentUserId,
  currentUserRole,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/messaging?studentId=${studentId}&guardianId=${guardianId}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Failed to load messages");
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      showErrorToast({
        error:
          error instanceof Error
            ? error
            : new Error("Greška pri učitavanju poruka"),
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentId, guardianId]);

  useEffect(() => {
    loadMessages();
    // TODO: Set up WebSocket for real-time updates
  }, [loadMessages]);

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on message changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isSending) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          guardianId,
          content: messageText,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (error) {
      showErrorToast({
        error:
          error instanceof Error
            ? error
            : new Error("Greška pri slanju poruke"),
      });
      setInput(messageText); // Restore input on error
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, studentId, guardianId]);

  const quickMessages =
    currentUserRole === "GUARDIAN"
      ? [
          "Jesi li završio domaće?",
          "Kako ide učenje?",
          "Trebaš li pomoć?",
          "Vreme je za pauzu!",
        ]
      : [
          "Završio sam domaće!",
          "Treba mi pomoć",
          "Možeš li da pogledaš moj zadatak?",
          "Hvala!",
        ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-live="polite"
          aria-label="Istorija poruka"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <p className="text-lg font-medium mb-2">Nema poruka još</p>
              <p className="text-sm">Pošalji prvu poruku!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3", isOwn && "flex-row-reverse")}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("flex-1 space-y-1", isOwn && "items-end")}>
                    <div
                      className={cn(
                        "inline-block rounded-lg px-4 py-2 max-w-[80%]",
                        isOwn
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900",
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-2 text-xs text-gray-500",
                        isOwn && "justify-end",
                      )}
                    >
                      <span>
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                          locale: sr,
                        })}
                      </span>
                      {!isOwn && !message.read && (
                        <Badge variant="secondary" className="h-4 px-1 text-xs">
                          Novo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Messages */}
        <div className="px-4 py-2 border-t">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickMessages.map((msg) => (
              <Button
                key={msg}
                variant="outline"
                size="sm"
                onClick={() => setInput(msg)}
                className="whitespace-nowrap"
              >
                {msg}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Napiši poruku..."
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              size="icon"
              className="self-end"
              aria-label="Pošalji poruku"
            >
              {isSending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Svi razgovori se čuvaju i roditelj može da vidi sve poruke.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
