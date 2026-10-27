"use client";

import { useSyncExternalStore } from "react";
import type { Conversation } from "./types";

/**
 * Conversation history kept in this browser only (no account system).
 * In-memory snapshot + throttled localStorage persistence: streaming updates
 * re-render immediately but hit storage at most every PERSIST_MS.
 */

const KEY = "cytra-conversations-v1";
const MAX_CONVERSATIONS = 50;
const PERSIST_MS = 800;

type Snapshot = readonly Conversation[];
const EMPTY: Snapshot = Object.freeze([]);

let snapshot: Snapshot = EMPTY;
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function sort(list: Conversation[]): Snapshot {
  return list.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
}

function load(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(
      (c): c is Conversation =>
        !!c && typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.messages),
    );
    // A message left "streaming" by a closed tab can never finish.
    for (const c of valid) for (const m of c.messages) if (m.status === "streaming") m.status = "aborted";
    return sort(valid);
  } catch {
    return EMPTY;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  snapshot = load();
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    snapshot = load();
    emit();
  });
  window.addEventListener("pagehide", flush);
}

function flush() {
  clearTimeout(persistTimer);
  persistTimer = undefined;
  let list = [...snapshot];
  while (list.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return;
    } catch {
      // Quota exceeded or storage blocked: drop the oldest and retry.
      list = list.slice(0, -1);
    }
  }
}

function emit() {
  for (const l of listeners) l();
}

function commit(next: Conversation[], immediate = false) {
  snapshot = sort(next);
  emit();
  if (immediate) flush();
  else persistTimer ??= setTimeout(flush, PERSIST_MS);
}

export const historyStore = {
  get(id: string): Conversation | undefined {
    hydrate();
    return snapshot.find((c) => c.id === id);
  },
  upsert(conversation: Conversation, immediate = false) {
    hydrate();
    commit([conversation, ...snapshot.filter((c) => c.id !== conversation.id)], immediate);
  },
  update(id: string, fn: (c: Conversation) => Conversation, immediate = false) {
    hydrate();
    const current = snapshot.find((c) => c.id === id);
    if (!current) return;
    commit([fn(current), ...snapshot.filter((c) => c.id !== id)], immediate);
  },
  remove(id: string) {
    hydrate();
    commit(
      snapshot.filter((c) => c.id !== id),
      true,
    );
  },
  clear() {
    hydrate();
    commit([], true);
  },
};

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => {
  hydrate();
  return snapshot;
};
const getServerSnapshot = () => EMPTY;

export function useConversations(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useConversation(id: string | null): Conversation | undefined {
  const all = useConversations();
  return id ? all.find((c) => c.id === id) : undefined;
}

/** False during SSR and the hydration pass, so UI can avoid "not found" flashes. */
export function useHistoryReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
