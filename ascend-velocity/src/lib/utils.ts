import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeToolIdList(raw: string): string[] {
  const parts = String(raw)
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  const out: string[] = [];
  const seen = new Set<string>();

  for (const p of parts) {
    if (p.length > 128) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= 200) break;
  }

  return out;
}

export function normalizeToolsDisabledByPage(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const out: Record<string, string[]> = {};
  const entries = Object.entries(raw as Record<string, unknown>);

  for (const [pageKeyRaw, toolListRaw] of entries) {
    const pageKey = String(pageKeyRaw).trim();
    if (!pageKey) continue;
    if (pageKey !== "*" && !pageKey.startsWith("/dashboard")) continue;

    const list = Array.isArray(toolListRaw) ? toolListRaw : [];
    const toolIds = normalizeToolIdList(
      list
        .filter((v) => typeof v === "string")
        .map((v) => (v as string).trim())
        .join("\n"),
    );
    if (toolIds.length === 0) continue;
    out[pageKey] = toolIds;
  }

  return out;
}

export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message?: string): Promise<T> {
  const ms = Number.isFinite(timeoutMs) ? Math.max(0, Math.floor(timeoutMs)) : 0;
  const workPromise = Promise.resolve(promise);
  if (ms <= 0) return await workPromise;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message || "Tempo excedido."));
    }, ms);
  });

  try {
    return await Promise.race([workPromise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
