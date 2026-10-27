import { getServerEnv } from "@/lib/env";
import { fieldErrors, inquirySchema, MIN_FILL_MS } from "@/lib/inquiry/schema";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { newId } from "@/lib/chat/types";

const limiter = new MemoryRateLimiter(getServerEnv().RATE_LIMIT_INQUIRY_PER_HOUR, 3_600_000);
const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: Request) {
  const rate = limiter.take(clientKey(request));
  if (!rate.ok) {
    return Response.json(
      { error: { message: "提交过于频繁，请稍后再试。" } },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return Response.json({ error: { message: "内容过长。" } }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: { message: "请求格式不正确。" } }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { message: "请检查表单内容。", fields: fieldErrors(parsed.error) } }, { status: 422 });
  }

  const inquiry = parsed.data;
  const reference = `RFQ-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${newId().slice(0, 5).toUpperCase()}`;

  // Bots: pretend success so they learn nothing, but drop the submission.
  if (inquiry.website || Date.now() - inquiry.startedAt < MIN_FILL_MS) {
    return Response.json({ ok: true, reference });
  }

  const record = {
    reference,
    receivedAt: new Date().toISOString(),
    kind: inquiry.kind,
    material: inquiry.material,
    specification: inquiry.specification,
    grade: inquiry.grade,
    quantity: inquiry.quantity,
    documents: inquiry.documents,
    deliveryBy: inquiry.deliveryBy,
    suppliers: inquiry.suppliers,
    contact: { name: inquiry.name, company: inquiry.company, email: inquiry.email, phone: inquiry.phone },
    notes: inquiry.notes,
  };

  const webhook = getServerEnv().INQUIRY_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } catch (error) {
      console.error("[api/inquiry] webhook failed", error);
      return Response.json({ error: { message: "提交失败，请稍后重试或发邮件联系我们。" } }, { status: 502 });
    }
  } else {
    // No delivery channel configured (demo). Log without contact details.
    console.info("[api/inquiry] received", { reference, kind: record.kind, material: record.material, suppliers: record.suppliers.length });
  }

  return Response.json({ ok: true, reference });
}
