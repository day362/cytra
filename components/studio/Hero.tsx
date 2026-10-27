"use client";

import { motion, type Variants } from "motion/react";
import type { ComponentType, ReactNode } from "react";
import { Pressable } from "@/components/ui/Pressable";
import { Clock, Factory, Shield, Swap } from "@/components/ui/icons";

export type Scenario = {
  label: string;
  prompt: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export const SCENARIOS: Scenario[] = [
  { label: "原料替代", icon: Swap, prompt: "我们目前用胎牛血清培养 Vero 细胞，想换成无血清或化学成分限定培养基，有哪些可选方案和验证要点？" },
  { label: "资质核查", icon: Shield, prompt: "采购 GMP 级重组胰蛋白酶，需要供应商提供哪些资质与文件（如 DMF、CoA、TSE/BSE 声明）？" },
  { label: "货期评估", icon: Clock, prompt: "Protein A 亲和层析填料目前常见的供货周期是多久？怎么降低断供风险？" },
  { label: "找厂家", icon: Factory, prompt: "帮我找能供应 GMP 级、无动物源 CHO 细胞培养基的厂家，年用量约 2000 L。" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  // filter must end as "none": any filter on an ancestor disables backdrop-filter on the glass inside.
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    transitionEnd: { filter: "none" },
  },
};

type Props = {
  composer: ReactNode;
  onScenario: (scenario: Scenario) => void;
};

export function Hero({ composer, onScenario }: Props) {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="relative mx-auto flex min-h-[100svh] w-full max-w-[760px] flex-col items-center justify-center px-4 pt-28 pb-24"
      aria-labelledby="hero-title"
    >
      <motion.p
        variants={item}
        className="glass mb-7 flex h-8 items-center gap-2 rounded-full pr-3.5 pl-2.5 text-[12px] text-ink-2"
      >
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-accent" />
        </span>
        Cytra Bio · 生物制药原料专属模型
      </motion.p>

      <motion.h1
        id="hero-title"
        variants={item}
        className="text-center text-[clamp(40px,7.4vw,76px)] leading-[1.08] font-semibold tracking-[-0.035em] text-ink"
      >
        原料的事，
        <span className="bg-[linear-gradient(120deg,var(--ink)_10%,var(--accent-strong)_55%,var(--ink-2)_95%)] bg-clip-text text-transparent">
          问胞序。
        </span>
      </motion.h1>

      <motion.p variants={item} className="mt-5 max-w-[540px] text-center text-[16px] leading-[1.75] text-ink-2 text-pretty">
        规格、等级、替代方案、资质文件与货期，一次问清。为药企、CRO/CDMO 与 biotech 的采购和研发而生。
      </motion.p>

      <motion.div variants={item} className="mt-10 w-full">
        {composer}
      </motion.div>

      <motion.ul variants={item} className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center" aria-label="常见场景">
        {SCENARIOS.map((s) => (
          <li key={s.label}>
            <Pressable
              onClick={() => onScenario(s)}
              pressScale={0.94}
              className="glass flex h-10 w-full items-center justify-center gap-1.5 rounded-full px-3.5 sm:h-9 sm:w-auto text-[13px] text-ink-2 transition-colors hover:text-ink"
            >
              <s.icon size={15} className="text-accent" />
              {s.label}
            </Pressable>
          </li>
        ))}
      </motion.ul>

      <motion.p variants={item} className="absolute bottom-8 text-[11px] text-ink-3">
        内容由 AI 生成，仅供参考
      </motion.p>
    </motion.section>
  );
}
