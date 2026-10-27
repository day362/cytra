import { expect, test } from "@playwright/test";

test("sends security headers", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).not.toContain("unsafe-eval");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("WebGL field starts and the hero composer is the lens", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas[data-ready=true]")).toBeAttached();
  await expect(page.locator("html")).toHaveAttribute("data-gl", "on");
  await expect(page.getByTestId("composer")).toHaveAttribute("data-lens-radius", "30");
});

test("reduced motion still renders a still field", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas[data-ready=true]")).toBeAttached();
});

test("theme toggle cycles and persists", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /外观/ });
  await toggle.click(); // system -> light
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await toggle.click(); // light -> dark
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("model picker is keyboard operable", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("model-picker").focus();
  await page.keyboard.press("ArrowDown");
  const list = page.getByRole("listbox", { name: "选择模型" });
  await expect(list).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(list).toBeHidden();
  await expect(page.getByTestId("model-picker")).toContainText("GPT");
});

test("chat API rejects malformed requests", async ({ request }) => {
  const res = await request.post("/api/chat", { data: { model: "nope", messages: [] } });
  expect(res.status()).toBe(400);
  expect((await res.json()).error.code).toBe("bad_request");
});
