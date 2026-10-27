import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { ArrowRight } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main id="main" className="flex min-h-[100svh] flex-col items-center justify-center px-4 text-center">
        <p className="spec text-[13px] text-accent-strong">404 · 未检出</p>
        <h1 className="mt-4 text-[clamp(32px,5vw,52px)] font-semibold tracking-[-0.03em] text-ink">这张载玻片上什么也没有。</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">你要找的页面不存在，或已被移动。</p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-bg transition-transform active:scale-95">
          回到首页 <ArrowRight size={16} />
        </Link>
      </main>
    </>
  );
}
