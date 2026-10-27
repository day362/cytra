"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Supplier } from "@/lib/suppliers/types";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { Pressable } from "@/components/ui/Pressable";
import { Close } from "@/components/ui/icons";

export type InquiryItem = { supplier: Supplier; material: string };

type Props = {
  open: boolean;
  onClose: () => void;
  items: InquiryItem[];
  onRemove: (supplierId: string) => void;
  onSubmitted: () => void;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function InquirySheet({ open, onClose, items, onRemove, onSubmitted }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  // Most common material among the picked cards seeds the form.
  const material = items[0]?.material;
  const anyGmp = items.some((i) => i.supplier.products.some((p) => p.grade === "GMP"));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-[oklch(0.2_0.02_230/0.28)] backdrop-blur-[3px]"
          />
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="glass glass-strong fixed inset-x-2 bottom-2 z-[70] flex max-h-[92dvh] flex-col rounded-[30px] sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-3 sm:w-[480px] sm:max-h-none"
          >
            <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
              <div>
                <h2 id="inquiry-title" className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
                  询价单
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-3">平台顾问将核实资质后为你对接，厂家不会直接获得你的联系方式。</p>
              </div>
              <Pressable onClick={onClose} aria-label="关闭询价单" pressScale={0.88} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-[var(--line)]">
                <Close size={18} />
              </Pressable>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-3 pb-6">
              <InquiryForm
                kind="rfq"
                autoFocus
                prefill={{
                  material,
                  grade: anyGmp ? "GMP" : undefined,
                  suppliers: items.map((i) => ({ id: i.supplier.id, name: i.supplier.name })),
                }}
                onRemoveSupplier={onRemove}
                onSubmitted={onSubmitted}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
