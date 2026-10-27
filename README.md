# Cytra · 胞序

面向药企、CRO/CDMO 与 biotech **采购和研发人员**的生物制药原料咨询平台。核心是首页中央的对话框：问规格、等级、替代方案、资质文件、货期；专属模型 **Cytra Bio** 可以检索厂家库，生成可对比的厂家卡片，并一键生成询价单。附带一个 OpenAI 兼容的**多模型中转**服务。

> 本项目按上线标准构建，但**目前不对外运营**。厂家数据、价格、备案号、法务文本都是示例或模板，见文末「上线前清单」。

---

## 快速开始

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

然后浏览器打开 http://localhost:3000 。不配置任何环境变量也能完整体验：此时处于**演示模式**，回答来自预置内容，厂家卡片来自虚构的示例数据（界面会标注"演示模式"和"示例数据"）。

### 接入真实模型

```bash
cp .env.example .env.local
```

在 `.env.local` 里填写两项后重启，即可退出演示模式：

```ini
CYTRA_API_BASE_URL=https://你的中转地址/v1
CYTRA_API_KEY=sk-...
```

任何兼容 OpenAI `/v1/chat/completions` 流式协议的服务都可以（官方 API 或各类中转）。站内模型 ID 与上游模型名的对应关系用 `CYTRA_MODEL_MAP` 修改，默认值见 `lib/llm/model-routing.ts`。

### 免费方式：借用本机 OpenCode（不需要 Key）

