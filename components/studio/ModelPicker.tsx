"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MODELS, getModel, type ModelId } from "@/config/models";
import { Pressable } from "@/components/ui/Pressable";
import { Check, ChevronDown, CytraMark, Layers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Props = {
  value: ModelId;
  onChange: (id: ModelId) => void;
  placement?: "top" | "bottom";
  disabled?: boolean;
};

const GROUPS = [
  { key: "dedicated", label: "专属模型" },
  { key: "relay", label: "中转模型 · 便民服务" },
] as const;

export function ModelPicker({ value, onChange, placement = "bottom", disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => MODELS.findIndex((m) => m.id === value));
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = getModel(value) ?? MODELS[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openList = () => {
    setActive(MODELS.findIndex((m) => m.id === value));
    setOpen(true);
  };

  const choose = (index: number) => {
    const model = MODELS[index];
    if (model) onChange(model.id);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % MODELS.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + MODELS.length) % MODELS.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(MODELS.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Pressable
        ref={buttonRef}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
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
        {current.group === "dedicated" ? (
          <CytraMark size={16} />
        ) : (
          <Layers size={15} className="text-ink-3" />
        )}
        <span className="font-medium text-ink">{current.name}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
          <ChevronDown size={14} />
        </motion.span>
      </Pressable>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label="选择模型"
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            initial={{ opacity: 0, scale: 0.96, y: placement === "top" ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: placement === "top" ? 6 : -6, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className={cn(
              "glass glass-strong absolute left-0 z-50 w-[300px] rounded-[22px] p-1.5 outline-none",
              placement === "top" ? "bottom-full mb-2 origin-bottom-left" : "top-full mt-2 origin-top-left",
            )}
          >
            {GROUPS.map((group) => (
              <li key={group.key} role="presentation">
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-ink-3">{group.label}</div>
                <ul role="group" aria-label={group.label}>
                  {MODELS.map((model, index) =>
                    model.group !== group.key ? null : (
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
                    ),
                  )}
                </ul>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
