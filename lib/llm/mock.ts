import type { ModelOption } from "@/config/models";
import type { StreamEvent } from "@/lib/chat/protocol";
import type { SupplierRepository } from "@/lib/suppliers/repository";
import { SUPPLIER_INTENT, supplierQueryFrom } from "@/lib/suppliers/intent";
import type { SupplierQuery } from "@/lib/suppliers/types";

/**
 * Demo responder used when no upstream API is configured.
 * Streams pre-written, domain-accurate answers with realistic pacing so the
 * full product — including supplier cards — can be experienced offline.
 */

type Script = { before: string; query?: SupplierQuery; after?: string };

function scriptFor(text: string, model: ModelOption): Script {
  if (SUPPLIER_INTENT.test(text)) {
    if (!model.supplierTools) {
      return {
        before: `${model.name} 是经中转接入的通用模型，**无法检索胞序厂家库**，为避免给出不可靠的厂家信息，这里不列举具体厂家。

建议在左下角切换到 **Cytra Bio** 专属模型再问一次，它会从厂家库返回可对比的厂家卡片，并能一键生成询价单。

在此之前，可以先准备好这几项信息，询价会更高效：

| 项目 | 示例 |
| --- | --- |
| 原料与规格 | CHO 化学成分限定培养基，干粉 |
| 质量等级 | GMP，需无动物源声明 |
| 用量与频次 | 年用量约 2000 L，按季度交付 |
| 必需文件 | CoA、CoO、DMF 授权信、变更通知协议 |
| 目标市场 | 中国 + 美国申报 |`,
      };
    }
    const query = supplierQueryFrom(text)!;
    const { grade, animal_origin_free: aof } = query;
    return {
      before: `好的，我先按你的需求检索厂家库${grade ? `（等级：${grade}${aof ? "，无动物源" : ""}）` : ""}。`,
      query,
      after: `> 以上为**示例数据**，用于演示检索与比价流程，并非真实企业。

**怎么看这几家：**

1. **货期**：国产厂家通常 2–6 周，进口产品还要额外计入清关时间。年度用量稳定的话，可以签框架协议、做批次预留。
2. **文件完整度**：申报用途优先看是否能提供 **DMF 授权信** 和**变更通知协议**。缺少后者，供应商一旦变更工艺，你这边可能需要补做可比性研究。
3. **双供应商策略**：关键原料建议一主一备。备选厂家在工艺开发阶段就做小试桥接，后期切换成本最低。

需要的话，勾选卡片上的「加入询价」，我会把规格、等级和用量整理成询价单，由平台为你对接。`,
    };
  }

  if (/替代|血清|FBS|无血清|换成/.test(text)) {
    return {
      before: `从含血清体系切换到无血清或化学成分限定（CD）体系，核心是**分阶段降血清 + 关键质量属性的可比性验证**。

**可选路线：**

| 路线 | 适用场景 | 主要风险 |
| --- | --- | --- |
| 商业化无血清培养基直接驯化 | 细胞系成熟、时间紧 | 黏附与生长速度下降 |
| 血清替代物（重组白蛋白、转铁蛋白、胰岛素等） | 保留原培养基骨架 | 成本上升，批间差 |
| 化学成分限定 + 补料定制 | 商业化工艺、申报要求高 | 开发周期长 |

**验证要点：**

- **驯化方式**：按 10% → 5% → 2% → 0% 逐步降血清，每一步至少传代 2–3 代、活率稳定在 90% 以上再进入下一步。
- **可比性**：比较细胞生长曲线、代谢物（葡萄糖、乳酸、氨），以及产物的关键质量属性（滴度、糖型、电荷变体）。疫苗类还要看病毒滴度和抗原含量。
- **法规文件**：去除动物源成分后要更新 TSE/BSE 风险评估，并向新供应商索取**无动物源声明**和 CoO。
- **黏附细胞**（如 Vero）：通常要配合微载体或包被基质，单换培养基往往不够。

告诉我细胞类型、当前血清浓度和产品阶段（研发、临床还是商业化），我可以给出更具体的切换计划。`,
    };
  }

  if (/资质|DMF|CoA|文件|审计|登记|TSE|BSE|证书/.test(text)) {
    return {
      before: `申报用途的关键原料，建议按下面这份文件清单向供应商索取，**越早拿到越好**，别等审计时再补：

| 文件 | 作用 | 备注 |
| --- | --- | --- |
| **CoA**（检验报告） | 批次放行依据 | 核对检测项是否覆盖你的质量标准 |
| **CoO**（原产地证明） | 追溯与关税 | 动物源成分还要写明来源国 |
| **TSE/BSE 声明** | 动物源风险评估 | 参照 EMA/410/01 |
| **无动物源声明** | AOF 物料证明 | 需覆盖整个生产链，不只是成品配方 |
| **DMF 授权信 / CDE 登记号** | 关联审评 | 美国申报要 LoA，国内看原辅包登记状态 |
| **变更通知协议** | 控制供应商变更风险 | 建议约定至少提前 6–12 个月通知 |
| 可提取物 / 浸出物数据 | 一次性耗材、填料 | 结合工艺条件评估 |
| 内毒素、生物负荷、残留检测方法 | 工艺相关杂质 | 酶类要关注宿主残留 |

**实操建议：**

- 首次引入时做一次**供应商审计**（现场或问卷），重点看变更控制和偏差管理。
- 先确认用途：同一种原料，GMP 级与 RUO 级的文件包差别很大，RUO 级通常拿不到 DMF 支持。

告诉我具体是哪类原料、用于哪个申报市场，我可以把清单精简到必需项。`,
    };
  }

  if (/货期|周期|交期|断供|库存|多久/.test(text)) {
    return {
      before: `货期因供应商、批量和是否定制差异很大，下面是**常见区间**，仅供做计划参考：

| 品类 | 国产常见货期 | 进口常见货期 | 影响因素 |
| --- | --- | --- | --- |
| 细胞培养基（标准品） | 2–6 周 | 6–12 周 | 干粉/液体、定制配方 |
| 层析填料（如 Protein A） | 4–12 周 | 8–20 周 | 批量、配基产能 |
| 工具酶 | 2–4 周 | 4–10 周 | GMP 级排产 |
| 一次性袋与组件 | 4–10 周 | 8–16 周 | 定制设计确认 |
| 药用辅料 | 2–4 周 | 4–8 周 | 多药典检测 |

**降低断供风险：**

1. **安全库存**：按「货期 × 月用量 × 1.5」估算，填料这类高价值物料可以和供应商谈寄售。
2. **框架协议 + 滚动预测**：每季度更新 6–12 个月的需求预测，换取产能预留。
3. **双供应商**：在工艺开发阶段就完成第二来源的桥接研究。
4. **批次预留**：同一批次多预留一些，减少批间差带来的重复验证。

需要的话，我可以根据你的年用量帮你测算安全库存。`,
    };
  }

  return {
    before: `我是 Cytra Bio，专注生物制药原材料。可以帮你：

- **选型与替代**：培养基、血清替代物、工具酶、层析填料、过滤与一次性耗材、药用辅料
- **质量与文件**：GMP 与 RUO 的区别、药典要求（USP/EP/ChP）、DMF 与 CDE 登记、CoA/TSE/BSE 等文件
- **采购与对接**：货期评估、双供应商策略，以及从厂家库检索并生成询价单

为了给出准确建议，能补充两点吗？

1. 你关注的是哪类原料，用在哪个工艺阶段（上游、下游还是制剂）？
2. 产品处于什么阶段：研发、临床还是商业化？目标申报市场是哪里？`,
  };
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** Breaks text into small, natural-feeling chunks (keeps markdown table rows mostly intact). */
function* chunks(text: string): Generator<string> {
  let i = 0;
  while (i < text.length) {
    const size = 2 + Math.floor(Math.random() * 5);
    yield text.slice(i, i + size);
    i += size;
  }
}

async function* streamText(text: string, signal: AbortSignal, pace: number): AsyncGenerator<StreamEvent> {
  for (const delta of chunks(text)) {
    await sleep((14 + Math.random() * 26) * pace, signal);
    yield { type: "text", delta };
  }
}

export async function* runMockChat(opts: {
  model: ModelOption;
  lastUserMessage: string;
  repo: SupplierRepository;
  signal: AbortSignal;
  /** Multiplier for the artificial typing delays; 0 in tests. */
  pace?: number;
}): AsyncGenerator<StreamEvent> {
  const pace = opts.pace ?? 1;
  const script = scriptFor(opts.lastUserMessage, opts.model);
  // "Thinking" pause before the first token.
  await sleep(650 * pace, opts.signal);
  if (!opts.model.supplierTools && !SUPPLIER_INTENT.test(opts.lastUserMessage)) {
    yield* streamText(`*演示模式：以下为预置回答，接入 API 后将由 ${opts.model.name} 实时生成。*\n\n`, opts.signal, pace);
  }
  yield* streamText(script.before, opts.signal, pace);

  if (script.query) {
    await sleep(900 * pace, opts.signal);
    const result = await opts.repo.search(script.query);
    yield { type: "suppliers", result };
    if (result.suppliers.length === 0) {
      yield* streamText(
        "\n\n厂家库里暂时没有匹配的结果。你可以换个说法（如通用名、英文名），或者直接提交询价单，由平台人工为你寻找。",
        opts.signal,
        pace,
      );
    } else if (script.after) {
      await sleep(300 * pace, opts.signal);
      yield* streamText(`\n\n${script.after}`, opts.signal, pace);
    }
  }
  yield { type: "done", reason: "stop" };
}
