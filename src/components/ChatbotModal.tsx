import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, ArrowUpRight, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizenName?: string;
}

export default function ChatbotModal({ isOpen, onClose, citizenName = "Citizen" }: ChatbotModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: `Hello ${citizenName}! I am your JanConnect AI Smart assistant. I can answer questions about local municipal schemes, citizen rights, emergency numbers, or tell you how to file and track grievances. What can I do for you today?`,
      createdAt: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const suggestions = [
    "How do I report a broken street light?",
    "What are my rights as a tenant regarding drainage?",
    "Tell me about garbage separation guidelines.",
    "Emergency numbers for flooding."
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages
        })
      });

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: data.text || "I apologize, but I am having trouble connecting to the city database. Please try again shortly.",
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (e) {
      console.error("Chatbot submission failed", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "bot",
          text: "I seem to be offline or experiencing connection issues with the server. Please check your network.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50 w-full md:w-[400px] h-[100dvh] md:h-[600px] bg-white border border-[#E0E0E0] rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#F8F9FA] p-4 border-b border-[#E0E0E0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#E8F0FE] p-2 rounded-lg border border-[#1A73E8]/10">
            <Sparkles className="w-5 h-5 text-[#1A73E8]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#202124] flex items-center gap-1.5">
              JanConnect Assistant
              <span className="w-1.5 h-1.5 bg-[#137333] rounded-full animate-ping"></span>
            </h3>
            <p className="text-[10px] text-[#5F6368]">Powered by Gemini AI 3.5 Flash</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA]/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#1A73E8] text-white font-medium rounded-tr-none"
                  : "bg-white text-[#202124] border border-[#E0E0E0] rounded-tl-none shadow-sm"
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              <span
                className={`block text-[8px] text-right mt-1 ${
                  msg.sender === "user" ? "text-white/70" : "text-[#5F6368]"
                }`}
              >
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-[#202124] border border-[#E0E0E0] rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 shadow-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#1A73E8] rounded-full animate-bounce delay-0"></span>
                <span className="w-1.5 h-1.5 bg-[#1A73E8] rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-[#1A73E8] rounded-full animate-bounce delay-300"></span>
              </span>
              <span className="text-[#5F6368] font-medium">Assistant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="p-3 bg-white border-t border-[#E0E0E0] space-y-1.5">
          <p className="text-[10px] text-[#5F6368] font-medium px-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#1A73E8]" /> Suggested topics:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="text-[10px] text-[#5F6368] bg-[#F8F9FA] hover:bg-[#F1F3F4] hover:text-[#202124] px-2 py-1 rounded-lg border border-[#E0E0E0] transition flex items-center gap-1 cursor-pointer"
              >
                {sug}
                <ArrowUpRight className="w-2.5 h-2.5 text-[#5F6368]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-white border-t border-[#E0E0E0] flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about schemes, grievance, or status..."
          className="flex-1 bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl px-3.5 py-2 text-xs text-[#202124] placeholder-[#5F6368] focus:outline-none focus:border-[#1A73E8] transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
