"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { MODELS } from "@/config/models";
import { ArrowRight, CytraMark, Doc, Factory, Flask } from "@/components/ui/icons";
import { trackSpecular } from "@/components/ui/Pressable";

const pillars = [
  {
    icon: Flask,
    title: "选型与替代",
    body: "从培养基、酶到层析填料与辅料，按工艺阶段、等级与法规要求给出可比较的候选方案和验证要点。",
    spec: ["GMP / RUO", "AOF / CD", "USP · EP · ChP"],
  },
  {
    icon: Doc,
    title: "资质与文件",
    body: "说清每一类原料该向供应商要什么：DMF、CoA、CoO、TSE/BSE 声明、变更通知协议，避免审计时补材料。",
    spec: ["DMF", "CoA", "TSE/BSE"],
  },
  {
    icon: Factory,
    title: "询价与对接",
    body: "专属模型检索厂家库，生成可对比的厂家卡片；勾选后一键生成结构化询价单，由平台为你对接。",
    spec: ["MOQ", "Lead time", "RFQ"],
  },
];

const reveal = {
  initial: { opacity: 0, y: 28, filter: "blur(6px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } },
  viewport: { once: true, margin: "-80px" },
};

export function LandingSections() {
  return (
    <div className="relative mx-auto w-full max-w-[1080px] px-4">
      <section aria-labelledby="pillars-title" className="pt-10">
        <motion.h2
          id="pillars-title"
          {...reveal}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] text-ink"
        >
          下单之前，把三件事问透。
        </motion.h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.article
              key={p.title}
              {...reveal}
              transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              onPointerMove={trackSpecular}
              className="glass specular rounded-[28px] p-7"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-accent-strong">
                <p.icon size={20} />
              </span>
              <h3 className="mt-6 text-[19px] font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
              <p className="mt-2.5 text-[14px] leading-[1.75] text-ink-2">{p.body}</p>
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {p.spec.map((s) => (
                  <li key={s} className="spec rounded-full px-2.5 py-1 text-[11px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)]">
                    {s}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section aria-labelledby="models-title" className="pt-28">
        <motion.div
          {...reveal}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="glass overflow-hidden rounded-[32px] p-8 md:p-12"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-md">
              <p className="text-[12px] font-medium text-accent-strong">附带服务 · 模型中转</p>
              <h2 id="models-title" className="mt-3 text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-ink">
                一个入口，顺手调用主流模型。
              </h2>
              <p className="mt-3 text-[14px] leading-[1.75] text-ink-2">
                在对话里随时切换，或用 OpenAI 兼容接口接入你自己的系统。专属模型负责原料问题，通用模型帮你写报告、读文献。
              </p>
            </div>
            <Link
              href="/relay"
              onPointerMove={trackSpecular}
              className="specular group relative flex h-11 w-fit items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-bg transition-transform active:scale-95"
            >
              了解中转服务
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {MODELS.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-3 rounded-[20px] bg-[var(--glass-tint)] p-4 shadow-[inset_0_0_0_1px_var(--line)]"
              >
                {m.group === "dedicated" ? (
                  <CytraMark size={22} />
                ) : (
                  <span className="spec grid size-[22px] place-items-center text-[12px] text-ink-2">{m.name.slice(0, 2)}</span>
                )}
                <span>
                  <span className="block text-[14px] font-medium text-ink">{m.name}</span>
                  <span className="block text-[11px] text-ink-3">{m.group === "dedicated" ? "专属" : m.vendor}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </section>
    </div>
  );
}
