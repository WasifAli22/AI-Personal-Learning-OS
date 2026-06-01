"use client";

import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import {
  Send, Bot, User, Loader2, FileText, Sparkles, ChevronDown, ChevronUp, X
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { chatAPI, documentsAPI } from "@/services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user's documents
  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsAPI.list,
    retry: false,
  });

  const chatMutation = useMutation({
    mutationFn: chatAPI.send,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, sources: data.sources },
      ]);
      setConversationId(data.conversation_id);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Build history for backend (exclude the current message we just added)
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    chatMutation.mutate({
      message: input,
      conversation_id: conversationId || undefined,
      document_ids: selectedDocs.length > 0 ? selectedDocs : undefined,
      chat_history: history,
    });
    setInput("");
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const SUGGESTED_PROMPTS = [
    "Summarize the key concepts",
    "Explain the main topics",
    "What are the most important points?",
    "Give me a brief overview",
  ];

  return (
    <AppShell>
      <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 border-b border-border flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">AI Tutor</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Answers strictly from your uploaded materials
                </p>
              </div>
            </div>

            {/* Document Filter Button */}
            {documents.length > 0 && (
              <button
                onClick={() => setShowDocSelector(!showDocSelector)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedDocs.length > 0
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                {selectedDocs.length > 0
                  ? `${selectedDocs.length} doc${selectedDocs.length > 1 ? "s" : ""} selected`
                  : "Filter by document"}
                {showDocSelector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Document Selector Dropdown */}
          {showDocSelector && documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border"
            >
              <p className="text-xs text-muted-foreground mb-2">
                Select specific documents to answer from (leave blank to use all):
              </p>
              <div className="flex flex-wrap gap-2">
                {documents.map((doc: any) => {
                  const selected = selectedDocs.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span className="max-w-[140px] truncate">{doc.filename}</span>
                      {selected && <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); toggleDoc(doc.id); }} />}
                    </button>
                  );
                })}
              </div>
              {selectedDocs.length > 0 && (
                <button
                  onClick={() => setSelectedDocs([])}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear selection (use all documents)
                </button>
              )}
            </motion.div>
          )}
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
              <p className="text-muted-foreground max-w-md text-sm mb-2">
                I answer questions{" "}
                <strong>strictly from your uploaded documents</strong> using
                RAG (Retrieval-Augmented Generation).
              </p>
              {documents.length === 0 ? (
                <p className="text-sm text-warning mt-2">
                  ⚠ No documents uploaded yet. Go to the{" "}
                  <a href="/upload" className="text-primary underline">Upload page</a> first.
                </p>
              ) : (
                <p className="text-xs text-success mt-1">
                  ✓ {documents.length} document{documents.length > 1 ? "s" : ""} available
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-6 max-w-lg justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
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
              <div
                className={`max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-primary/20 border border-primary/30 rounded-2xl rounded-br-md"
                    : "bg-card border border-border rounded-2xl rounded-bl-md"
                } px-4 py-3`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Sources:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s: any, j: number) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground"
                        >
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching your documents...
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                documents.length === 0
                  ? "Upload documents first to start chatting..."
                  : "Ask about your uploaded documents..."
              }
              className="input-field flex-1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary px-4 flex items-center gap-2"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            AI answers are based exclusively on your uploaded documents
          </p>
        </div>
      </div>
    </AppShell>
  );
}
