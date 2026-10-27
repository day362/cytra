"use client";

import { motion, type HTMLMotionProps, type Transition } from "motion/react";
import type { PointerEvent } from "react";
import { cn } from "@/lib/cn";

/** Press feel shared by every tappable surface: quick to sink, slightly bouncy on release. */
export const pressSpring: Transition = { type: "spring", stiffness: 700, damping: 24, mass: 0.6 };

export function trackSpecular(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

/** Short tick on devices that support it (Android). iOS Safari ignores it. */
export function haptic(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* not allowed in this context */
    }
  }
}

type PressableProps = HTMLMotionProps<"button"> & {
  /** Fire a haptic tick on press. */
  tick?: boolean;
  pressScale?: number;
};

export function Pressable({
  tick = false,
  pressScale = 0.96,
  className,
  onPointerMove,
  onPointerDown,
  type = "button",
  ...rest
}: PressableProps) {
  return (
    <motion.button
      type={type}
      whileTap={rest.disabled ? undefined : { scale: pressScale, y: 1 }}
      transition={pressSpring}
      onPointerMove={(e) => {
        trackSpecular(e);
        onPointerMove?.(e);
      }}
      onPointerDown={(e) => {
        if (tick && !rest.disabled) haptic();
        onPointerDown?.(e);
      }}
      className={cn("specular relative isolate select-none", className)}
      {...rest}
    />
  );
}
