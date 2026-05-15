"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Brain, Map, Layers, BarChart3, Sparkles,
  ArrowRight, Zap, Shield, Upload
} from "lucide-react";

const features = [
  { icon: Upload, title: "Smart Upload", desc: "Upload PDFs, docs, notes — AI parses and embeds everything", color: "text-blue-400 bg-blue-500/15" },
  { icon: Brain, title: "AI Tutor Chat", desc: "Ask questions, get RAG-powered answers from your materials", color: "text-violet-400 bg-violet-500/15" },
  { icon: Map, title: "Adaptive Roadmap", desc: "AI generates and adapts your study plan based on performance", color: "text-emerald-400 bg-emerald-500/15" },
  { icon: Zap, title: "Quiz Generator", desc: "Auto-generated assessments with weakness analysis", color: "text-yellow-400 bg-yellow-500/15" },
  { icon: Layers, title: "Smart Flashcards", desc: "Spaced repetition flashcards generated from your content", color: "text-pink-400 bg-pink-500/15" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track streaks, scores, progress, and AI recommendations", color: "text-cyan-400 bg-cyan-500/15" },
];

const agents = [
  { name: "Planner", desc: "Creates roadmaps" },
  { name: "Tutor", desc: "Explains concepts" },
  { name: "Quiz", desc: "Generates assessments" },
  { name: "Revision", desc: "Builds flashcards" },
  { name: "Performance", desc: "Adapts learning" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Learning OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-sm">Sign In</Link>
          <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/8 rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute top-32 right-0 w-[300px] h-[300px] bg-indigo-600/6 rounded-full blur-[120px] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
            <Sparkles className="w-4 h-4" /> Powered by 5 Autonomous AI Agents
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            The Future Operating{" "}
            <br />
            <span className="gradient-text">System for Learning</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Upload your materials. AI agents autonomously create personalized roadmaps,
            generate quizzes, build flashcards, and adapt to how you learn — in real-time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary py-3 px-8 text-base">
              Start Learning <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary py-3 px-8 text-base">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-3">Everything You Need to <span className="gradient-text">Learn Smarter</span></h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            An intelligent ecosystem of AI tools that work together to accelerate your learning
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Agents */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 md:p-12"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              <span className="gradient-text">5 AI Agents</span> Working for You
            </h2>
            <p className="text-muted-foreground">Autonomous agents that collaborate to optimize your learning</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-indigo-600/5 border border-primary/20"
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <div>
                  <p className="font-semibold text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold mb-4">Ready to Transform How You Learn?</h2>
          <p className="text-muted-foreground mb-8">Join the future of personalized, AI-driven education</p>
          <Link href="/signup" className="btn-primary py-3 px-10 text-base">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>AI Personal Learning OS • Built for the AI Agents Hackathon 2025</p>
      </footer>
    </div>
  );
}
