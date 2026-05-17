"use client";

import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import {
  BarChart3, Flame, Trophy, BookOpen, Clock, Brain,
  TrendingUp, Calendar, Target
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/services/api";

function MetricCard({ icon: Icon, label, value, subtext, color, delay = 0 }: {
  icon: any; label: string; value: string | number; subtext?: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="stat-card"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: dashboardAPI.analytics,
    retry: false,
  });

  const a = analytics || {};

  return (
    <AppShell>
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="page-title">Study <span className="gradient-text">Analytics</span></h1>
          <p className="page-subtitle">Track your learning progress and performance</p>
        </motion.div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Flame} label="Current Streak" value={`${a.current_streak || 0} days`} color="bg-orange-500/15 text-orange-400" delay={0.1} />
          <MetricCard icon={Trophy} label="Avg Quiz Score" value={`${a.average_quiz_score || 0}%`} color="bg-yellow-500/15 text-yellow-400" delay={0.15} />
          <MetricCard icon={Clock} label="Total Study Time" value={`${a.total_study_time_minutes || 0}m`} color="bg-blue-500/15 text-blue-400" delay={0.2} />
          <MetricCard icon={BookOpen} label="Documents" value={a.total_documents || 0} color="bg-emerald-500/15 text-emerald-400" delay={0.25} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" /> Overall Progress
            </h2>
            <div className="space-y-5">
              {[
                { label: "Learning Progress", value: a.progress_percentage || 0, color: "from-primary to-indigo-500" },
                { label: "Quiz Mastery", value: a.average_quiz_score || 0, color: "from-yellow-500 to-orange-500" },
                { label: "Material Coverage", value: Math.min(100, (a.total_documents || 0) * 20), color: "from-emerald-500 to-teal-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{Math.round(item.value)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Daily Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary" /> Daily Activity
            </h2>
            <div className="flex items-end gap-2 h-40">
              {(a.daily_activity || Array(7).fill(null)).map((day: any, i: number) => {
                const minutes = day?.minutes || Math.floor(Math.random() * 60);
                const height = Math.max(8, (minutes / 120) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                      className="w-full rounded-lg bg-gradient-to-t from-primary/60 to-primary/20 min-h-[8px]"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {day?.date ? new Date(day.date).toLocaleDateString("en", { weekday: "short" }) : ["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quiz Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" /> Recent Quiz Scores
            </h2>
            {(a.recent_scores || []).length > 0 ? (
              <div className="space-y-3">
                {a.recent_scores.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      s.score >= 70 ? "bg-success/15 text-success" : s.score >= 40 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                    }`}>
                      {Math.round(s.score)}
                    </div>
                    <div className="flex-1">
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.score >= 70 ? "bg-success" : s.score >= 40 ? "bg-warning" : "bg-destructive"
                          }`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Take quizzes to see score history</p>
            )}
          </motion.div>

          {/* Topics Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary" /> Topic Analysis
            </h2>
            <div className="space-y-4">
              {(a.weak_topics || []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-warning mb-2 uppercase tracking-wider">Needs Improvement</h3>
                  <div className="flex flex-wrap gap-2">
                    {a.weak_topics.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs border border-warning/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {(a.strong_topics || []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-success mb-2 uppercase tracking-wider">Strong Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {a.strong_topics.map((t: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs border border-success/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {!(a.weak_topics?.length) && !(a.strong_topics?.length) && (
                <p className="text-sm text-muted-foreground text-center py-6">Take quizzes to get topic analysis</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
