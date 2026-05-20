"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Message {
  sender: "user" | "bot";
  text: string;
  time: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! I am the EchoBreaker Contrarian Assistant. I analyze your reading habits and explain how the recommendation engine routes you away from filter bubbles. Ask me anything about your preferences or how our algorithms work!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfileStats = async () => {
    try {
      const prefRes = await fetch("/api/users/me/preferences");
      const prefData = await prefRes.json();
      
      const histRes = await fetch("/api/users/me/history");
      const histData = await histRes.json();

      return { preferences: prefData, history: histData };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    if (!textToSend) setInputValue("");
    
    const userMsg: Message = {
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(async () => {
      let botResponse = "I'm sorry, I'm not sure how to answer that yet. Try asking 'Why did I get these recommendations?', 'What are my top tags?', or 'How does the contrarian filter work?'.";
      const normalizedText = text.toLowerCase();

      const stats = await fetchProfileStats();
      const topTags = stats?.preferences?.map((p: any) => `${p.name} (${p.affinity_score})`).join(", ") || "None recorded yet";
      const readCount = stats?.history?.length || 0;

      if (normalizedText.includes("why") || normalizedText.includes("recommend") || normalizedText.includes("feed")) {
        botResponse = `EchoBreaker uses a Negative Bias routing algorithm. Unlike standard platforms that feed you more of what you already click, we look at your top tags and deliberately suggest articles containing OPPOSITE or diverse tags. Your current top preferences are: ${topTags}. This is why we route you to contrarian views!`;
      } else if (normalizedText.includes("tag") || normalizedText.includes("preference") || normalizedText.includes("affinity")) {
        botResponse = `Based on your reading history (${readCount} articles read), your interest affinity scores are: ${topTags}. The recommendation engine will filter OUT these topics to broaden your worldview.`;
      } else if (normalizedText.includes("algorithm") || normalizedText.includes("contrarian") || normalizedText.includes("bias")) {
        botResponse = "The Contrarian routing algorithm operates in three steps: 1) Find your top 5 tags with the highest affinity scores. 2) Filter articles that DO NOT contain these tags. 3) Deliver the most recent unread articles matching this filter. This effectively bursts echo chambers!";
      } else if (normalizedText.includes("reset") || normalizedText.includes("clear") || normalizedText.includes("delete")) {
        try {
          await fetch("/api/users/me/preferences", { method: "DELETE" });
          await fetch("/api/users/me/history", { method: "DELETE" });
          botResponse = "I have successfully cleared your reading history and reset your tag affinity scores to zero. Your feed will now return to the global default baseline until you read more articles.";
          // Dispatch role change to trigger feed updates
          window.dispatchEvent(new Event("role-change"));
        } catch (err) {
          botResponse = "I ran into an issue while trying to reset your preferences. Please try again.";
        }
      } else if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey")) {
        botResponse = "Hello! Ask me about your reading history, current tag preferences, or how we combat confirmation bias.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <Card className="h-[480px] sm:h-[550px] flex flex-col bg-card border-border/60 shadow-xl rounded-xl overflow-hidden relative">
      <CardHeader className="bg-gradient-to-r from-sky-900/40 to-indigo-900/40 border-b border-border/40 py-3.5 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
            EB
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">Contrarian Guide</CardTitle>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online Assistant
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[80%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                  : "bg-muted text-muted-foreground rounded-tl-none border border-border/40"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-muted-foreground/60 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto items-start max-w-[80%] flex flex-col">
            <div className="p-3 bg-muted text-muted-foreground rounded-2xl rounded-tl-none border border-border/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Suggestion tags */}
      <div className="px-4 py-2 border-t border-border/30 bg-muted/20 flex flex-wrap gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleSend("Why are these recommended?")}
          className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-full hover:bg-indigo-500/20 transition"
        >
          💡 Why recommended?
        </button>
        <button
          onClick={() => handleSend("What are my top tags?")}
          className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-1 rounded-full hover:bg-sky-500/20 transition"
        >
          🏷️ My top tags
        </button>
        <button
          onClick={() => handleSend("Reset my preferences")}
          className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-full hover:bg-rose-500/20 transition"
        >
          🔄 Reset Preferences
        </button>
      </div>

      <CardFooter className="p-3 border-t border-border/40 flex gap-2">
        <Input
          placeholder="Ask about recommendations or algorithms..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="bg-muted/40 border-border/50 text-sm h-9 flex-grow"
        />
        <Button onClick={() => handleSend()} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white h-9">
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}
