import type { ReactNode } from "react";

export function LegalDoc({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[760px] px-4 pt-36">
      <p role="note" className="mb-8 rounded-2xl bg-[color-mix(in_oklch,var(--danger)_9%,transparent)] px-4 py-3 text-[13px] leading-relaxed text-danger">
        本文为产品模板，尚未经过法务审核，不构成正式法律文本。上线前须由法律顾问根据实际业务、主体与数据处理情况修订。
      </p>
      <h1 className="text-[clamp(30px,4.4vw,44px)] font-semibold tracking-[-0.03em] text-ink">{title}</h1>
      <p className="mt-3 text-[13px] text-ink-3">更新日期：{updated}</p>
      <div className="glass prose-cytra mt-10 rounded-[28px] p-7 sm:p-10">{children}</div>
    </article>
  );
}
