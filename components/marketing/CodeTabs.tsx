"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { Pressable } from "@/components/ui/Pressable";
import { Check, Copy } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Tab = { label: string; code: string };

export function CodeTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const id = useId();

  return (
    <div className="glass overflow-hidden rounded-[24px]">
      <div className="flex items-center justify-between border-b border-line px-2 py-2">
        <div role="tablist" aria-label="示例代码语言" className="flex gap-1">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              onClick={() => setActive(i)}
              className={cn("relative rounded-full px-3.5 py-1.5 text-[12px] transition-colors", i === active ? "text-ink" : "text-ink-3 hover:text-ink")}
            >
              {i === active && (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 -z-10 rounded-full bg-[var(--line)]"
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>
        <Pressable
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(tabs[active].code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked */
            }
          }}
          aria-label={copied ? "已复制" : "复制代码"}
          pressScale={0.88}
          className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-[var(--line)] hover:text-ink"
        >
          {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
        </Pressable>
      </div>
      <pre
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
        className="spec overflow-x-auto p-5 text-[12.5px] leading-[1.75] text-ink-2"
      >
        <code>{tabs[active].code}</code>
      </pre>
    </div>
  );
}
