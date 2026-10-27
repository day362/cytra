"use client";

import { motion } from "motion/react";
import { memo, useState } from "react";
import { getModel } from "@/config/models";
import { AI_DISCLOSURE } from "@/config/site";
import { messageText, type ChatMessage } from "@/lib/chat/types";
import type { Supplier } from "@/lib/suppliers/types";
import { Pressable } from "@/components/ui/Pressable";
import { Check, Copy, CytraMark, Layers, Refresh } from "@/components/ui/icons";
import { Markdown } from "./Markdown";
import { SupplierCards } from "./SupplierCards";
import { ThinkingCell } from "./ThinkingCell";
import { cn } from "@/lib/cn";

const enter = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

type Props = {
  message: ChatMessage;
  isLast: boolean;
  onRetry?: () => void;
  selectedSuppliers: ReadonlySet<string>;
  onToggleSupplier: (supplier: Supplier, material: string) => void;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      onClick={async () => {
        try {
          // Implicit AIGC marker travels with copied content.
          await navigator.clipboard.writeText(`${text}\n\n——\n${AI_DISCLOSURE}（来源：胞序 Cytra）`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      aria-label={copied ? "已复制" : "复制回答"}
      pressScale={0.88}
      className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-[var(--line)] hover:text-ink"
    >
      {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
    </Pressable>
  );
}

export const MessageView = memo(function MessageView({ message, isLast, onRetry, selectedSuppliers, onToggleSupplier }: Props) {
  if (message.role === "user") {
    return (
      <motion.div {...enter} className="flex justify-end">
        <div className="glass max-w-[85%] rounded-[22px] rounded-br-md bg-[var(--accent-soft)] px-4 py-2.5 text-[15px] leading-[1.7] whitespace-pre-wrap text-ink">
          {messageText(message)}
        </div>
      </motion.div>
    );
  }

  const model = message.model ? getModel(message.model) : undefined;
  const streaming = message.status === "streaming";
  const text = messageText(message);
  const lastPart = message.parts.at(-1);

  return (
    <motion.article {...enter} className="group/msg" aria-busy={streaming}>
      <header className="mb-2 flex items-center gap-2 text-[12px] text-ink-3">
        {model?.group === "relay" ? <Layers size={14} /> : <CytraMark size={16} />}
        <span className="font-medium text-ink-2">{model?.name ?? "Cytra Bio"}</span>
        <span className="rounded-full px-1.5 py-px text-[10.5px] shadow-[inset_0_0_0_1px_var(--line-strong)]">AI 生成</span>
      </header>

      <div className="space-y-4">
        {message.parts.map((part, i) => {
          const tail = i === message.parts.length - 1;
          return part.type === "text" ? (
            <div key={i} className={cn(streaming && tail && "developing")}>
              <Markdown text={part.text} />
            </div>
          ) : (
            <SupplierCards key={i} result={part.result} selected={selectedSuppliers} onToggle={onToggleSupplier} />
          );
        })}

        {streaming && message.parts.length === 0 && <ThinkingCell />}
        {streaming && lastPart?.type === "suppliers" && <ThinkingCell label="正在比较厂家" />}
      </div>

      {message.status === "aborted" && <p className="mt-3 text-[12px] text-ink-3">已停止生成</p>}

      {message.status === "error" && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] px-4 py-3 text-[13px] text-danger">
          <span>{message.error ?? "生成失败"}</span>
          {isLast && onRetry && (
            <Pressable onClick={onRetry} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-medium hover:bg-[var(--line)]">
              <Refresh size={14} /> 重试
            </Pressable>
          )}
        </div>
      )}

      {!streaming && message.status !== "error" && text && (
        <div
          className={cn(
            "mt-2 flex items-center gap-0.5 transition-opacity duration-300",
            isLast ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100",
          )}
        >
          <CopyButton text={text} />
          {isLast && onRetry && (
            <Pressable
              onClick={onRetry}
              aria-label="重新生成"
              pressScale={0.88}
              className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-[var(--line)] hover:text-ink"
            >
              <Refresh size={15} />
            </Pressable>
          )}
        </div>
      )}
    </motion.article>
  );
});
