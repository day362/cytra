"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { Pressable, trackSpecular } from "@/components/ui/Pressable";
import { Close, CytraMark, Menu } from "@/components/ui/icons";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/c/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-ink", className)}>
      <CytraMark size={22} />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">
        Cytra<span className="mx-1.5 text-ink-3">·</span>胞序
      </span>
    </span>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu on navigation (adjusting state during render, not in an effect).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <nav
        aria-label="主导航"
        className="glass pointer-events-auto flex h-13 w-full max-w-[1080px] items-center justify-between rounded-full pr-2 pl-5"
      >
        <Link href="/" aria-label={`${site.fullName} 首页`} className="rounded-full">
          <Wordmark />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {site.nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onPointerMove={trackSpecular}
                  className={cn(
                    "specular relative block rounded-full px-4 py-1.5 text-[14px] transition-colors duration-300",
                    active ? "text-ink" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-[var(--glass-tint-strong)] shadow-[inset_0_0_0_1px_var(--line)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/about#inquiry"
            onPointerMove={trackSpecular}
            className="specular relative hidden h-9 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-bg transition-transform duration-200 active:scale-95 sm:flex"
          >
            提交询价
          </Link>
          <Pressable
            className="grid size-9 place-items-center rounded-full text-ink-2 md:hidden"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            pressScale={0.88}
          >
            {open ? <Close /> : <Menu />}
          </Pressable>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            className="glass glass-strong pointer-events-auto absolute inset-x-4 top-20 origin-top rounded-3xl p-2 md:hidden"
          >
            <ul>
              {site.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="flex h-12 items-center rounded-2xl px-4 text-[15px] text-ink active:bg-[var(--line)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/about#inquiry"
                  className="mt-1 flex h-12 items-center justify-center rounded-2xl bg-ink text-[15px] font-medium text-bg"
                >
                  提交询价
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
