"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ModelId } from "@/config/models";
import { AI_DISCLOSURE } from "@/config/site";
import { emitPulse, setCalm } from "@/components/glass/field-store";
import { SiteNav, Wordmark } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LandingSections } from "@/components/site/LandingSections";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Pressable } from "@/components/ui/Pressable";
import { ArrowRight, ChevronDown, Close, Edit, Sidebar } from "@/components/ui/icons";
import { useConversation, useConversations, useHistoryReady } from "@/lib/chat/history-store";
import { useChatRunner } from "@/lib/chat/useChatRunner";
import type { Supplier } from "@/lib/suppliers/types";
import { Composer } from "./Composer";
import { Hero } from "./Hero";
import { HistorySidebar } from "./HistorySidebar";
import { InquirySheet, type InquiryItem } from "./InquirySheet";
import { MessageView } from "./MessageView";

function idFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/c\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const go = (path: string) => window.history.pushState(null, "", path);

type StudioProps = {
  demo: boolean;
  /** Models the server can serve; others are hidden. */
  models: readonly ModelId[];
  defaultModel: ModelId;
};

export function Studio({ demo: initialDemo, models, defaultModel }: StudioProps) {
  const pathname = usePathname();
  const activeId = idFromPath(pathname);
  const ready = useHistoryReady();
  const conversations = useConversations();
  const conversation = useConversation(activeId);
  const { send, stop, retry, streaming, demo: liveDemo } = useChatRunner();
  const demo = liveDemo ?? initialDemo;

  const [input, setInput] = useState("");
  const [model, setModel] = useState<ModelId>(defaultModel);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [picked, setPicked] = useState<ReadonlyMap<string, InquiryItem>>(new Map());
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const pickedIds = useMemo(() => new Set(picked.keys()), [picked]);

  // Follow the conversation's model when switching conversations
  // (adjusting state during render instead of in an effect).
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (conversation && syncedId !== conversation.id) {
    setSyncedId(conversation.id);
    // A conversation may predate a config change that disabled its model.
    setModel(models.includes(conversation.model) ? conversation.model : defaultModel);
  }

  const mode = activeId ? "workspace" : "hero";
  const isStreaming = !!activeId && streaming.has(activeId);

  useEffect(() => {
    setCalm(mode === "workspace" ? 1 : 0);
    if (mode === "workspace") window.scrollTo({ top: 0 });
  }, [mode]);

  // ---- Auto-scroll: stick to bottom unless the reader scrolled up. ----
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    stickRef.current = near;
    setShowJump(!near);
  };
  const jumpToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };
  useLayoutEffect(() => {
    if (stickRef.current) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation?.updatedAt]);
  useLayoutEffect(() => {
    stickRef.current = true;
    jumpToBottom(false);
  }, [activeId]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    emitPulse();
    stickRef.current = true;
    const id = send(activeId, text, model);
    if (!activeId) go(`/c/${id}`);
  }, [input, activeId, model, send]);

  const newChat = () => {
    setDrawerOpen(false);
    setPicked(new Map());
    go("/");
  };

  const selectConversation = (id: string) => {
    setDrawerOpen(false);
    if (id !== activeId) go(`/c/${id}`);
  };

  const toggleSupplier = useCallback((supplier: Supplier, material: string) => {
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(supplier.id)) next.delete(supplier.id);
      else next.set(supplier.id, { supplier, material });
      return next;
    });
  }, []);

  const composer = (variant: "hero" | "dock") => (
    <Composer
      variant={variant}
      value={input}
      onChange={setInput}
      onSubmit={submit}
      onStop={() => activeId && stop(activeId)}
      streaming={isStreaming}
      model={model}
      onModelChange={setModel}
      models={models}
      demo={demo}
      autoFocus={variant === "dock"}
    />
  );

  const sidebar = (
    <HistorySidebar
      conversations={conversations}
      activeId={activeId}
      streamingIds={streaming}
      onSelect={selectConversation}
      onNew={newChat}
      onDeleted={(id) => id === activeId && go("/")}
    />
  );

  const messages = conversation?.messages ?? [];
  const lastIndex = messages.length - 1;
  const notFound = ready && activeId && !conversation;

  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout" initial={false}>
        {mode === "hero" ? (
          <motion.div
            key="hero"
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
          >
            <SiteNav />
            <main id="main">
              <Hero onScenario={(s) => setInput(s.prompt)} composer={composer("hero")} />
              <LandingSections />
            </main>
            <SiteFooter />
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="flex h-dvh overflow-hidden"
          >
            {/* Desktop sidebar */}
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.aside
                  key="sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 288, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 40 }}
                  className="hidden shrink-0 overflow-hidden lg:block"
                  aria-label="对话列表"
                >
                  <div className="glass m-3 mr-0 h-[calc(100%-1.5rem)] w-[276px] rounded-[26px]">{sidebar}</div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Mobile drawer */}
            <AnimatePresence>
              {drawerOpen && (
                <>
                  <motion.div
                    key="scrim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setDrawerOpen(false)}
                    className="fixed inset-0 z-40 bg-[oklch(0.2_0.02_230/0.25)] backdrop-blur-[2px] lg:hidden"
                  />
                  <motion.aside
                    key="drawer"
                    initial={{ x: "-104%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-104%" }}
                    transition={{ type: "spring", stiffness: 420, damping: 40 }}
                    className="glass glass-strong fixed inset-y-3 left-3 z-50 w-[min(300px,calc(100vw-48px))] rounded-[26px] lg:hidden"
                    aria-label="对话列表"
                  >
                    <Pressable
                      onClick={() => setDrawerOpen(false)}
                      aria-label="关闭对话列表"
                      className="absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-full text-ink-3"
                    >
                      <Close size={16} />
                    </Pressable>
                    <div className="h-full pt-10">{sidebar}</div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            <div className="relative flex min-w-0 flex-1 flex-col">
              <header className="flex h-16 shrink-0 items-center gap-1 px-3">
                <Pressable
                  onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? setSidebarOpen((v) => !v) : setDrawerOpen(true))}
                  aria-label="切换对话列表"
                  pressScale={0.88}
                  className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[var(--line)]"
                >
                  <Sidebar size={18} />
                </Pressable>
                <Link href="/" onClick={(e) => (e.preventDefault(), newChat())} aria-label="回到首页" className="ml-1 hidden rounded-full sm:block">
                  <Wordmark />
                </Link>
                <h1 className="mx-3 min-w-0 flex-1 truncate text-center text-[13px] text-ink-2 sm:text-left">
                  {conversation?.title}
                </h1>
                <Pressable
                  onClick={newChat}
                  aria-label="新对话"
                  pressScale={0.88}
                  className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-[var(--line)]"
                >
                  <Edit size={17} />
                </Pressable>
                <ThemeToggle />
              </header>

              <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto" id="main">
                <div
                  className="mx-auto w-full max-w-[780px] space-y-9 px-4 pt-4 pb-56"
                  aria-live="off"
                  data-testid="message-list"
                >
                  {notFound ? (
                    <div className="flex flex-col items-center py-24 text-center">
                      <p className="text-[15px] text-ink">没有找到这段对话</p>
                      <p className="mt-2 text-[13px] text-ink-3">对话只保存在创建它的浏览器里，可能已被删除或来自其他设备。</p>
                      <Pressable onClick={newChat} className="mt-6 h-10 rounded-full bg-ink px-5 text-[14px] text-bg">
                        开始新对话
                      </Pressable>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <MessageView
                        key={m.id}
                        message={m}
                        isLast={i === lastIndex}
                        onRetry={i === lastIndex && !isStreaming ? () => activeId && retry(activeId, model) : undefined}
                        selectedSuppliers={pickedIds}
                        onToggleSupplier={toggleSupplier}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,var(--bg)_30%,transparent)] px-3 pt-16 pb-3 sm:px-4 sm:pb-4">
                <div className="pointer-events-auto relative mx-auto w-full max-w-[780px]">
                  <AnimatePresence>
                    {showJump && (
                      <motion.div
                        key="jump"
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2"
                      >
                        <Pressable
                          onClick={() => jumpToBottom()}
                          aria-label="滚动到底部"
                          className="glass grid size-9 place-items-center rounded-full text-ink-2"
                        >
                          <ChevronDown size={18} />
                        </Pressable>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {picked.size > 0 && (
                      <motion.div
                        key="tray"
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 480, damping: 34 }}
                        className="mb-2 flex justify-end"
                      >
                        <Pressable
                          tick
                          onClick={() => setInquiryOpen(true)}
                          data-testid="inquiry-tray"
                          className="glass flex h-10 items-center gap-2 rounded-full pr-3 pl-4 text-[13px] font-medium text-ink"
                        >
                          <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-accent-ink">{picked.size}</span>
                          生成询价单
                          <ArrowRight size={15} />
                        </Pressable>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {composer("dock")}
                  <p className="mt-2 text-center text-[11px] text-ink-3">{AI_DISCLOSURE}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InquirySheet
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        items={[...picked.values()]}
        onRemove={(id) =>
          setPicked((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          })
        }
        onSubmitted={() => setPicked(new Map())}
      />
    </LayoutGroup>
  );
}
