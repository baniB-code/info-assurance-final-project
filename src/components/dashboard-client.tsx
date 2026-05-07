"use client";

import { useState } from "react";
import { ActivityLogModal } from "@/components/activity-log-modal";

type Note = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_archived?: boolean;
  is_deleted: boolean;
  created_at: string;
};

type Activity = {
  id: string;
  event_type: string;
  details: string;
  created_at: string;
};

export function DashboardClient({
  webgoatUrl,
  initialNotes,
  initialActivity,
}: {
  webgoatUrl: string;
  initialNotes: Note[];
  initialActivity: Activity[];
}) {
  const actionBtnBase =
    "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40";
  const actionBtnDanger =
    "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60";
  const actionBtnSuccess =
    "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60";
  type ViewMode = "all" | "starred" | "archived" | "trash";
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activity, setActivity] = useState<Activity[]>(initialActivity);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTitle, setEditingTitle] = useState(initialNotes[0]?.title ?? "");
  const [editingContent, setEditingContent] = useState(initialNotes[0]?.content ?? "");
  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const createQuickNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled Note",
        content: " ",
        isPinned: false,
      }),
    });
    if (res.ok) {
      const body = await res.json();
      const created = body.note as Note | undefined;
      setSelectedNoteId(created?.id ?? null);
      setEditingTitle(created?.title ?? "");
      setEditingContent("");
      void fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "NOTE_CREATED", details: "Created a new note" }),
      });
      void load();
    }
  };

  const load = async (deleted = viewMode === "trash") => {
    const [notesRes, actRes] = await Promise.all([
      fetch(`/api/notes?deleted=${deleted}`),
      fetch("/api/activity"),
    ]);
    const notesBody = await notesRes.json();
    const actBody = await actRes.json();
    setNotes(notesBody.notes ?? []);
    setActivity(actBody.activity ?? []);
    if (!selectedNoteId && notesBody.notes?.length) {
      setSelectedNoteId(notesBody.notes[0].id);
      setEditingTitle(notesBody.notes[0].title);
      setEditingContent(notesBody.notes[0].content);
    }
  };

  const softDelete = async (id: string, permanent = false) => {
    await fetch(`/api/notes/${id}?permanent=${permanent}`, { method: "DELETE" });
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: permanent ? "NOTE_DELETED_PERMANENTLY" : "NOTE_TRASHED",
        details: permanent ? "Deleted note permanently" : "Moved note to trash",
      }),
    });
    if (selectedNoteId === id) setSelectedNoteId(null);
    void load();
  };

  const togglePinned = async (n: Note) => {
    await fetch(`/api/notes/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !n.is_pinned }),
    });
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: n.is_pinned ? "NOTE_UNPINNED" : "NOTE_PINNED",
        details: n.is_pinned ? "Unpinned a note" : "Pinned a note",
      }),
    });
    void load();
  };

  const toggleArchived = async (n: Note) => {
    await fetch(`/api/notes/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !n.is_archived }),
    });
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: n.is_archived ? "NOTE_UNARCHIVED" : "NOTE_ARCHIVED",
        details: n.is_archived ? "Unarchived a note" : "Archived a note",
      }),
    });
    void load();
  };

  const saveNoteEdits = async () => {
    if (!selectedNote) return;
    if (!editingTitle.trim() || !editingContent.trim()) return;
    await fetch(`/api/notes/${selectedNote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingTitle.trim(), content: editingContent.trim() }),
    });
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "NOTE_UPDATED", details: "Updated a note" }),
    });
    void load();
  };

  const switchView = async (next: ViewMode) => {
    setViewMode(next);
    const deleted = next === "trash";
    const notesRes = await fetch(`/api/notes?deleted=${deleted}`);
    const notesBody = await notesRes.json();
    const incoming = (notesBody.notes ?? []) as Note[];
    setNotes(incoming);
    const filtered = incoming.filter((note) => {
      if (next === "starred") return note.is_pinned;
      if (next === "archived") return Boolean(note.is_archived);
      if (next === "all") return !note.is_archived;
      return true;
    });
    const first = filtered[0];
    setSelectedNoteId(first?.id ?? null);
    setEditingTitle(first?.title ?? "");
    setEditingContent(first?.content ?? "");
  };

  const filteredNotes = notes.filter(
    (note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (viewMode === "starred") return note.is_pinned;
      if (viewMode === "archived") return Boolean(note.is_archived);
      if (viewMode === "all") return !note.is_archived;
      return true;
    },
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[1400px] flex-col bg-[#f6f6f6] lg:flex-row">
      <aside className="hidden w-56 border-r border-slate-200 bg-[#f1f1f1] lg:block">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-gradient-to-br from-indigo-500 to-pink-500 px-2 py-1 text-white">
              🔒
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Privacy Notes</p>
              <p className="text-xs text-slate-500">Encrypted</p>
            </div>
          </div>
        </div>
        <div className="space-y-1 p-3 text-sm">
          <button
            onClick={() => switchView("all")}
            className={`w-full rounded-md px-3 py-2 text-left font-medium ${
              viewMode === "all" ? "bg-slate-200 text-slate-900" : "text-slate-800 hover:bg-slate-200"
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => switchView("starred")}
            className={`w-full rounded-md px-3 py-2 text-left ${
              viewMode === "starred" ? "bg-slate-200 text-slate-900" : "text-slate-800 hover:bg-slate-200"
            }`}
          >
            Starred
          </button>
          <button
            onClick={() => switchView("archived")}
            className={`w-full rounded-md px-3 py-2 text-left ${
              viewMode === "archived" ? "bg-slate-200 text-slate-900" : "text-slate-800 hover:bg-slate-200"
            }`}
          >
            Archived
          </button>
          <button
            onClick={() => switchView("trash")}
            className={`w-full rounded-md px-3 py-2 text-left ${
              viewMode === "trash" ? "bg-slate-200 text-slate-900" : "text-slate-800 hover:bg-slate-200"
            }`}
          >
            Trash
          </button>
          <div className="my-3 border-t border-slate-200" />
          <button
            onClick={() => setShowActivityLog(true)}
            className="w-full rounded-md px-3 py-2 text-left text-slate-800 hover:bg-slate-200"
          >
            Activity Log
          </button>
        </div>
      </aside>

      <section className="w-full border-r border-slate-200 bg-[#f5f5f5] lg:w-[330px]">
        <div className="border-b border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 lg:hidden">Notes</p>
            <button
              onClick={createQuickNote}
              className="rounded p-1 text-xl leading-none text-slate-900"
            >
              +
            </button>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {viewMode === "trash"
                ? "Trash Notes"
                : viewMode === "starred"
                  ? "Starred Notes"
                  : viewMode === "archived"
                    ? "Archived Notes"
                    : "All Notes"}
            </h2>
            <button
              onClick={() => switchView(viewMode === "trash" ? "all" : "trash")}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
            >
              {viewMode === "trash" ? "Back" : "Trash"}
            </button>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
          <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
            <button
              onClick={() => switchView("all")}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                viewMode === "all"
                  ? "border-slate-300 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => switchView("starred")}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                viewMode === "starred"
                  ? "border-slate-300 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Starred
            </button>
            <button
              onClick={() => switchView("archived")}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                viewMode === "archived"
                  ? "border-slate-300 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => switchView("trash")}
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                viewMode === "trash"
                  ? "border-slate-300 bg-slate-200 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              Trash
            </button>
            <button
              onClick={() => setShowActivityLog(true)}
              className="col-span-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              Activity Log
            </button>
          </div>
        </div>
        <div className="max-h-[40vh] overflow-y-auto lg:max-h-[72vh]">
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedNoteId(note.id);
                setEditingTitle(note.title);
                setEditingContent(note.content);
              }}
              className={`w-full border-b border-slate-200 p-4 text-left ${
                selectedNoteId === note.id ? "bg-slate-200" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-slate-900">{note.title}</p>
                {note.is_pinned && <span className="text-xs text-amber-500">⭐</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{note.content}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="flex-1 bg-white">
        {selectedNote ? (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-slate-400">✎</span>
                <input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full min-w-0 border-none bg-transparent text-xl font-semibold text-slate-900 outline-none sm:text-2xl lg:max-w-[420px]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {viewMode !== "trash" && (
                  <button
                    onClick={() => togglePinned(selectedNote)}
                    className={actionBtnBase}
                  >
                    {selectedNote.is_pinned ? "Unpin" : "Pin"}
                  </button>
                )}
                {viewMode !== "trash" && (
                  <button
                    onClick={() => toggleArchived(selectedNote)}
                    className={actionBtnBase}
                  >
                    {selectedNote.is_archived ? "Unarchive" : "Archive"}
                  </button>
                )}
                <button
                  onClick={() => softDelete(selectedNote.id, viewMode === "trash")}
                  className={actionBtnDanger}
                >
                  {viewMode === "trash" ? "Delete Forever" : "Move to Trash"}
                </button>
                <button
                  onClick={saveNoteEdits}
                  className={actionBtnSuccess}
                >
                  Save
                </button>
                <button className="rounded px-2 py-1 text-slate-700">⋮</button>
                <a
                  href={webgoatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={actionBtnBase}
                >
                  WebGoat
                </a>
              </div>
            </div>
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              placeholder="Write your secure note here..."
              className="min-h-[50vh] w-full resize-none border-none bg-white px-4 py-4 text-base leading-7 text-slate-900 outline-none sm:px-8 sm:py-6 sm:text-lg sm:leading-8 lg:min-h-[68vh] lg:px-14 lg:py-8 lg:leading-9"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Select a note to view.
          </div>
        )}
      </section>
      <ActivityLogModal
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        activities={activity}
      />
    </div>
  );
}
