"use client";

import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import { Map, CheckCircle2, Circle, Clock, Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roadmapAPI } from "@/services/api";

export default function RoadmapPage() {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState({ duration_weeks: 4, daily_hours: 1, skill_level: "beginner" });
  const queryClient = useQueryClient();

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ["roadmap"],
    queryFn: roadmapAPI.get,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: roadmapAPI.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      setGenerating(false);
    },
    onError: () => setGenerating(false),
  });

  const tasks = roadmap?.tasks || [];
  const parsedTasks = typeof tasks === "string" ? JSON.parse(tasks) : tasks;
  const weeks: number[] = [...new Set(parsedTasks.map((t: any) => t.week) as number[])].sort((a, b) => a - b);

  const getTasksByWeek = (week: number) => parsedTasks.filter((t: any) => t.week === week);

  return (
    <AppShell>
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Learning <span className="gradient-text">Roadmap</span></h1>
              <p className="page-subtitle">
                {roadmap ? `${roadmap.title} • Adapted ${roadmap.adapted_count || 0} times` : "Generate your personalized study plan"}
              </p>
            </div>
            {roadmap && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                AI-Adaptive Roadmap
              </div>
            )}
          </div>
        </motion.div>

        {!roadmap ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 max-w-xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Map className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Generate Your Roadmap</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Configure your preferences and let AI create a personalized study plan
            </p>

            <div className="space-y-4 text-left mb-6">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Duration (weeks)</label>
                <select
                  value={config.duration_weeks}
                  onChange={(e) => setConfig({ ...config, duration_weeks: +e.target.value })}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 6, 8].map((w) => (
                    <option key={w} value={w}>{w} weeks</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Daily study time (hours)</label>
                <select
                  value={config.daily_hours}
                  onChange={(e) => setConfig({ ...config, daily_hours: +e.target.value })}
                  className="input-field"
                >
                  {[0.5, 1, 1.5, 2, 3, 4].map((h) => (
                    <option key={h} value={h}>{h} hours</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Skill level</label>
                <select
                  value={config.skill_level}
                  onChange={(e) => setConfig({ ...config, skill_level: e.target.value })}
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => { setGenerating(true); generateMutation.mutate(config); }}
              disabled={generateMutation.isPending}
              className="btn-primary w-full py-3"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Roadmap...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate with AI</>
              )}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Description */}
            {roadmap.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-5 mb-6"
              >
                <p className="text-sm text-muted-foreground">{roadmap.description}</p>
              </motion.div>
            )}

            {/* Weeks */}
            {weeks.map((week: number, wi: number) => {
              const weekTasks = getTasksByWeek(week);
              const completed = weekTasks.filter((t: any) => t.status === "completed").length;
              const isExpanded = expandedWeek === week;

              return (
                <motion.div
                  key={week}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: wi * 0.1 }}
                  className="glass-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedWeek(isExpanded ? null : week)}
                    className="w-full flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold">
                        W{week}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">Week {week}</p>
                        <p className="text-xs text-muted-foreground">
                          {completed}/{weekTasks.length} tasks completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all"
                          style={{ width: `${weekTasks.length ? (completed / weekTasks.length) * 100 : 0}%` }}
                        />
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-2">
                        {weekTasks.map((task: any, ti: number) => (
                          <div
                            key={ti}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                              task.status === "completed" ? "bg-success/5" : "bg-secondary/20 hover:bg-secondary/40"
                            }`}
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" /> {task.estimated_minutes || 30}min
                                </span>
                                <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                                  task.difficulty === "easy" ? "bg-emerald-500/15 text-emerald-400" :
                                  task.difficulty === "hard" ? "bg-red-500/15 text-red-400" :
                                  "bg-yellow-500/15 text-yellow-400"
                                }`}>{task.difficulty}</span>
                                {task.topic && (
                                  <span className="text-[11px] text-primary">{task.topic}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground">Day {task.day}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
