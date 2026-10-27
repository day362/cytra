import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-[760px] px-4 pt-36 pb-12 text-center">
      <Reveal>
        <p className="text-[13px] font-medium text-accent-strong">{eyebrow}</p>
        <h1 className="mt-4 text-[clamp(34px,5.6vw,60px)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance text-ink [word-break:keep-all]">{title}</h1>
        {children && <div className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.8] text-pretty text-ink-2">{children}</div>}
      </Reveal>
    </header>
  );
}
