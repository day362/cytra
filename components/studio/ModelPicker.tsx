"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { MODELS, getModel, type ModelId, type ModelOption } from "@/config/models";
import { Pressable } from "@/components/ui/Pressable";
import { Check, ChevronDown, CytraMark, Layers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Props = {
  value: ModelId;
  onChange: (id: ModelId) => void;
  /** Models this deployment has upstreams for. Defaults to all. */
  available?: readonly ModelId[];
  placement?: "top" | "bottom";
  disabled?: boolean;
};

const GROUPS = [
  { key: "dedicated", label: "专属模型" },
  { key: "relay", label: "中转模型 · 便民服务" },
] as const;

const LIST_WIDTH = 300;
const GAP = 8;
const EDGE = 12;

type Position = { left: number; top?: number; bottom?: number; maxHeight: number; side: "top" | "bottom" };

export function ModelPicker({ value, onChange, available, placement = "bottom", disabled }: Props) {
  const models: readonly ModelOption[] = available ? MODELS.filter((m) => available.includes(m.id)) : MODELS;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = getModel(value) ?? models[0];

  // The list is portalled to <body> so no ancestor stacking context
  // (transformed / animated parents) can paint over it.
  const place = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - GAP - EDGE;
    const above = rect.top - GAP - EDGE;
    // Prefer the requested side, flip when the other side has clearly more room.
    const side = placement === "bottom" ? (below >= 320 || below >= above ? "bottom" : "top") : above >= 320 || above >= below ? "top" : "bottom";
    const left = Math.min(Math.max(EDGE, rect.left), window.innerWidth - LIST_WIDTH - EDGE);
    setPosition(
      side === "bottom"
        ? { side, left, top: rect.bottom + GAP, maxHeight: below }
        : { side, left, bottom: window.innerHeight - rect.top + GAP, maxHeight: above },
    );
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const close = () => {
    setOpen(false);
    setPosition(null);
  };

  // The list mounts only once it has a position, so focus it after that.
  const placed = position !== null;
  useEffect(() => {
    if (open && placed) listRef.current?.focus({ preventScroll: true });
  }, [open, placed]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !listRef.current?.contains(target)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, models.findIndex((m) => m.id === value)));
    setOpen(true);
  };

  const choose = (index: number) => {
    const model = models[index];
    if (model) onChange(model.id);
    close();
    buttonRef.current?.focus();
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % models.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + models.length) % models.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(models.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      close();
      buttonRef.current?.focus();
    }
  };

  // With a single model there is nothing to choose: show a static label.
  if (models.length <= 1) {
    return (
      <span className="flex h-9 items-center gap-1.5 pr-2.5 pl-2 text-[13px] select-none">
        {current.group === "dedicated" ? <CytraMark size={16} /> : <Layers size={15} className="text-ink-3" />}
        <span className="font-medium text-ink">{current.name}</span>
      </span>
    );
  }

  const list = (
    <AnimatePresence>
      {open && position && (
        <motion.ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="选择模型"
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          initial={{ opacity: 0, scale: 0.96, y: position.side === "top" ? 6 : -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: position.side === "top" ? 6 : -6, transition: { duration: 0.14 } }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          style={{ left: position.left, top: position.top, bottom: position.bottom, maxHeight: position.maxHeight, width: LIST_WIDTH }}
          className={cn(
            "glass glass-popover fixed z-[80] overflow-y-auto overscroll-contain rounded-[22px] p-1.5 outline-none select-none",
            position.side === "top" ? "origin-bottom-left" : "origin-top-left",
          )}
        >
          {GROUPS.map((group) => {
            const items = models.map((m, i) => [m, i] as const).filter(([m]) => m.group === group.key);
            if (!items.length) return null;
            return (
              <li key={group.key} role="presentation">
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-ink-3">{group.label}</div>
                <ul role="group" aria-label={group.label}>
                  {items.map(([model, index]) => (
                    <li
                      key={model.id}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={model.id === value}
                      onPointerEnter={() => setActive(index)}
                      onClick={() => choose(index)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                        index === active && "bg-[var(--line)]",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--glass-tint)] shadow-[inset_0_0_0_1px_var(--line)]">
                        {model.group === "dedicated" ? <CytraMark size={18} /> : <span className="spec text-[11px] text-ink-2">{model.name.slice(0, 2)}</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-[14px] font-medium text-ink">{model.name}</span>
                          <span className="text-[11px] text-ink-3">{model.vendor}</span>
                        </span>
                        <span className="block truncate text-[12px] text-ink-2">{model.tagline}</span>
                      </span>
                      {model.id === value && <Check size={16} className="text-accent" />}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </motion.ul>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Pressable
        ref={buttonRef}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openList();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`当前模型：${current.name}，点击切换`}
        data-testid="model-picker"
        pressScale={0.95}
        className="flex h-9 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[13px] text-ink-2 transition-colors hover:bg-[var(--line)] hover:text-ink"
      >
        {current.group === "dedicated" ? <CytraMark size={16} /> : <Layers size={15} className="text-ink-3" />}
        <span className="font-medium text-ink">{current.name}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
          <ChevronDown size={14} />
        </motion.span>
      </Pressable>
      {typeof document !== "undefined" && createPortal(list, document.body)}
    </>
  );
}
