"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pressable } from "@/components/ui/Pressable";
import { ArrowUp } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Props = {
  streaming: boolean;
  disabled: boolean;
  onSend: () => void;
  onStop: () => void;
};

export function SendButton({ streaming, disabled, onSend, onStop }: Props) {
  const live = streaming || !disabled;
  return (
    <Pressable
      tick
      pressScale={0.86}
      onClick={streaming ? onStop : onSend}
      disabled={!live}
      aria-label={streaming ? "停止生成" : "发送"}
      data-testid="send-button"
      className={cn(
        "grid size-10 shrink-0 place-items-center overflow-hidden rounded-full transition-[background-color,box-shadow,color] duration-300",
        live
          ? "bg-accent text-accent-ink shadow-[0_6px_16px_-6px_var(--accent),inset_0_1px_0_oklch(1_0_0/0.35)]"
          : "bg-[var(--line)] text-ink-3",
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {streaming ? (
          <motion.span
            key="stop"
            initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 26 }}
            className="block size-3 rounded-[3px] bg-current"
          />
        ) : (
          <motion.span
            key="send"
            // When a message goes out the arrow flies up and a fresh one rises in.
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -22, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
            className="grid place-items-center"
          >
            <ArrowUp size={18} strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>
    </Pressable>
  );
}
