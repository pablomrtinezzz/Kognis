"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, Pencil, Plus, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { DocumentItem } from "@/hooks/useDocuments";
import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  colorIndex: number;
}

// ─── Palette — each entry drives the folder-card colour scheme ────────────────

const PALETTE = [
  {
    bg: "rgba(37,119,255,0.10)",
    border: "rgba(37,119,255,0.22)",
    icon: "rgba(37,119,255,0.80)",
  },
  {
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.22)",
    icon: "rgba(16,185,129,0.80)",
  },
  {
    bg: "rgba(168,85,247,0.10)",
    border: "rgba(168,85,247,0.22)",
    icon: "rgba(168,85,247,0.80)",
  },
  {
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.22)",
    icon: "rgba(245,158,11,0.80)",
  },
  {
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.22)",
    icon: "rgba(239,68,68,0.80)",
  },
  {
    bg: "rgba(236,72,153,0.10)",
    border: "rgba(236,72,153,0.22)",
    icon: "rgba(236,72,153,0.80)",
  },
];

// ─── useFolders hook ──────────────────────────────────────────────────────────

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const [allFolders, allAssignments] = await Promise.all([
      db.folders.orderBy("created_at").toArray(),
      db.folder_assignments.toArray(),
    ]);
    setFolders(allFolders);
    const map: Record<string, string> = {};
    for (const a of allAssignments) map[a.doc_id] = a.folder_id;
    setAssignments(map);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createFolder = useCallback(
    async (name: string): Promise<Folder> => {
      const next: Folder = {
        id: crypto.randomUUID(),
        name: name.trim(),
        colorIndex: folders.length % PALETTE.length,
      };
      await db.folders.put({ ...next, created_at: new Date().toISOString() });
      setFolders((prev) => [...prev, next]);
      return next;
    },
    [folders.length],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await db.folders.delete(id);
      await db.folder_assignments.where("folder_id").equals(id).delete();
      await reload();
    },
    [reload],
  );

  const renameFolder = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await db.folders.update(id, { name: trimmed });
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)),
    );
  }, []);

  const assignDocument = useCallback(
    async (docId: string, folderId: string | null) => {
      if (folderId === null) {
        await db.folder_assignments.delete(docId);
        setAssignments((prev) => {
          const next = { ...prev };
          delete next[docId];
          return next;
        });
      } else {
        await db.folder_assignments.put({ doc_id: docId, folder_id: folderId });
        setAssignments((prev) => ({ ...prev, [docId]: folderId }));
      }
    },
    [],
  );

  return {
    folders,
    assignments,
    createFolder,
    deleteFolder,
    renameFolder,
    assignDocument,
    reload,
  };
}

// ─── Inline "create folder" form ─────────────────────────────────────────────

function CreateFolderInline({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const name = value.trim();
    if (name) onConfirm(name);
  };

  return (
    <GlassPanel glow className="p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: "rgba(37,119,255,0.10)",
          border: "1px solid rgba(37,119,255,0.20)",
        }}
      >
        <FolderOpen
          size={15}
          style={{ color: "rgba(37,119,255,0.7)" }}
          strokeWidth={1.75}
        />
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Folder name…"
        className="flex-1 bg-transparent text-sm font-semibold text-white/90 placeholder:text-white/25 outline-none"
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
        style={{
          backgroundColor: "rgba(37,119,255,0.15)",
          border: "1px solid rgba(37,119,255,0.25)",
          color: "rgb(37,119,255)",
        }}
      >
        Create
      </button>
      <button
        onClick={onCancel}
        className="text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={14} />
      </button>
    </GlassPanel>
  );
}

// ─── FolderGrid component ─────────────────────────────────────────────────────

interface FolderGridProps {
  folders: Folder[];
  documents: DocumentItem[];
  assignments: Record<string, string>;
  onSelectFolder: (folder: Folder) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
}

export function FolderGrid({
  folders,
  documents,
  assignments,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: FolderGridProps) {
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = (name: string) => {
    onCreateFolder(name);
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">
          Folders
        </p>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 text-xs font-bold transition-colors duration-200"
            style={{ color: "rgba(37,119,255,0.70)" }}
          >
            <Plus size={12} strokeWidth={2.5} />
            New folder
          </button>
        )}
      </div>

      {/* Inline create form */}
      {creating && (
        <CreateFolderInline
          onConfirm={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* Empty state */}
      {!creating && folders.length === 0 && (
        <GlassPanel className="flex flex-col items-center justify-center py-14 gap-4 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(37,119,255,0.07)",
              border: "1px solid rgba(37,119,255,0.12)",
            }}
          >
            <FolderOpen
              size={20}
              style={{ color: "rgba(37,119,255,0.35)" }}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className="text-white/50 font-semibold text-sm">
              No folders yet
            </p>
            <p className="text-white/25 text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">
              Organise your decks into folders for structured study.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white transition-all duration-200"
            style={{
              backgroundColor: "rgba(37,119,255,0.14)",
              border: "1px solid rgba(37,119,255,0.24)",
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Create folder
          </button>
        </GlassPanel>
      )}

      {/* Folder grid */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {folders.map((folder) => {
            const palette = PALETTE[folder.colorIndex % PALETTE.length];
            const folderDocs = documents.filter(
              (d) => assignments[d.id] === folder.id,
            );
            const due = folderDocs.reduce((s, d) => s + d.due_count, 0);

            return (
              <GlassPanel
                key={folder.id}
                hover
                glow
                className="p-4 flex flex-col gap-3 cursor-pointer group"
                onClick={() => onSelectFolder(folder)}
              >
                {/* Folder icon */}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: palette.bg,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <FolderOpen
                    size={18}
                    style={{ color: palette.icon }}
                    strokeWidth={1.75}
                  />
                </div>

                {/* Name + count */}
                <div className="flex-1 min-w-0">
                  {renamingId === folder.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRenameFolder(folder.id, renameValue);
                          setRenamingId(null);
                        }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onBlur={() => {
                        if (renameValue.trim())
                          onRenameFolder(folder.id, renameValue);
                        setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent text-sm font-bold text-white/90 outline-none border-b border-white/20 pb-0.5"
                    />
                  ) : (
                    <p className="font-bold text-white/90 text-sm truncate leading-tight">
                      {folder.name}
                    </p>
                  )}
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {folderDocs.length}{" "}
                    {folderDocs.length === 1 ? "deck" : "decks"}
                  </p>
                </div>

                {/* Due badge + actions */}
                <div className="flex items-center justify-between">
                  {due > 0 ? (
                    <span
                      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(37,119,255,0.12)",
                        border: "1px solid rgba(37,119,255,0.20)",
                        color: "rgb(37,119,255)",
                      }}
                    >
                      {due} due
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(folder.id);
                        setRenameValue(folder.name);
                      }}
                      className="text-white/20 hover:text-white/60 p-1 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
                      aria-label="Rename folder"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="text-white/20 hover:text-red-400 p-1 rounded-lg hover:bg-red-400/[0.08] transition-all duration-200"
                      aria-label="Delete folder"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
