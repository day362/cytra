import type { Metadata } from "next";
import Link from "next/link";
import { CodeTabs } from "@/components/marketing/CodeTabs";
import { Faq } from "@/components/marketing/Faq";
import { PageHeader } from "@/components/marketing/PageHeader";
import { Reveal } from "@/components/marketing/Reveal";
import { ArrowRight, Layers, Shield, Spark } from "@/components/ui/icons";
import { RELAY_BASE_URL, RELAY_MODELS } from "@/config/relay";

export const metadata: Metadata = {
  title: "模型中转",
  description: "OpenAI 兼容接口，一个 Key 调用主流大模型与胞序生物专属模型。按量计费，国内直连。",
};

const features = [
  { icon: Layers, title: "OpenAI 兼容", body: "沿用现有 SDK，只改 base_url 与 api_key，几分钟完成迁移。" },
  { icon: Spark, title: "一个 Key，多家模型", body: "通用模型与 Cytra Bio 专属模型统一计费、统一用量看板。" },
  { icon: Shield, title: "数据不留存", body: "请求内容默认不用于训练、不落盘，仅保留计费所需的用量记录。" },
];

const code = [
  {
    label: "cURL",
    code: `curl ${RELAY_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $CYTRA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "cytra-bio",
    "messages": [{"role": "user", "content": "Protein A 填料怎么选？"}],
    "stream": true
  }'`,
  },
  {
    label: "Python",
    code: `from openai import OpenAI

client = OpenAI(base_url="${RELAY_BASE_URL}", api_key="sk-...")

stream = client.chat.completions.create(
    model="cytra-bio",
    messages=[{"role": "user", "content": "Protein A 填料怎么选？"}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
  },
  {
    label: "Node.js",
    code: `import OpenAI from "openai";

const client = new OpenAI({ baseURL: "${RELAY_BASE_URL}", apiKey: process.env.CYTRA_API_KEY });

const stream = await client.chat.completions.create({
  model: "cytra-bio",
  messages: [{ role: "user", content: "Protein A 填料怎么选？" }],
  stream: true,
});
for await (const chunk of stream) process.stdout.write(chunk.choices[0]?.delta?.content ?? "");`,
  },
];

const faq = [
  { q: "中转和直接调用官方接口有什么区别？", a: "接口格式完全兼容。区别在于：统一一个 Key 和账单、国内网络直连、可以调用 Cytra Bio 专属模型和厂家库工具。若你所在机构有数据出境合规要求，请先与我们确认部署区域。" },
  { q: "价格怎么计算？", a: "按输入、输出 token 分别计费，价格见上表（当前为示例价格，以签约报价为准）。流式与非流式同价，失败请求不计费。" },
  { q: "我的数据会被用于训练吗？", a: "不会。请求内容不用于训练、默认不落盘，只保留计费所需的 token 用量和时间戳，具体见隐私政策。" },
  { q: "有速率限制吗？", a: "默认每个 Key 每分钟 60 次请求，企业用户可申请提升。超限时返回 HTTP 429 与 Retry-After 头。" },
  { q: "如何开通？", a: "目前采用邀请制。提交需求后，顾问会在 1 个工作日内联系你开通测试额度。" },
];

export default function RelayPage() {
  return (
    <>
      <PageHeader eyebrow="附带服务 · 模型中转" title="一个接口，调用所有主流模型。">
        OpenAI 兼容协议，按量计费。原料问题交给 Cytra Bio，写报告、读文献交给通用模型。
      </PageHeader>

      <section className="mx-auto max-w-[1080px] px-4" aria-label="服务特点">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="glass h-full rounded-[26px] p-6">
                <f.icon size={20} className="text-accent" />
                <h2 className="mt-4 text-[17px] font-semibold text-ink">{f.title}</h2>
                <p className="mt-2 text-[14px] leading-[1.75] text-ink-2">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 pt-24" aria-labelledby="pricing-title">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="pricing-title" className="text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-ink">模型与价格</h2>
              <p className="mt-2 text-[13px] text-ink-3">单位：元 / 百万 tokens。当前为示例价格，以签约报价为准。</p>
            </div>
            <p className="spec rounded-full bg-[var(--line)] px-3 py-1.5 text-[12px] text-ink-2">{RELAY_BASE_URL}</p>
          </div>
          <div className="glass mt-8 overflow-x-auto rounded-[28px]">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead>
                <tr className="text-[12px] text-ink-3">
                  <th scope="col" className="px-6 py-4 font-medium">模型</th>
                  <th scope="col" className="px-6 py-4 font-medium">提供方</th>
                  <th scope="col" className="px-6 py-4 font-medium">上下文</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">输入</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">输出</th>
                </tr>
              </thead>
              <tbody>
                {RELAY_MODELS.map((m) => (
                  <tr key={m.name} className="border-t border-line">
                    <td className="px-6 py-4">
                      <span className="spec text-ink">{m.name}</span>
                      <span className="ml-2 inline-flex gap-1 align-middle">
                        {m.tags.map((t) => (
                          <span key={t} className={t === "专属" ? "rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] text-accent-strong" : "rounded-full px-2 py-0.5 text-[11px] text-ink-3 shadow-[inset_0_0_0_1px_var(--line-strong)]"}>
                            {t}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-2">{m.vendor}</td>
                    <td className="spec px-6 py-4 text-ink-2">{m.context}</td>
                    <td className="spec px-6 py-4 text-right text-ink">¥{m.input}</td>
                    <td className="spec px-6 py-4 text-right text-ink">¥{m.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1080px] gap-10 px-4 pt-24 md:grid-cols-[1fr_1.3fr] md:items-center" aria-labelledby="quickstart-title">
        <Reveal className="min-w-0">
          <h2 id="quickstart-title" className="text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-ink">三行代码接入。</h2>
          <p className="mt-3 text-[15px] leading-[1.8] text-ink-2">已经在用 OpenAI SDK？把 base_url 换成胞序的地址，模型名换成上表任意一个即可。流式输出、工具调用全部兼容。</p>
          <Link href="/about#inquiry" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-bg transition-transform active:scale-95">
            申请测试额度 <ArrowRight size={16} />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          <CodeTabs tabs={code} />
        </Reveal>
      </section>

      <section className="mx-auto max-w-[760px] px-4 pt-24" aria-labelledby="faq-title">
        <Reveal>
          <h2 id="faq-title" className="mb-8 text-center text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-ink">常见问题</h2>
          <Faq items={faq} />
        </Reveal>
      </section>
    </>
  );
}
