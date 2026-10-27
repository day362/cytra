import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/relay", "/about", "/legal/privacy", "/legal/terms"];
  return pages.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path.startsWith("/legal") ? "yearly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
