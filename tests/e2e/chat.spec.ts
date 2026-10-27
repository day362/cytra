import { expect, test } from "@playwright/test";

test("supplier search → inquiry submission (demo mode)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "找厂家" }).click();
  await page.getByTestId("send-button").click();

  await expect(page).toHaveURL(/\/c\/c_/);
  await expect(page.getByText("AI 生成").first()).toBeVisible();

  const cards = page.getByTestId("supplier-card");
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[aria-busy=true]")).toHaveCount(0, { timeout: 45_000 });

  await cards.nth(0).getByRole("button", { name: /加入询价/ }).click();
  await cards.nth(1).getByRole("button", { name: /加入询价/ }).click();
  await page.getByTestId("inquiry-tray").click();

  const dialog = page.getByRole("dialog", { name: "询价单" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/意向厂家（2）/)).toBeVisible();
  await dialog.getByLabel("用量").fill("2000 L / 年");
  await dialog.getByLabel("姓名").fill("测试");
  await dialog.getByLabel("公司 / 机构").fill("示例药业");
  await dialog.getByLabel("工作邮箱").fill("qa@example.com");

  await dialog.getByRole("button", { name: "提交询价单" }).click();
  await expect(dialog.getByText("请阅读并同意隐私政策")).toBeVisible();

  await dialog.locator('input[name="consent"]').check();
  await dialog.getByRole("button", { name: "提交询价单" }).click();
  await expect(dialog.getByText("已收到你的需求")).toBeVisible();
  await expect(dialog.getByText(/RFQ-\d{6}-/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("stop generation, history survives reload, IME enter does not send", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "描述你的原料问题" });
  await input.fill("Protein A 填料的货期一般多久？");

  // Enter while an IME is composing must not submit.
  await input.dispatchEvent("keydown", { key: "Enter", isComposing: true, keyCode: 229 });
  await expect(page).toHaveURL(/\/$/);

  await input.press("Enter");
  await expect(page).toHaveURL(/\/c\//);
  await page.getByRole("button", { name: "停止生成" }).click({ timeout: 10_000 });
  await expect(page.getByText("已停止生成")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("navigation", { name: "历史对话" }).getByText("Protein A 填料的货期")).toBeVisible();
  await expect(page.getByText("Protein A 填料的货期一般多久？").last()).toBeVisible();
});

test("unknown conversation shows a recoverable empty state", async ({ page }) => {
  await page.goto("/c/c_missing");
  await expect(page.getByText("没有找到这段对话")).toBeVisible();
  await page.getByRole("button", { name: "开始新对话" }).click();
  await expect(page).toHaveURL(/\/$/);
});
