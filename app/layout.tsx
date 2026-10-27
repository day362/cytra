import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import { CytoplasmCanvas } from "@/components/glass/CytoplasmCanvas";
import { ThemeScript } from "@/components/site/ThemeScript";
import { site } from "@/config/site";
import "./globals.css";

const latin = Instrument_Sans({ variable: "--font-latin", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono-latin", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.fullName} — 生物制药原料咨询`, template: `%s · ${site.fullName}` },
  description: site.description,
  applicationName: site.fullName,
  keywords: ["生物制药", "原材料", "培养基", "GMP", "层析填料", "辅料", "供应商", "AI 咨询", "模型中转"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: site.fullName,
    title: `${site.fullName} — 生物制药原料咨询`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#121619" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${latin.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
        >
          跳到主要内容
        </a>
        <CytoplasmCanvas />
        {children}
      </body>
    </html>
  );
}
