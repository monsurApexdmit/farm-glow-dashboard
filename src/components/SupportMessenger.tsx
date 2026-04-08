import { useState } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

const quickReplies = [
  "How to add crops?",
  "Livestock management help",
  "Report an issue",
  "Billing question",
];

const botResponses: Record<string, string> = {
  "how to add crops?": "Go to the Crops page from the sidebar, then click the '+ Add Crop' button. Fill in the crop details and click Save!",
  "livestock management help": "Navigate to the Livestock page to manage your animals. You can add, edit, and track health records for each animal.",
  "report an issue": "Please describe your issue and our support team will get back to you within 24 hours. You can also email support@agrifarm.com.",
  "billing question": "For billing inquiries, please visit Settings → Billing or contact our finance team at billing@agrifarm.com.",
};

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase().trim();
  for (const [key, val] of Object.entries(botResponses)) {
    if (lower.includes(key.replace("?", "").split(" ").slice(0, 2).join(" "))) return val;
  }
  return "Thanks for your message! Our support team will review it shortly. For urgent issues, email support@agrifarm.com.";
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SupportMessenger() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! 👋 Welcome to AgriFarm Support. How can I help you today?", sender: "bot", time: timeNow() },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), text, sender: "user", time: timeNow() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: getBotReply(text), sender: "bot", time: timeNow() },
      ]);
    }, 800);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">AgriFarm Support</p>
                <p className="text-[11px] opacity-80">Online • Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-primary-foreground/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.sender === "bot" && (
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs"><Bot className="w-3.5 h-3.5" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.sender === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                    <p>{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{m.time}</p>
                  </div>
                  {m.sender === "user" && (
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs"><User className="w-3.5 h-3.5" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {quickReplies.map((q) => (
                  <button key={q} onClick={() => send(q)} className="px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Type a message..."
              className="flex-1 h-9 text-sm"
            />
            <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => send(input)}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
