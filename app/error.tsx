"use client";

import { useEffect } from "react";
import { Pressable } from "@/components/ui/Pressable";
import { Refresh } from "@/components/ui/icons";

export default function ErrorBoundary({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Hook point for an error reporting service (Sentry etc.).
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-[100svh] flex-col items-center justify-center px-4 text-center">
      <p className="spec text-[13px] text-danger">ERROR</p>
      <h1 className="mt-4 text-[clamp(28px,4.4vw,44px)] font-semibold tracking-[-0.03em] text-ink">出了点问题。</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">页面遇到了意外错误。你的对话保存在本地，不会丢失。</p>
      <Pressable onClick={retry} tick className="mt-8 flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-bg">
        <Refresh size={16} /> 重试
      </Pressable>
    </main>
  );
}
