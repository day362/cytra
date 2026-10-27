import Link from "next/link";
import { AI_DISCLOSURE, site } from "@/config/site";
import { Wordmark } from "./SiteNav";

const columns = [
  {
    title: "产品",
    links: [
      { href: "/", label: "原料咨询" },
      { href: "/relay", label: "模型中转" },
      { href: "/about#inquiry", label: "提交询价" },
    ],
  },
  {
    title: "公司",
    links: [
      { href: "/about", label: "关于胞序" },
      { href: `mailto:${site.contactEmail}`, label: "联系我们" },
    ],
  },
  {
    title: "条款",
    links: [
      { href: "/legal/privacy", label: "隐私政策" },
      { href: "/legal/terms", label: "服务条款" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mx-auto w-full max-w-[1080px] px-4 pt-20 pb-10">
      <div className="glass rounded-[28px] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-[13px] leading-relaxed text-ink-2">{site.description}</p>
          </div>
          <nav aria-label="页脚" className="grid grid-cols-3 gap-10">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-[12px] font-medium text-ink-3">{col.title}</h2>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[13px] text-ink-2 transition-colors hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-[11px] leading-relaxed text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>{AI_DISCLOSURE}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>© {site.compliance.company}</span>
            <span>{site.compliance.icp}</span>
            <span>{site.compliance.aigcFiling}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
