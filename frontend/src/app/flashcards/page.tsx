"use client";

import AppShell from "@/components/app-shell";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, RotateCcw, ChevronLeft, ChevronRight, Loader2, Sparkles, Check, X } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flashcardsAPI } from "@/services/api";

export default function FlashcardsPage() {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: decks = [] } = useQuery({
    queryKey: ["flashcards"],
    queryFn: flashcardsAPI.list,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: flashcardsAPI.generate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      setSelectedDeck(data);
      setCurrentCard(0);
      setFlipped(false);
    },
  });

  const cards = selectedDeck?.cards || [];
  const parsedCards = typeof cards === "string" ? JSON.parse(cards) : cards;
  const card = parsedCards[currentCard];

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => setCurrentCard((c) => Math.min(c + 1, parsedCards.length - 1)), 200);
  };

  const prevCard = () => {
    setFlipped(false);
    setTimeout(() => setCurrentCard((c) => Math.max(c - 1, 0)), 200);
  };

  return (
    <AppShell>
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title"><span className="gradient-text">Flashcards</span></h1>
              <p className="page-subtitle">Spaced repetition powered by AI</p>
            </div>
            <button
              onClick={() => generateMutation.mutate({ num_cards: 20 })}
              disabled={generateMutation.isPending}
              className="btn-primary"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Cards
            </button>
          </div>
        </motion.div>

        {selectedDeck && card ? (
          <div className="max-w-xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <span>Card {currentCard + 1} of {parsedCards.length}</span>
              {card.topic && <span className="text-primary">{card.topic}</span>}
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all"
                style={{ width: `${((currentCard + 1) / parsedCards.length) * 100}%` }}
              />
            </div>

            {/* Flashcard */}
            <div
              onClick={() => setFlipped(!flipped)}
              className="cursor-pointer perspective-1000 mb-8"
              style={{ perspective: "1000px" }}
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full min-h-[300px]"
              >
                {/* Front */}
                <div
                  className="absolute inset-0 glass-card p-8 flex flex-col items-center justify-center text-center glow"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-xs text-muted-foreground mb-4">QUESTION</span>
                  <p className="text-xl font-semibold leading-relaxed">{card.front}</p>
                  <span className="text-xs text-muted-foreground mt-6">Click to reveal answer</span>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 glass-card p-8 flex flex-col items-center justify-center text-center border-primary/30"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-xs text-primary mb-4">ANSWER</span>
                  <p className="text-lg leading-relaxed">{card.back}</p>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button onClick={prevCard} disabled={currentCard === 0} className="btn-secondary">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex gap-2">
                <button className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors" title="Hard">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={() => setFlipped(!flipped)} className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors" title="Flip">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-xl bg-success/10 hover:bg-success/20 text-success transition-colors" title="Easy">
                  <Check className="w-5 h-5" />
                </button>
              </div>
              <button onClick={nextCard} disabled={currentCard === parsedCards.length - 1} className="btn-secondary">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Deck List */
          <div>
            {decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck: any, i: number) => {
                  const deckCards = typeof deck.cards === "string" ? JSON.parse(deck.cards) : (deck.cards || []);
                  return (
                    <motion.div
                      key={deck.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setSelectedDeck(deck); setCurrentCard(0); setFlipped(false); }}
                      className="glass-card p-6 cursor-pointer hover:border-primary/30 transition-all hover:-translate-y-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{deck.title || "Flashcard Deck"}</h3>
                      <p className="text-xs text-muted-foreground">{deckCards.length} cards</p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-1">No flashcard decks yet</p>
                <p className="text-sm mb-4">Generate flashcards from your uploaded materials</p>
                <button
                  onClick={() => generateMutation.mutate({ num_cards: 20 })}
                  disabled={generateMutation.isPending}
                  className="btn-primary"
                >
                  {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Flashcards
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
