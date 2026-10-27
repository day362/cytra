import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { PageHeader } from "@/components/marketing/PageHeader";
import { Reveal } from "@/components/marketing/Reveal";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "关于",
  description: "胞序 Cytra 为生物制药采购与研发人员提供原料咨询与厂家对接。提交需求，顾问 1 个工作日内联系你。",
};

const principles = [
  { k: "01", title: "不编造", body: "厂家信息只来自经过核实的厂家库。模型不知道的，就说不知道，并转给人工顾问。" },
  { k: "02", title: "讲依据", body: "每个建议都尽量落到具体的药典条目、法规文件或工艺参数上，方便你在内部评审时引用。" },
  { k: "03", title: "护隐私", body: "对话默认只保存在你的浏览器里；询价时，厂家看不到你的联系方式，由平台居中对接。" },
];

const steps = [
  { title: "描述需求", body: "在对话里说清原料、等级、用量与文件要求，或直接填写下方表单。" },
  { title: "资质核实", body: "顾问核对候选厂家的 GMP 状态、文件完整度与供货能力。" },
  { title: "报价对比", body: "整理成可对比的报价单，标出货期与风险点。" },
  { title: "样品与审计", body: "协助安排样品测试与供应商审计，直到你签下第一单。" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="关于胞序" title="让每一次原料采购，都有据可依。">
        生物制药的原料选错一次，代价往往是数月的验证和一次补充申报。胞序把行业经验、法规知识和厂家网络放进一个对话框，帮你在下单前把问题问透。
      </PageHeader>

      <section className="mx-auto max-w-[1080px] px-4" aria-label="原则">
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal key={p.k} delay={i * 0.08}>
              <div className="glass h-full rounded-[26px] p-7">
                <p className="spec text-[12px] text-accent-strong">{p.k}</p>
                <h2 className="mt-3 text-[19px] font-semibold text-ink">{p.title}</h2>
                <p className="mt-2 text-[14px] leading-[1.75] text-ink-2">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 pt-24" aria-labelledby="process-title">
        <Reveal>
          <h2 id="process-title" className="text-center text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-ink">询价对接怎么进行</h2>
        </Reveal>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <li className="h-full rounded-[24px] p-6 shadow-[inset_0_0_0_1px_var(--line-strong)]">
                <span className="spec grid size-8 place-items-center rounded-full bg-ink text-[12px] text-bg">{i + 1}</span>
                <h3 className="mt-4 text-[16px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.75] text-ink-2">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="inquiry" className="mx-auto grid max-w-[1080px] scroll-mt-28 gap-10 px-4 pt-24 md:grid-cols-[1fr_1.15fr]" aria-labelledby="inquiry-heading">
        <Reveal>
          <h2 id="inquiry-heading" className="text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-ink">提交需求</h2>
          <p className="mt-3 text-[15px] leading-[1.8] text-ink-2">
            找厂家、要报价、申请模型中转测试额度，都可以在这里提交。顾问会在 1 个工作日内通过邮件联系你。
          </p>
          <p className="mt-6 text-[13px] text-ink-3">
            也可以直接发邮件至{" "}
            <a href={`mailto:${site.contactEmail}`} className="text-accent-strong underline underline-offset-2">
              {site.contactEmail}
            </a>
          </p>
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          <div className="glass glass-strong rounded-[30px] p-6 sm:p-8">
            <InquiryForm kind="contact" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
