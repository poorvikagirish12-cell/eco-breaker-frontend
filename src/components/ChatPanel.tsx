"use client";

import { useState, useEffect, useRef } from "react";
import { BASE_URL } from "@/lib/api";

interface Message {
  sender: "user" | "bot";
  text: string;
  time: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "System initialized. I am the EcoBreaker Synthesis Guide. I monitor your tag affinity profiles and explain how the Contrarian negative-feedback loop offsets your confirmation bias.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfileStats = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const headers = token ? { "Authorization": `Bearer ${token}` } : undefined;
      
      const prefRes = await fetch(`${BASE_URL}/api/users/me/preferences`, { headers });
      const prefData = await prefRes.json();
      
      const histRes = await fetch(`${BASE_URL}/api/users/me/history`, { headers });
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

    setTimeout(async () => {
      let botResponse = "Command unrecognized. Request explanation on 'recommendations', 'affinity scores', 'routing algorithm', or dispatch 'reset preferences'.";
      const normalizedText = text.toLowerCase();

      const stats = await fetchProfileStats();
      const topTags = stats?.preferences?.map((p: any) => `${p.name} (${p.affinity_score}pt)`).join(", ") || "No tags registered";
      const readCount = stats?.history?.length || 0;

      if (normalizedText.includes("why") || normalizedText.includes("recommend") || normalizedText.includes("feed")) {
        botResponse = `ALGORITHM_STATUS: Negative-Feedback Active. Rather than looping your current interest points (${topTags}), EcoBreaker filters tags you interact with most and prioritizes articles with opposite/diverse tags to balance cognitive polarization.`;
      } else if (normalizedText.includes("tag") || normalizedText.includes("preference") || normalizedText.includes("affinity")) {
        botResponse = `PROFILE_METRICS: Registered ${readCount} views. Collected tag affinity coordinates: ${topTags}. Feed routing will bypass these fields.`;
      } else if (normalizedText.includes("algorithm") || normalizedText.includes("contrarian") || normalizedText.includes("bias")) {
        botResponse = "SYSTEM_LOGIC: 1. Parse top 5 active affinity scores. 2. Filter out articles with matching tags. 3. Feed synthesized logs. Prevents filter bubble solidification.";
      } else if (normalizedText.includes("reset") || normalizedText.includes("clear") || normalizedText.includes("delete")) {
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
          const headers = token ? { "Authorization": `Bearer ${token}` } : undefined;
          
          await fetch(`${BASE_URL}/api/users/me/preferences`, { method: "DELETE", headers });
          await fetch(`${BASE_URL}/api/users/me/history`, { method: "DELETE", headers });
          botResponse = "DESTRUCTION_COMPLETE: Cleared all user preference metrics. Recalibrating baseline feed channels.";
          window.dispatchEvent(new Event("role-change"));
        } catch (err) {
          botResponse = "ERROR: Failed to reset database preference schema.";
        }
      } else if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey")) {
        botResponse = "Handshake acknowledged. Query parameters accepted. Select query options below or input console parameters.";
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
    }, 700);
  };

  return (
    <div className="h-[480px] sm:h-[500px] flex flex-col bg-[#0b120f] border border-[rgba(3,227,140,0.15)] rounded-sm overflow-hidden terminal-font text-xs">
      {/* Header */}
      <div className="bg-[#09100d] border-b border-[rgba(3,227,140,0.15)] py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-sm bg-gradient-to-br from-[#03e38c]/20 to-[#00e5ff]/20 border border-[#03e38c]/40 flex items-center justify-center text-[#03e38c] font-bold text-[10px]">
            EB
          </div>
          <div>
            <h4 className="font-bold text-[#03e38c] tracking-wider">SYNTHESIS_ASSISTANT_V4.0</h4>
            <span className="text-[9px] text-[#03e38c] flex items-center gap-1 opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#03e38c] animate-pulse" />
              PORT_ACTIVE: UPLINK_ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Message Screen */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#070d0b]/40">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`p-2.5 rounded-sm text-xs leading-relaxed border select-text ${
                msg.sender === "user"
                  ? "bg-[rgba(0,229,255,0.04)] border-[#00e5ff]/40 text-[#00e5ff] selection:bg-[#00e5ff]/20"
                  : "bg-[#09100d] border-[rgba(3,227,140,0.15)] text-[#c9d1c9] selection:bg-[#03e38c]/20"
              }`}
            >
              <span className="text-[#4d5e56] mr-1">[{msg.sender === "user" ? "USER" : "SYS"}]</span>
              {msg.text}
            </div>
            <span className="text-[8px] text-[#4d5e56] mt-1 px-1">{msg.time}</span>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto items-start max-w-[85%] flex flex-col">
            <div className="p-2.5 bg-[#09100d] border border-[rgba(3,227,140,0.15)] rounded-sm text-[#03e38c] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#03e38c] animate-bounce" />
              <span className="w-1 h-1 rounded-full bg-[#03e38c] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 rounded-full bg-[#03e38c] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Command Logs */}
      <div className="px-3 py-2 border-t border-[rgba(3,227,140,0.1)] bg-[#070d0b] flex flex-wrap gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleSend("Why am I routed these?")}
          className="text-[9px] bg-transparent border border-[#03e38c]/30 text-[#03e38c] hover:border-[#03e38c] px-2 py-0.5 rounded-sm transition uppercase"
        >
          ? explain_routing
        </button>
        <button
          onClick={() => handleSend("Get my tag preferences")}
          className="text-[9px] bg-transparent border border-[#00e5ff]/30 text-[#00e5ff] hover:border-[#00e5ff] px-2 py-0.5 rounded-sm transition uppercase"
        >
          ? query_affinity
        </button>
        <button
          onClick={() => handleSend("Reset preferences")}
          className="text-[9px] bg-transparent border border-[#ff007f]/30 text-[#ff007f] hover:border-[#ff007f] px-2 py-0.5 rounded-sm transition uppercase"
        >
          ! clear_preferences
        </button>
      </div>

      {/* Command Input Bar */}
      <div className="p-3 border-t border-[rgba(3,227,140,0.15)] flex gap-2 bg-[#09100d]">
        <input
          placeholder="Enter command console query..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="bg-[#070d0b] border border-[rgba(3,227,140,0.15)] text-xs h-8 pl-2 pr-2 flex-grow text-[#c9d1c9] placeholder:text-[#4d5e56] focus:border-[#03e38c] focus:outline-none rounded-sm"
        />
        <button 
          onClick={() => handleSend()} 
          className="px-3 bg-transparent border border-[#03e38c] text-[#03e38c] hover:bg-[#03e38c]/10 text-xs font-bold transition-all rounded-sm"
        >
          RUN
        </button>
      </div>
    </div>
  );
}
