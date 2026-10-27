#!/usr/bin/env node
/**
 * Starts a local, locked-down OpenCode server for CYTRA_PROVIDER=opencode.
 *
 * Runs OpenCode from its own directory (~/.cytra-opencode by default), outside
 * any git repository, so no project AGENTS.md or code leaks into prompts, and
 * writes a `cytra` agent there with every tool disabled and every permission
 * denied. The site additionally denies permissions per session.
 *
 *   npm run opencode            # port 4096
 *   npm run opencode -- 4100    # custom port (match OPENCODE_URL)
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const port = process.argv[2] ?? "4096";
const dir = process.env.CYTRA_OPENCODE_DIR ?? join(homedir(), ".cytra-opencode");

const tools = Object.fromEntries(
  ["bash", "edit", "write", "read", "glob", "grep", "list", "patch", "multiedit", "todowrite", "todoread",
    "webfetch", "websearch", "codesearch", "task", "skill", "question", "lsp"].map((t) => [t, false]),
);

const config = {
  $schema: "https://opencode.ai/config.json",
  default_agent: "cytra",
  permission: "deny",
  tools,
  agent: {
    cytra: {
      mode: "primary",
      description: "胞序网站对话模型：只输出文字回答，没有任何工具权限",
      prompt:
        "你是胞序（Cytra）网站后端调用的对话模型。严格遵循每次请求附带的系统指示，只输出给最终用户看的回答正文。你没有任何工具，不能读写文件或执行命令，也不要提及代码仓库、文件或工具。",
      tools,
      permission: "deny",
      steps: 1,
    },
  },
};

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "opencode.json"), `${JSON.stringify(config, null, 2)}\n`);

console.log(`[cytra] OpenCode 工作目录：${dir}`);
console.log(`[cytra] 已写入受限 agent "cytra"（禁用全部工具与权限）`);
console.log(`[cytra] 启动 opencode serve，端口 ${port}。保持这个窗口开着，另开一个终端运行 npm run dev。\n`);

const child = spawn("opencode", ["serve", "--port", port, "--hostname", "127.0.0.1"], { cwd: dir, stdio: "inherit" });
child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("[cytra] 找不到 opencode 命令。请先安装：npm i -g opencode-ai，或参考 https://opencode.ai");
  } else {
    console.error("[cytra] 启动失败：", err.message);
  }
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
