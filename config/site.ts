export const site = {
  name: "Cytra",
  nameZh: "胞序",
  fullName: "Cytra · 胞序",
  tagline: "原料的事，问胞序。",
  description:
    "面向药企、CRO/CDMO 与 biotech 采购和研发人员的生物制药原料咨询平台：规格、等级、替代方案、资质文件与厂家对接，一次问清。附带多模型中转服务。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "zh-CN",
  /** Placeholders — must be replaced with real filing numbers before launch. */
  compliance: {
    icp: "ICP 备案号：待取得",
    aigcFiling: "生成式人工智能服务备案号：待取得",
    company: "胞序科技（示例主体）",
  },
  contactEmail: "hello@cytra.example",
  nav: [
    { href: "/", label: "咨询" },
    { href: "/relay", label: "模型中转" },
    { href: "/about", label: "关于" },
  ],
} as const;

export const AI_DISCLOSURE = "内容由 AI 生成，仅供参考，不构成采购、法规或质量放行依据。";
