"use client";

import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import {
  Flame, Target, BookOpen, Brain, TrendingUp, Clock,
  FileText, Sparkles, ChevronRight, Zap, Trophy, BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/services/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function StatCard({ icon: Icon, label, value, color, delay = 0 }: {
  icon: any; label: string; value: string | number; color: string; delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ delay, duration: 0.4 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 text-success" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardAPI.get,
    retry: false,
  });

  const analytics = dashboard?.analytics || {};
  const recommendations = dashboard?.ai_recommendations || [];
  const dailyTasks = dashboard?.daily_tasks || [];
  const documents = dashboard?.documents || [];

  return (
    <AppShell>
      <div className="page-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-header"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">
                Welcome back, <span className="gradient-text">{user?.full_name || "Learner"}</span>
              </h1>
              <p className="page-subtitle">Here&apos;s your learning progress overview</p>
            </div>
            <Link
              href="/upload"
              className="btn-primary"
            >
              <Zap className="w-4 h-4" /> Upload Material
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Flame}
            label="Day Streak"
            value={analytics.current_streak || 0}
            color="bg-orange-500/15 text-orange-400"
            delay={0.1}
          />
          <StatCard
            icon={Trophy}
            label="Avg Quiz Score"
            value={`${analytics.average_quiz_score || 0}%`}
            color="bg-yellow-500/15 text-yellow-400"
            delay={0.15}
          />
          <StatCard
            icon={BookOpen}
            label="Documents"
            value={analytics.total_documents || 0}
            color="bg-blue-500/15 text-blue-400"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            label="Study Time"
            value={`${analytics.total_study_time_minutes || 0}m`}
            color="bg-emerald-500/15 text-emerald-400"
            delay={0.25}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Learning Progress
                </h2>
                <span className="text-sm text-muted-foreground">
                  {analytics.progress_percentage || 0}% complete
                </span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analytics.progress_percentage || 0}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <p className="text-xl font-bold">{analytics.total_quizzes_taken || 0}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Taken</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <p className="text-xl font-bold">{analytics.total_flashcards_reviewed || 0}</p>
                  <p className="text-xs text-muted-foreground">Cards Reviewed</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <p className="text-xl font-bold">{analytics.longest_streak || 0}</p>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>
              </div>
            </motion.div>

            {/* Daily Tasks */}
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Today&apos;s Tasks
                </h2>
                <Link href="/roadmap" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View Roadmap <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {dailyTasks.length > 0 ? (
                <div className="space-y-3">
                  {dailyTasks.map((task: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.estimated_minutes || 30}min • {task.topic || "General"}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-md ${
                        task.difficulty === "easy" ? "bg-emerald-500/15 text-emerald-400" :
                        task.difficulty === "hard" ? "bg-red-500/15 text-red-400" :
                        "bg-yellow-500/15 text-yellow-400"
                      }`}>
                        {task.difficulty || "medium"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks yet. Generate a roadmap to get started!</p>
                  <Link href="/roadmap" className="btn-primary mt-3 inline-flex text-xs">
                    Generate Roadmap
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Uploaded Documents */}
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Recent Materials
                </h2>
                <Link href="/upload" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Upload <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">{doc.chunk_count} chunks</p>
                      </div>
                      <span className="text-xs text-muted-foreground uppercase">{doc.doc_type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload your first document to start learning</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar — 1 col */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.35 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Recommendations
              </h2>
              <div className="space-y-3">
                {(recommendations.length > 0 ? recommendations : [
                  "Upload learning materials to get started",
                  "Take a quiz to assess your knowledge",
                  "Generate a personalized roadmap",
                  "Create flashcards for revision",
                  "Maintain a daily study streak"
                ]).map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/30">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] text-primary font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{rec}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weak Topics */}
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.45 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-warning" />
                Focus Areas
              </h2>
              {(analytics.weak_topics || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analytics.weak_topics.map((topic: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium border border-warning/20">
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Take quizzes to identify focus areas
                </p>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.55 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/chat", icon: Brain, label: "AI Tutor", color: "text-violet-400" },
                  { href: "/quizzes", icon: Target, label: "Quiz", color: "text-green-400" },
                  { href: "/flashcards", icon: Zap, label: "Flashcards", color: "text-yellow-400" },
                  { href: "/analytics", icon: BarChart3, label: "Analytics", color: "text-blue-400" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all hover:-translate-y-0.5"
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
