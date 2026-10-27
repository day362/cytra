"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ModelId } from "@/config/models";
import { MAX_INPUT_CHARS } from "@/lib/chat/limits";
import { releaseLens, setLens } from "@/components/glass/field-store";
import { ModelPicker } from "./ModelPicker";
import { SendButton } from "./SendButton";
import { cn } from "@/lib/cn";

export const PLACEHOLDER_EXAMPLES = [
  "CHO 细胞培养基有哪些无动物源替代方案？",
  "找能提供 DMF 的 GMP 级重组胰蛋白酶厂家",
  "Protein A 填料的动态载量和使用寿命怎么比较？",
  "注射级蔗糖做辅料，USP 和 ChP 标准差在哪？",
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  streaming: boolean;
  model: ModelId;
  onModelChange: (id: ModelId) => void;
  variant: "hero" | "dock";
  demo?: boolean;
  autoFocus?: boolean;
};

const MAX_ROWS_HEIGHT = 220;

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  model,
  onModelChange,
  variant,
  demo,
  autoFocus,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [example, setExample] = useState(0);
  const hero = variant === "hero";
  const empty = value.trim().length === 0;
  const over = value.length > MAX_INPUT_CHARS;

  // The shell is the lens the WebGL field refracts through.
  useEffect(() => {
    const el = shellRef.current;
    setLens(el);
    return () => releaseLens(el);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // Rotate example prompts while the box is empty.
  useEffect(() => {
    if (!empty) return;
    const id = window.setInterval(() => setExample((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length), 4200);
    return () => window.clearInterval(id);
  }, [empty]);

  // Auto-size the textarea.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    if (empty || over || streaming) return;
    onSubmit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Never send while an IME (Chinese pinyin etc.) is composing a word.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <motion.div
      layoutId="composer"
      ref={shellRef}
      data-lens-radius={hero ? 30 : 26}
      transition={{ type: "spring", stiffness: 260, damping: 32, mass: 0.9 }}
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "glass glass-lens relative w-full cursor-text transition-shadow duration-500",
        hero ? "rounded-[30px] p-3 pt-4" : "rounded-[26px] p-2.5 pt-3",
        focused && "shadow-[var(--glass-shadow-lift),inset_0_1px_0_var(--glass-edge),inset_0_0_0_1px_var(--glass-edge-soft)]",
      )}
      data-testid="composer"
    >
      <div className="relative px-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          aria-label="描述你的原料问题"
          aria-describedby="composer-hint"
          enterKeyHint="send"
          className={cn(
            "block w-full resize-none bg-transparent text-ink outline-none placeholder:text-transparent focus-visible:outline-none",
            hero ? "min-h-[56px] text-[17px] leading-[1.6]" : "min-h-[28px] text-[15px] leading-[1.6]",
          )}
          placeholder={PLACEHOLDER_EXAMPLES[example]}
        />
        <AnimatePresence mode="wait">
          {empty && (
            <motion.span
              key={example}
              aria-hidden="true"
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-none absolute top-0 left-2 right-2 truncate text-ink-3",
                hero ? "text-[17px] leading-[1.6]" : "text-[15px] leading-[1.6]",
              )}
            >
              {PLACEHOLDER_EXAMPLES[example]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 items-center gap-1.5">
          <ModelPicker value={model} onChange={onModelChange} placement={hero ? "bottom" : "top"} />
          {demo && (
            <span
              title="未配置模型 API，回答为预置演示内容"
              className="hidden h-6 items-center rounded-full bg-[var(--accent-soft)] px-2.5 text-[11px] font-medium text-accent-strong sm:flex"
            >
              演示模式
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span id="composer-hint" className={cn("spec text-[11px] text-ink-3", !over && value.length < MAX_INPUT_CHARS * 0.8 && "sr-only")}>
            {over ? `超出 ${value.length - MAX_INPUT_CHARS} 字` : `${value.length}/${MAX_INPUT_CHARS}`}
            <span className="sr-only">，回车发送，Shift + 回车换行</span>
          </span>
          <SendButton streaming={streaming} disabled={empty || over} onSend={submit} onStop={onStop} />
        </div>
      </div>
    </motion.div>
  );
}
