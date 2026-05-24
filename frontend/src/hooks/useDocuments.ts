"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { apiGet, apiPost, apiUpload } from "@/lib/apiClient";

export interface DocumentItem {
  id: string;
  file_name: string;
  created_at: string;
  flashcard_count: number;
  due_count: number;
}

export type UploadStage =
  | "idle"
  | "uploading"
  | "processing"
  | "done"
  | "error";

export interface UploadState {
  stage: UploadStage;
  message: string;
  cardCount?: number;
}

export function useDocuments() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({
    stage: "idle",
    message: "",
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<DocumentItem[]>("/api/v1/documents/", token);
      setDocuments(data);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (session) fetchDocuments();
  }, [session, fetchDocuments]);

  const uploadAndProcess = useCallback(
    async (file: File) => {
      const active = uploadState.stage;
      if (active === "uploading" || active === "processing") return;

      setUploadState({ stage: "uploading", message: "Uploading PDF…" });

      let uploaded: { id: string };
      try {
        const form = new FormData();
        form.append("file", file);
        uploaded = await apiUpload<{ id: string }>(
          "/api/v1/documents/upload",
          form,
          token,
        );
      } catch {
        setUploadState({
          stage: "error",
          message: "Upload failed. Try again.",
        });
        return;
      }

      setUploadState({
        stage: "processing",
        message: "Generating flashcards with AI…",
      });

      try {
        const result = await apiPost<{ flashcards_generated: number }>(
          `/api/v1/documents/${uploaded.id}/process`,
          {},
          token,
        );
        setUploadState({
          stage: "done",
          message: `${result.flashcards_generated} flashcards created`,
          cardCount: result.flashcards_generated,
        });
        await fetchDocuments();
      } catch {
        setUploadState({
          stage: "error",
          message: "AI processing failed. Try again.",
        });
      }
    },
    [token, uploadState.stage, fetchDocuments],
  );

  const resetUpload = useCallback(() => {
    setUploadState({ stage: "idle", message: "" });
  }, []);

  const totalDue = documents.reduce((s, d) => s + d.due_count, 0);
  const totalCards = documents.reduce((s, d) => s + d.flashcard_count, 0);

  return {
    documents,
    loading,
    uploadState,
    uploadAndProcess,
    resetUpload,
    totalDue,
    totalCards,
    refresh: fetchDocuments,
  };
}
