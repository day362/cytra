"use client";

import { motion, useReducedMotion } from "motion/react";

/** "Thinking" indicator: a cell that pinches and divides, then merges again. */
export function ThinkingCell({ label = "正在检索与思考" }: { label?: string }) {
  const reduce = useReducedMotion();
  const loop = { duration: 1.8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] as const };

  return (
    <div className="flex items-center gap-3 text-[13px] text-ink-3" role="status" aria-live="polite">
      <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true" className="overflow-visible">
        <defs>
          <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          </filter>
        </defs>
        <g filter="url(#goo)" fill="var(--accent)">
          <motion.circle
            cy="10"
            r="6"
            animate={reduce ? undefined : { cx: [17, 10, 10, 17], r: [6.5, 5, 5, 6.5] }}
            transition={loop}
            cx="17"
          />
          <motion.circle
            cy="10"
            r="6"
            animate={reduce ? undefined : { cx: [17, 24, 24, 17], r: [6.5, 5, 5, 6.5] }}
            transition={loop}
            cx="17"
          />
        </g>
      </svg>
      <span>{label}</span>
    </div>
  );
}
