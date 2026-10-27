"use client";

import { motion } from "motion/react";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Conversation } from "@/lib/chat/types";
import { historyStore } from "@/lib/chat/history-store";
import { Pressable } from "@/components/ui/Pressable";
import { Edit, Trash } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const DAY = 86_400_000;
const MINUTE = 60_000;

/** Wall clock rounded to the minute, so snapshots are stable between renders. */
const subscribeClock = (onChange: () => void) => {
  const timer = setInterval(onChange, MINUTE);
  return () => clearInterval(timer);
};
const readClock = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const serverClock = () => 0;

function groupLabel(ts: number, now: number): string {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (ts >= startOfToday) return "今天";
  if (ts >= startOfToday - DAY) return "昨天";
  if (ts >= startOfToday - 6 * DAY) return "7 天内";
  return "更早";
}

type Props = {
  conversations: readonly Conversation[];
  activeId: string | null;
  streamingIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
};

export function HistorySidebar({ conversations, activeId, streamingIds, onSelect, onNew, onDeleted }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const now = useSyncExternalStore(subscribeClock, readClock, serverClock);

  const groups = useMemo(() => {
    const map = new Map<string, Conversation[]>();
    for (const c of conversations) {
      const label = groupLabel(c.updatedAt, now);
      map.set(label, [...(map.get(label) ?? []), c]);
    }
    return [...map.entries()];
  }, [conversations, now]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Pressable
          onClick={onNew}
          tick
          className="flex h-11 w-full items-center gap-2 rounded-2xl bg-ink px-4 text-[14px] font-medium text-bg"
        >
          <Edit size={16} />
          新对话
        </Pressable>
      </div>

      <nav aria-label="历史对话" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
        {conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-[12px] leading-relaxed text-ink-3">还没有对话。<br />问一个原料问题开始吧。</p>
        )}
        {groups.map(([label, items]) => (
          <div key={label} className="mt-3 first:mt-1">
            <h2 className="px-3 pb-1 text-[11px] font-medium text-ink-3">{label}</h2>
            <ul>
              {items.map((c) => {
                const active = c.id === activeId;
                const askDelete = confirming === c.id;
                return (
                  <li key={c.id} className="group/item relative">
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-10 w-full items-center gap-2 rounded-xl pr-10 pl-3 text-left text-[13px] transition-colors",
                        active ? "text-ink" : "text-ink-2 hover:bg-[var(--line)] hover:text-ink",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="history-active"
                          className="absolute inset-0 -z-10 rounded-xl bg-[var(--glass-tint-strong)] shadow-[inset_0_0_0_1px_var(--line)]"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      {streamingIds.has(c.id) && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent" aria-label="生成中" />}
                      <span className="truncate">{c.title || "未命名对话"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!askDelete) {
                          setConfirming(c.id);
                          setTimeout(() => setConfirming((v) => (v === c.id ? null : v)), 2500);
                          return;
                        }
                        historyStore.remove(c.id);
                        setConfirming(null);
                        onDeleted(c.id);
                      }}
                      aria-label={askDelete ? `确认删除“${c.title}”` : `删除“${c.title}”`}
                      className={cn(
                        "absolute top-1/2 right-1.5 grid h-7 -translate-y-1/2 place-items-center rounded-lg px-1.5 text-[11px] transition-all",
                        askDelete
                          ? "bg-[color-mix(in_oklch,var(--danger)_14%,transparent)] text-danger opacity-100"
                          : "text-ink-3 opacity-0 group-hover/item:opacity-100 hover:text-danger focus-visible:opacity-100",
                      )}
                    >
                      {askDelete ? "删除？" : <Trash size={15} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-3">
        对话仅保存在本浏览器，不会上传云端。
      </div>
    </div>
  );
}
