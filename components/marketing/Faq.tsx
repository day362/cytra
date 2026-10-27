import { ChevronDown } from "@/components/ui/icons";

/** Native <details> keeps the accordion keyboard- and screen-reader-friendly without JS. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="glass divide-y divide-[var(--line)] rounded-[28px] px-2">
      {items.map((item) => (
        <details key={item.q} className="group px-4 py-1 [&::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown size={18} className="shrink-0 text-ink-3 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-[14px] leading-[1.8] text-ink-2">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
