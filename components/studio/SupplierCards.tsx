"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pressable, trackSpecular } from "@/components/ui/Pressable";
import { Check, Factory, Plus } from "@/components/ui/icons";
import type { Supplier, SupplierResult } from "@/lib/suppliers/types";
import { cn } from "@/lib/cn";

const SCALE_WEEKS = 20;

function LeadTime({ weeks }: { weeks: [number, number] }) {
  const [min, max] = weeks;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px] text-ink-3">
        <span>货期</span>
        <span className="spec text-[12px] text-ink">
          {min}–{max} 周
        </span>
      </div>
      <div className="relative mt-1.5 h-1.5 rounded-full bg-[var(--line)]" aria-hidden="true">
        <motion.div
          className="absolute inset-y-0 rounded-full bg-accent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            left: `${(min / SCALE_WEEKS) * 100}%`,
            width: `${(Math.max(max - min, 0.5) / SCALE_WEEKS) * 100}%`,
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  );
}

function SupplierCard({
  supplier,
  selected,
  onToggle,
  index,
}: {
  supplier: Supplier;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={trackSpecular}
      data-testid="supplier-card"
      className={cn(
        "glass specular flex w-[min(84vw,320px)] shrink-0 snap-start flex-col rounded-[24px] p-5 transition-shadow duration-300 sm:w-auto",
        selected && "shadow-[var(--glass-shadow),inset_0_0_0_1.5px_var(--accent)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{supplier.name}</h3>
          <p className="mt-0.5 text-[12px] text-ink-3">
            {supplier.region} · {supplier.city}
          </p>
        </div>
        {supplier.demo && (
          <span className="shrink-0 rounded-full bg-[var(--line)] px-2 py-0.5 text-[10.5px] text-ink-2">示例数据</span>
        )}
      </div>

      <ul className="mt-4 space-y-1.5">
        {supplier.products.map((p) => (
          <li key={p.name} className="flex items-start gap-2 text-[13px] leading-snug text-ink-2">
            <span
              className={cn(
                "spec mt-px shrink-0 rounded-md px-1.5 py-px text-[10.5px]",
                p.grade === "GMP" ? "bg-[var(--accent-soft)] text-accent-strong" : "bg-[var(--line)] text-ink-2",
              )}
            >
              {p.grade}
            </span>
            <span>
              {p.name}
              {p.animalOriginFree && <span className="ml-1 text-[11px] text-ink-3">AOF</span>}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-3">
        <LeadTime weeks={supplier.leadTimeWeeks} />
        <div className="flex items-baseline justify-between text-[11px] text-ink-3">
          <span>起订量</span>
          <span className="spec text-[12px] text-ink">{supplier.moq}</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1" aria-label="可提供文件">
        {supplier.documents.map((d) => (
          <li key={d} className="rounded-full px-2 py-0.5 text-[11px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
            {d}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-3">{supplier.note}</p>

      <div className="mt-auto pt-4">
      <Pressable
        tick
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors duration-300",
          selected ? "bg-accent text-accent-ink" : "bg-[var(--line)] text-ink hover:bg-[var(--line-strong)]",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={selected ? "on" : "off"}
            initial={{ scale: 0.4, opacity: 0, rotate: selected ? -90 : 90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 26 }}
          >
            {selected ? <Check size={15} strokeWidth={2} /> : <Plus size={15} />}
          </motion.span>
        </AnimatePresence>
        {selected ? "已加入询价" : "加入询价"}
      </Pressable>
      </div>
    </motion.li>
  );
}

type Props = {
  result: SupplierResult;
  selected: ReadonlySet<string>;
  onToggle: (supplier: Supplier, material: string) => void;
};

export function SupplierCards({ result, selected, onToggle }: Props) {
  const { query, suppliers } = result;
  const filters = [query.grade && query.grade !== "不限" && query.grade, query.animal_origin_free && "无动物源", query.region && query.region !== "不限" && query.region].filter(Boolean);

  return (
    <section aria-label="厂家检索结果" className="-mx-1">
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[12px] text-ink-3">
        <Factory size={14} className="text-accent" />
        <span>
          厂家库检索「<span className="text-ink-2">{query.material}</span>」
          {filters.length > 0 && ` · ${filters.join(" · ")}`}
        </span>
        <span>· {suppliers.length} 条结果</span>
        {result.demo && <span className="text-ink-3">· 演示数据，非真实企业</span>}
      </div>
      {suppliers.length > 0 && (
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible">
          {suppliers.map((s, i) => (
            <SupplierCard key={s.id} supplier={s} index={i} selected={selected.has(s.id)} onToggle={() => onToggle(s, query.material)} />
          ))}
        </ul>
      )}
    </section>
  );
}
