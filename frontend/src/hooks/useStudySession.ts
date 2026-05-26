"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";

export interface DueCard {
  id: string;
  document_id: string;
  front: string;
  back: string;
  box: number;
  next_review_at: string;
}

export interface SessionStats {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
}

export function useStudySession(documentId?: string) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [queue, setQueue] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    total: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDue = useCallback(async () => {
    setLoading(true);
    try {
      const path = documentId
        ? `/api/v1/flashcards/due?document_id=${documentId}`
        : "/api/v1/flashcards/due";
      const cards = await apiGet<DueCard[]>(path, token);
      setQueue(cards);
      setStats({ correct: 0, incorrect: 0, skipped: 0, total: cards.length });
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [token, documentId]);

  useEffect(() => {
    if (session) fetchDue();
  }, [session, fetchDue]);

  const submitReview = useCallback(
    async (correct: boolean) => {
      const card = queue[currentIndex];
      if (!card || submitting) return;

      setSubmitting(true);
      try {
        await apiPost(
          `/api/v1/flashcards/${card.id}/review`,
          { correct },
          token,
        );
        setStats((prev) => ({
          ...prev,
          correct: correct ? prev.correct + 1 : prev.correct,
          incorrect: correct ? prev.incorrect : prev.incorrect + 1,
        }));
        setCurrentIndex((i) => i + 1);
      } finally {
        setSubmitting(false);
      }
    },
    [queue, currentIndex, token, submitting],
  );

  const skipCard = useCallback(() => {
    setStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    setCurrentIndex((i) => i + 1);
  }, []);

  const deleteCard = useCallback(
    async (cardId: string) => {
      await apiDelete(`/api/v1/flashcards/${cardId}`, token);
      setQueue((prev) => prev.filter((c) => c.id !== cardId));
      setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    },
    [token],
  );

  const editCard = useCallback(
    async (cardId: string, front: string, back: string) => {
      const updated = await apiPatch<DueCard>(
        `/api/v1/flashcards/${cardId}`,
        { front, back },
        token,
      );
      setQueue((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c)),
      );
    },
    [token],
  );

  return {
    currentCard: queue[currentIndex] ?? null,
    stats,
    loading,
    submitting,
    isDone: !loading && currentIndex >= queue.length,
    submitReview,
    skipCard,
    deleteCard,
    editCard,
  };
}
