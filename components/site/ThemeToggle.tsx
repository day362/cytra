"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pressable } from "@/components/ui/Pressable";
import { Monitor, Moon, Sun } from "@/components/ui/icons";
import { useTheme, type ThemePreference } from "@/lib/theme";

const ORDER: ThemePreference[] = ["system", "light", "dark"];
const LABEL: Record<ThemePreference, string> = { system: "跟随系统", light: "浅色", dark: "深色" };
const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Current = ICON[theme];

  return (
    <Pressable
      onClick={() => setTheme(next)}
      aria-label={`外观：${LABEL[theme]}，点击切换为${LABEL[next]}`}
      title={`外观：${LABEL[theme]}`}
      pressScale={0.88}
      className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:text-ink"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="grid place-items-center"
        >
          <Current size={18} />
        </motion.span>
      </AnimatePresence>
    </Pressable>
  );
}
