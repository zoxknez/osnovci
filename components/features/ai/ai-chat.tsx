"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Image as ImageIcon, Sparkles, Trash2, GraduationCap, BookOpen, Languages } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chatWithAiAction } from "@/app/actions/ai";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const PERSONAS = {
  general: { name: "AI Nastavnik", icon: <Bot className="w-5 h-5" />, desc: "Opšta pomoć" },
  math: { name: "Profesor Brojkić", icon: <GraduationCap className="w-5 h-5" />, desc: "Matematika i Fizika" },
  language: { name: "Poliglota", icon: <Languages className="w-5 h-5" />, desc: "Jezici i Gramatika" },
  history: { name: "Vremeplov", icon: <BookOpen className="w-5 h-5" />, desc: "Istorija i Geografija" },
};

const SUGGESTED_QUESTIONS = {
  general: ["Kako da se bolje organizujem?", "Napravi mi plan učenja", "Motiviši me!"],
  math: ["Objasni mi Pitagorinu teoremu", "Kako se rešavaju razlomci?", "Formule za površinu kruga"],
  language: ["Kako se piše sastav?", "Prevedi ovo na engleski", "Objasni padeže"],
  history: ["Kada je bio Kosovski boj?", "Glavni gradovi Evrope", "Ko je bio Nikola Tesla?"],
};

export function AiChat() {
  const [persona, setPersona] = useState<keyof typeof PERSONAS>("general");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Zdravo! Ja sam tvoj AI nastavnik. Kako mogu da ti pomognem danas?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatWithAiAction({
        query: userMessage.content,
        persona: persona
      });

      if (result.error) throw new Error(result.error);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: result.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Greška pri komunikaciji sa AI nastavnikom");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content: `Zdravo! Ja sam ${PERSONAS[persona].name}. Kako mogu da ti pomognem?`,
        timestamp: new Date(),
      },
    ]);
    toast.success("Ćaskanje je obrisano");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col shadow-xl border-purple-100">
      <CardHeader className="bg-purple-50 border-b border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-purple-700">
          <div className="p-2 bg-purple-100 rounded-lg">
            {PERSONAS[persona].icon}
          </div>
          <div>
            <CardTitle className="text-lg">{PERSONAS[persona].name}</CardTitle>
            <p className="text-xs text-purple-500">{PERSONAS[persona].desc}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={persona} onValueChange={(v: any) => {
            setPersona(v);
            setMessages([{
              id: "welcome",
              role: "ai",
              content: `Zdravo! Ja sam ${PERSONAS[v as keyof typeof PERSONAS].name}. Kako mogu da ti pomognem?`,
              timestamp: new Date(),
            }]);
          }}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Izaberi nastavnika" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERSONAS).map(([key, p]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {p.icon}
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon" onClick={handleClearChat} title="Obriši ćaskanje" className="h-8 w-8">
            <Trash2 className="w-4 h-4 text-purple-400 hover:text-purple-600" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                }`}
              >
                {msg.role === "user" ? <User className="w-5 h-5" /> : PERSONAS[persona].icon}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {SUGGESTED_QUESTIONS[persona].map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-3 py-1.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0" title="Pošalji sliku (Uskoro)">
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </Button>
            <Input
              placeholder="Pitaj me bilo šta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-purple-600 hover:bg-purple-700">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