如果你电脑上装了 [OpenCode](https://opencode.ai)，网站可以直接借用它能访问的模型，包括免费模型，不需要任何 API Key。

1. 查看可用模型：`opencode models`
2. 在 `.env.local` 写两行：
   ```ini
   CYTRA_PROVIDER=opencode
   OPENCODE_MODEL=opencode/deepseek-v4.1-flash-free
   ```
3. 开两个终端。终端 1 启动受限的 OpenCode 服务，并保持开着：
   ```bash
   npm run opencode
   ```
   终端 2 启动网站：
   ```bash
   npm run dev
   ```

工作方式：`npm run opencode` 会在 `~/.cytra-opencode` 写入一个专用的 `cytra` agent（禁用全部工具、拒绝全部权限），然后在 `127.0.0.1:4096` 启动 `opencode serve`。网站每次对话会新建一个"一律拒绝权限、关闭全部工具"的会话，拿到文字回答后立即删除这个会话。所以网页上来的任何输入，都**不能**在你电脑上执行命令或读写文件。找厂家类的问题由网站先检索厂家库，再把结果交给模型参考。

限制：只能在装了 OpenCode 的这台电脑上用，无法部署上线；免费模型的数据政策与可用性见下文"用免费模型演示"。

### 只用一个模型

设置 `CYTRA_ENABLED_MODELS=cytra-bio`，界面上的模型切换器会消失，接口也会拒绝其他模型。再用 `CYTRA_MODEL_MAP` 把 `cytra-bio` 指向你实际使用的上游模型即可。

### 用免费模型演示

无论是借用本机 OpenCode，还是用 Zen Key 直连，免费模型（如 DeepSeek V4.1 Flash Free）都只适合个人本地演示，原因有四：

1. **数据可能被用于训练。** 部分免费模型在免费期内会收集数据改进模型，这和本站隐私政策里"不用于训练"的说法冲突。对外开放前，必须换成付费、零留存的接口。
2. **随时可能下线或限流。** 免费模型多为限时提供。
3. **Key 是你个人的。** 网站一旦公开，所有访客消耗的都是你的额度。免费层是为 opencode 个人使用设计的，用它给公众网站供能是否符合条款，请以 opencode.ai 的官方条款为准。
4. **工具调用不一定支持。** 如果"找厂家"不出卡片，说明该模型不支持 function calling，换一个模型即可。

**密钥只在服务端使用**：浏览器只和本站的 `/api/chat` 通信，从不接触上游地址和 Key。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm start` | 生产构建与运行 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 单元测试（Vitest） |
| `npm run test:e2e` | 端到端测试（Playwright，需先 `npm run build`） |
| `npm run check` | lint + 类型 + 单测 + 构建，一次跑完 |
| `npm run opencode` | 启动受限的本机 OpenCode 服务（`CYTRA_PROVIDER=opencode` 时使用） |

首次运行 E2E 前执行 `npx playwright install chromium`。

## 部署

推荐 Vercel：导入仓库，在项目设置里填好环境变量，直接部署即可，无需额外配置。

自托管：`npm run build && npm start`，放在 Nginx 等反向代理之后时，关闭 `/api/chat` 的响应缓冲（路由已返回 `X-Accel-Buffering: no`），否则流式输出会卡住。

## 目录结构

```
app/
  page.tsx                 首页（对话框 + 介绍）
  c/[id]/page.tsx          对话工作台（与首页共用 Studio 组件）
  (site)/                  中转服务、关于、隐私政策、服务条款
  api/chat/route.ts        对话接口：校验 → 限流 → 上游流式 → SSE
  api/inquiry/route.ts     询价接口：校验 → 防机器人 → Webhook 投递
components/
  glass/                   WebGL 胞质背景与着色器（玻璃折射在这里实现）
  studio/                  对话框、消息、厂家卡片、询价面板、历史侧栏
  inquiry/                 询价表单（弹窗与关于页共用）
  site/ marketing/ ui/     导航、页脚、通用组件、图标
lib/
  llm/                     OpenAI 兼容流式客户端、工具调用循环、本机 OpenCode 适配器、演示回答器
  chat/                    前后端协议、对话状态 hook、本地历史存储
  suppliers/               厂家库接口与示例实现
  inquiry/                 询价表单校验规则（前后端共用）
  prompts/                 系统提示词与安全边界
config/                    站点信息、模型清单、中转价格表
data/suppliers.demo.json   虚构的示例厂家数据
tests/unit, tests/e2e      单元测试与端到端测试
```

## 关键设计

- **玻璃折射是真的算出来的。** 背景是全屏 WebGL 着色器，渲染缓慢流动的"细胞"。对话框的位置每帧传给着色器，框内的像素按圆角矩形的边缘法线做位移和轻微色散，所以在所有浏览器里都是同一种厚玻璃效果，不依赖只有 Chromium 支持的 SVG 背景滤镜。WebGL 不可用或开启了"减少动态效果"时，会自动退回静态渐变或静止画面。
- **自己实现流式协议，不用 AI SDK。** `lib/llm/openai-compatible.ts` 直接解析上游 SSE，并组装分片到达的 `tool_calls`；`lib/llm/run-chat.ts` 负责"模型 → 工具 → 模型"的循环（最多 3 轮）。中转商本来就说这个协议，代码量不大，每一行都看得懂。
- **厂家信息不允许模型编造。** 系统提示词要求厂家名只能来自 `search_suppliers` 工具的结果；中转来的通用模型不挂这个工具，也被要求不列举厂家。要接真实数据库，只需新写一个 `SupplierRepository` 实现，替换 `lib/suppliers/repository.ts` 里的示例实现。
- **对话只存在用户的浏览器里**（localStorage）。没有账号系统，服务器不保存对话内容。
- **AI 内容标识。** 每条回答都显式标注"AI 生成"，复制时自动附带来源说明，对应《人工智能生成合成内容标识办法》。

## 安全

- 环境变量启动时用 zod 校验，格式错误直接报错（`lib/env.ts`）。
- `/api/chat`、`/api/inquiry` 都做了请求体大小限制、结构校验和按 IP 限流。
- 用户断开连接或超时后，上游请求同步中止，不会继续消耗 token。
- 上游错误统一映射成用户可读的提示，不会把上游返回的细节透传给浏览器。
- 安全响应头在 `next.config.ts`：CSP、HSTS、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy` 等。
- 模型输出按 Markdown 渲染，不渲染原始 HTML，也不加载远程图片。

**关于 CSP 的取舍**：Next.js 16 的 nonce 方案会让所有页面变成动态渲染，并且和 Cache Components / 部分预渲染不兼容（见 `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`）。本项目选择官方文档里的"无 nonce"方案，保留静态预渲染：`script-src` 允许 `'unsafe-inline'`，其余资源全部限定为本站。如果安全要求高于性能要求，可以按该文档改成 `proxy.ts` 加 nonce 的方案。

## 上线前清单

下面这些目前是**示例或占位**，真正对外运营前必须处理：

- [ ] **厂家数据**：`data/suppliers.demo.json` 全部虚构。需要接入经过核实的厂家库。
- [ ] **中转价格**：`config/relay.ts` 是示例价格，接口地址 `api.cytra.example` 不存在。
- [ ] **备案**：页脚的 ICP 备案号、生成式人工智能服务备案号是占位符（`config/site.ts`）。在中国大陆向公众提供生成式 AI 服务，需要完成相应的算法备案与安全评估。
- [ ] **法务文本**：隐私政策和服务条款是模板，须由法律顾问审核。
- [ ] **限流存储**：当前限流计数存在单个进程的内存里。Serverless 或多实例部署时需要换成 Redis / Upstash（实现 `lib/rate-limit.ts` 里的 `RateLimiter` 接口即可）。
- [ ] **询价投递**：配置 `INQUIRY_WEBHOOK_URL`，否则询价只会出现在服务端日志里。
- [ ] **监控**：`app/error.tsx` 和接口里预留了上报位置，可以接入 Sentry 等错误监控。
- [ ] **主体信息**：公司名称、联系邮箱（`config/site.ts`）。
