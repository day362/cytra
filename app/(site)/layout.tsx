import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNav />
      <main id="main" className="relative">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
