"use client";

import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, FileText, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { chatAPI } from "@/services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: chatAPI.send,
    onSuccess: (data) => {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.response,
        sources: data.sources
      }]);
      setConversationId(data.conversation_id);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    chatMutation.mutate({ message: input, conversation_id: conversationId || undefined });
    setInput("");
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 border-b border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Tutor</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                RAG-powered • Answers from your materials
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-indigo-600/10 flex items-center justify-center mb-6 glow">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Ask Your AI Tutor</h2>
              <p className="text-muted-foreground max-w-md text-sm">
                I can answer questions about your uploaded materials. I use RAG to retrieve
                relevant content and provide accurate, contextual answers.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 max-w-lg justify-center">
                {[
                  "Explain the key concepts",
                  "Summarize chapter 1",
                  "What are the prerequisites?",
                  "Give me an example"
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors border border-border"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[70%] ${
                msg.role === "user"
                  ? "bg-primary/20 border border-primary/30 rounded-2xl rounded-br-md"
                  : "bg-card border border-border rounded-2xl rounded-bl-md"
              } px-4 py-3`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Sources:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s: any, j: number) => (
                        <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          {s.source} {s.page ? `p.${s.page}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}

          {chatMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your learning materials..."
              className="input-field flex-1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary px-4"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
