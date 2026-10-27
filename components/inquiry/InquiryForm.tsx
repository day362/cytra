"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { GRADES } from "@/lib/suppliers/types";
import { DOCUMENT_OPTIONS, fieldErrors, inquirySchema, type InquiryInput } from "@/lib/inquiry/schema";
import { Pressable } from "@/components/ui/Pressable";
import { Check, Close } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export type InquiryPrefill = {
  material?: string;
  grade?: (typeof GRADES)[number];
  suppliers?: { id: string; name: string }[];
};

type Props = {
  kind: "rfq" | "contact";
  prefill?: InquiryPrefill;
  onRemoveSupplier?: (id: string) => void;
  onSubmitted?: (reference: string) => void;
  autoFocus?: boolean;
};

const inputClass =
  "block h-11 w-full rounded-2xl bg-[var(--glass-tint)] px-3.5 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none transition-shadow placeholder:text-ink-3 focus:shadow-[inset_0_0_0_1.5px_var(--accent)] aria-[invalid=true]:shadow-[inset_0_0_0_1.5px_var(--danger)]";

function Field({ id, label, error, optional, children }: { id: string; label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[12px] font-medium text-ink-2">
        {label}
        {optional && <span className="font-normal text-ink-3">选填</span>}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-1 text-[12px] text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Success({ reference, onReset }: { reference: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center px-2 py-10 text-center"
      role="status"
    >
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <motion.circle
          cx="36"
          cy="36"
          r="32"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M23 37l9 9 17-19"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <h3 className="mt-5 text-[18px] font-semibold text-ink">已收到你的需求</h3>
      <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-2">
        平台顾问会在 1 个工作日内通过邮件与你联系。请保留询价编号：
      </p>
      <p className="spec mt-3 rounded-full bg-[var(--line)] px-3 py-1 text-[13px] text-ink">{reference}</p>
      <Pressable onClick={onReset} className="mt-6 h-10 rounded-full px-4 text-[13px] text-ink-2 hover:bg-[var(--line)]">
        再提交一份
      </Pressable>
    </motion.div>
  );
}

export function InquiryForm({ kind, prefill, onRemoveSupplier, onSubmitted, autoFocus }: Props) {
  const uid = useId();
  // Recorded after mount: a render-time Date.now() would be frozen into the prerendered shell.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [documents, setDocuments] = useState<string[]>(["CoA", "CoO"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const suppliers = prefill?.suppliers ?? [];

  const id = (name: string) => `${uid}-${name}`;
  const a11y = (name: string) => ({
    id: id(name),
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id(name)}-error` : undefined,
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Built as a loose object and validated below; zod is the source of truth.
    const input = {
      kind,
      material: String(form.get("material") ?? ""),
      specification: String(form.get("specification") ?? ""),
      grade: String(form.get("grade") ?? "不限") as InquiryInput["grade"],
      quantity: String(form.get("quantity") ?? ""),
      documents: documents as InquiryInput["documents"],
      deliveryBy: String(form.get("deliveryBy") ?? ""),
      suppliers,
      name: String(form.get("name") ?? ""),
      company: String(form.get("company") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
      consent: form.get("consent") === "on",
      website: String(form.get("website") ?? ""),
      startedAt: startedAt.current || Date.now(),
    } satisfies Record<keyof InquiryInput, unknown>;

    const parsed = inquirySchema.safeParse(input);
    if (!parsed.success) {
      const next = fieldErrors(parsed.error);
      setErrors(next);
      const first = Object.keys(next)[0];
      document.getElementById(id(first))?.focus();
      return;
    }
    setErrors({});
    setFormError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.error?.fields) setErrors(body.error.fields);
        setFormError(body?.error?.message ?? "提交失败，请稍后重试。");
        setStatus("error");
        return;
      }
      setReference(body.reference);
      setStatus("idle");
      onSubmitted?.(body.reference);
    } catch {
      setFormError("网络异常，请检查网络后重试。");
      setStatus("error");
    }
  }

  if (reference) return <Success reference={reference} onReset={() => setReference(null)} />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="inquiry-form">
      {suppliers.length > 0 && (
        <div>
          <p className="mb-2 text-[12px] font-medium text-ink-2">意向厂家（{suppliers.length}）</p>
          <ul className="flex flex-wrap gap-1.5">
            {suppliers.map((s) => (
              <li key={s.id} className="flex h-8 items-center gap-1 rounded-full bg-[var(--accent-soft)] pr-1 pl-3 text-[12px] text-accent-strong">
                {s.name}
                {onRemoveSupplier && (
                  <button
                    type="button"
                    onClick={() => onRemoveSupplier(s.id)}
                    aria-label={`移除 ${s.name}`}
                    className="grid size-6 place-items-center rounded-full hover:bg-[var(--line)]"
                  >
                    <Close size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="mb-3 text-[13px] font-semibold text-ink">物料需求</legend>
        <Field id={id("material")} label="原料名称" error={errors.material}>
          <input {...a11y("material")} defaultValue={prefill?.material} autoFocus={autoFocus} placeholder="如：CHO 化学成分限定培养基" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id={id("grade")} label="质量等级" error={errors.grade}>
            <select {...a11y("grade")} defaultValue={prefill?.grade ?? "GMP"} className={cn(inputClass, "appearance-none")}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field id={id("quantity")} label="用量" error={errors.quantity}>
            <input {...a11y("quantity")} placeholder="如：2000 L / 年" className={inputClass} />
          </Field>
        </div>
        <Field id={id("specification")} label="规格与工艺要求" optional error={errors.specification}>
          <input {...a11y("specification")} placeholder="如：干粉，需定制补料，内毒素 < 1 EU/mL" className={inputClass} />
        </Field>
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-ink-2" id={id("documents")}>
            需要的文件
          </p>
          <div role="group" aria-labelledby={id("documents")} className="flex flex-wrap gap-1.5">
            {DOCUMENT_OPTIONS.map((d) => {
              const on = documents.includes(d);
              return (
                <Pressable
                  key={d}
                  aria-pressed={on}
                  pressScale={0.93}
                  onClick={() => setDocuments((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))}
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-full px-3 text-[12px] transition-colors duration-200",
                    on ? "bg-ink text-bg" : "text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:text-ink",
                  )}
                >
                  {on && <Check size={12} strokeWidth={2.2} />}
                  {d}
                </Pressable>
              );
            })}
          </div>
        </div>
        <Field id={id("deliveryBy")} label="期望到货" optional error={errors.deliveryBy}>
          <input {...a11y("deliveryBy")} placeholder="如：2027 年 3 月前" className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-[13px] font-semibold text-ink">联系方式</legend>
        <div className="grid grid-cols-2 gap-3">
          <Field id={id("name")} label="姓名" error={errors.name}>
            <input {...a11y("name")} autoComplete="name" className={inputClass} />
          </Field>
          <Field id={id("company")} label="公司 / 机构" error={errors.company}>
            <input {...a11y("company")} autoComplete="organization" className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id={id("email")} label="工作邮箱" error={errors.email}>
            <input {...a11y("email")} type="email" autoComplete="email" inputMode="email" className={inputClass} />
          </Field>
          <Field id={id("phone")} label="电话" optional error={errors.phone}>
            <input {...a11y("phone")} type="tel" autoComplete="tel" inputMode="tel" className={inputClass} />
          </Field>
        </div>
        <Field id={id("notes")} label="补充说明" optional error={errors.notes}>
          <textarea {...a11y("notes")} rows={3} className={cn(inputClass, "h-auto resize-none py-2.5 leading-relaxed")} />
        </Field>
      </fieldset>

      {/* Honeypot: invisible to people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          网站
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            {...a11y("consent")}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
          />
          <span>
            我已阅读并同意
            <Link href="/legal/privacy" target="_blank" className="mx-0.5 text-accent-strong underline underline-offset-2">
              隐私政策
            </Link>
            ，同意平台为对接询价使用以上联系方式。
          </span>
        </label>
        {errors.consent && (
          <p id={`${id("consent")}-error`} className="pt-1 pl-6.5 text-[12px] text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-2xl bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] px-4 py-3 text-[13px] text-danger">
          {formError}
        </p>
      )}

      <Pressable
        type="submit"
        tick
        disabled={status === "submitting"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-[15px] font-medium text-accent-ink shadow-[0_8px_20px_-8px_var(--accent)] disabled:opacity-70"
      >
        {status === "submitting" ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            正在提交
          </>
        ) : kind === "rfq" ? (
          "提交询价单"
        ) : (
          "提交需求"
        )}
      </Pressable>
    </form>
  );
}
