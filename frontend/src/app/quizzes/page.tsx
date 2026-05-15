"use client";

import AppShell from "@/components/app-shell";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, XCircle, Loader2, Sparkles, Trophy, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { quizAPI } from "@/services/api";

export default function QuizzesPage() {
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [config, setConfig] = useState({ num_questions: 10, difficulty: "medium" });

  const generateMutation = useMutation({
    mutationFn: quizAPI.generate,
    onSuccess: (data) => {
      setQuiz(data);
      setAnswers({});
      setResult(null);
      setCurrentQ(0);
    },
  });

  const submitMutation = useMutation({
    mutationFn: quizAPI.submit,
    onSuccess: (data) => setResult(data),
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    submitMutation.mutate({ quiz_id: quiz.id, answers });
  };

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQ];

  return (
    <AppShell>
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="page-title">AI <span className="gradient-text">Quizzes</span></h1>
          <p className="page-subtitle">Test your knowledge with AI-generated assessments</p>
        </motion.div>

        {/* Generate Quiz */}
        {!quiz && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Generate a Quiz</h2>
            <p className="text-muted-foreground text-sm mb-6">AI will create questions from your uploaded materials</p>

            <div className="grid grid-cols-2 gap-4 text-left mb-6">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Questions</label>
                <select value={config.num_questions} onChange={(e) => setConfig({ ...config, num_questions: +e.target.value })} className="input-field">
                  {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
                <select value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value })} className="input-field">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => generateMutation.mutate(config)}
              disabled={generateMutation.isPending}
              className="btn-primary w-full py-3"
            >
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Quiz</>}
            </button>
          </motion.div>
        )}

        {/* Quiz Taking */}
        {quiz && !result && currentQuestion && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
              <span className="text-xs px-2 py-1 rounded-md bg-secondary">{currentQuestion.difficulty}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full mb-6 overflow-hidden">
              <motion.div
                animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
              />
            </div>

            <div className="glass-card p-6 mb-4">
              {currentQuestion.topic && (
                <span className="text-xs text-primary mb-2 block">{currentQuestion.topic}</span>
              )}
              <h3 className="text-lg font-semibold mb-6">{currentQuestion.question}</h3>

              {/* MCQ Options */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((opt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQuestion.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        answers[currentQuestion.id] === opt
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-secondary/30"
                      }`}
                    >
                      <span className="text-sm">{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="input-field"
                />
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="btn-secondary"
              >
                Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitMutation.isPending} className="btn-primary">
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Quiz"}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
            <div className="glass-card p-8 text-center mb-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ${
                result.score >= 70 ? "bg-success/15" : result.score >= 40 ? "bg-warning/15" : "bg-destructive/15"
              }`}>
                {result.score >= 70 ? <Trophy className="w-10 h-10 text-success" /> : <AlertTriangle className="w-10 h-10 text-warning" />}
              </div>
              <h2 className="text-3xl font-bold mb-1">{result.score}%</h2>
              <p className="text-muted-foreground text-sm">
                {result.correct_answers}/{result.total_questions} correct
              </p>
              {result.score < 60 && (
                <p className="text-xs text-warning mt-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI is adapting your roadmap based on performance
                </p>
              )}
            </div>

            {result.weak_topics?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="font-semibold text-sm mb-3">Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {result.weak_topics.map((t: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs border border-warning/20">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {result.wrong_answers?.length > 0 && (
              <div className="glass-card p-5 mb-4">
                <h3 className="font-semibold text-sm mb-3">Review Incorrect Answers</h3>
                <div className="space-y-3">
                  {result.wrong_answers.slice(0, 5).map((w: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                      <p className="text-sm font-medium mb-1">{w.question}</p>
                      <div className="flex gap-4 text-xs mt-2">
                        <span className="text-destructive flex items-center gap-1"><XCircle className="w-3 h-3" /> Your: {w.user_answer || "—"}</span>
                        <span className="text-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Correct: {w.correct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setQuiz(null); setResult(null); }} className="btn-primary w-full py-3">
              Take Another Quiz
            </button>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
