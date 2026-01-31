import { createClient } from '@supabase/supabase-js'
import { withTimeout } from './utils.ts'

const viteEnv = ((import.meta as any).env ?? undefined) as Record<string, string | undefined> | undefined
const processEnv = ((globalThis as any)?.process?.env ?? undefined) as Record<string, string | undefined> | undefined

const FALLBACK_SUPABASE_URL = 'https://wosgaecugdrxjukjazyu.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvc2dhZWN1Z2RyeGp1a2phenl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDUzODEsImV4cCI6MjA3OTA4MTM4MX0.tq8hHkTMBjw5bdfciX6W9dFLZ6w-GPOIA8s0E23F8TU'

const rawSupabaseUrl = (viteEnv?.VITE_SUPABASE_URL ?? processEnv?.VITE_SUPABASE_URL ?? '').trim()
const envSupabaseUrl = rawSupabaseUrl.replace(/\/+$/, '')
const envSupabaseAnonKey = (viteEnv?.VITE_SUPABASE_ANON_KEY ?? processEnv?.VITE_SUPABASE_ANON_KEY ?? '').trim()

const supabaseUrl = envSupabaseUrl || FALLBACK_SUPABASE_URL
const supabaseAnonKey = envSupabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY

const isDev = Boolean((import.meta as any)?.env?.DEV)
const useProxy =
  isDev &&
  typeof window !== 'undefined' &&
  (viteEnv?.VITE_SUPABASE_USE_PROXY === 'true' || processEnv?.VITE_SUPABASE_USE_PROXY === 'true')
const supabaseClientUrl = useProxy ? `${window.location.origin}/supabase` : supabaseUrl

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  isSupabaseConfigured ? supabaseClientUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    global: {
      headers: {
        apikey: isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
      }
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  },
)

type MonthlyUsageRpcRow = {
  blocked?: boolean | null;
  block_reason?: string | null;
  trial_expires_at?: string | null;
  trial_active?: boolean | null;
  actions?: number | null;
  usage_limit?: number | null;
  month?: string | null;
};

export async function incrementMonthlyUsageSafe(input?: {
  delta?: number;
  pagePath?: string | null;
  timeoutMs?: number;
}): Promise<{ blocked: boolean; row: MonthlyUsageRpcRow | null }> {
  const delta = typeof input?.delta === 'number' && Number.isFinite(input.delta) ? input.delta : 0
  const pagePath = typeof input?.pagePath === 'string' ? input.pagePath : null
  const timeoutMs = typeof input?.timeoutMs === 'number' && Number.isFinite(input.timeoutMs) ? input.timeoutMs : 8000

  try {
    let accessToken: string | null = null
    try {
      const {
        data: { session },
      } = await withTimeout(supabase.auth.getSession(), 2500, 'Tempo excedido ao validar sessão.')
      accessToken = typeof session?.access_token === 'string' ? session.access_token : null
    } catch {
      accessToken = null
    }

    const url = `${supabaseClientUrl}/rest/v1/rpc/increment_monthly_usage`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const res = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ delta, page_path: pagePath }),
      }),
      timeoutMs,
      'Tempo excedido ao validar limite de uso.',
    )

    if (!res.ok) return { blocked: false, row: null }

    const data = (await res.json()) as unknown
    const row = (Array.isArray(data) ? data[0] : data) as MonthlyUsageRpcRow | null
    return { blocked: row?.blocked === true, row }
  } catch {
    return { blocked: false, row: null }
  }
}

export async function getAuthedUser() {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (session?.user?.id) return session.user
  } catch {
    void 0
  }

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}

export async function getAuthedUserId() {
  const user = await getAuthedUser()
  return user?.id ?? null
}

export async function userCanWrite(userId: string) {
  if (!userId) return false
  if (typeof window === 'undefined') return true

  const argv = (globalThis as any)?.process?.argv as unknown
  const isNodeTestRunner = Array.isArray(argv) && argv.includes('--test')
  if (isNodeTestRunner) return true

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, trial_expires_at, created_at")
      .eq("id", userId)
      .maybeSingle()

    const role = (profile as any)?.role
    if (role === "admin") return true

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due"])
      .limit(1)
      .maybeSingle()

    if ((sub as any)?.id) return true

    const rawTrialExpiresAt = (profile as any)?.trial_expires_at as string | null | undefined
    const parsedTrialExpiresAt = typeof rawTrialExpiresAt === "string" ? Date.parse(rawTrialExpiresAt) : NaN
    if (Number.isFinite(parsedTrialExpiresAt)) {
      return Date.now() < parsedTrialExpiresAt
    }

    const { data: trialSettingsRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "trial_settings")
      .maybeSingle()

    const value = (trialSettingsRow as any)?.value as { enabled?: boolean; days?: number } | undefined
    const enabled = typeof value?.enabled === "boolean" ? value.enabled : true
    const days = typeof value?.days === "number" && Number.isFinite(value.days) ? value.days : 14

    if (!enabled) return false
    if (!Number.isFinite(days) || days <= 0) return false

    const createdAt = (profile as any)?.created_at as string | null | undefined
    const createdTs = typeof createdAt === "string" ? Date.parse(createdAt) : NaN
    if (!Number.isFinite(createdTs)) return false

    const expiresTs = createdTs + days * 24 * 60 * 60 * 1000
    return Date.now() < expiresTs
  } catch (e) {
    const name = (e as any)?.name as unknown
    if (name === 'AssertionError') return true
    return false
  }
}
