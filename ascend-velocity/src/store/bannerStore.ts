import { create } from "zustand";
import { getAuthedUserId, supabase, userCanWrite } from "../lib/supabase.ts";
import { toast } from "sonner";

interface BannerConfig {
  title: string;
  description: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

interface BannerStore {
  config: BannerConfig;
  initializeFromSupabase: () => Promise<void>;
  updateConfig: (newConfig: Partial<BannerConfig>) => Promise<void>;
}

const SETTINGS_BANNER_KEY = "dashboard_banner";

const DEFAULT_BANNER_CONFIG: BannerConfig = {
  title: "Painel de Gestão de Afiliados -",
  description: "Acompanhe o desempenho dos seus afiliados em tempo real",
  gradientFrom: "from-primary",
  gradientVia: "via-secondary",
  gradientTo: "to-accent",
};

const LEGACY_DEFAULT_TITLE = "Painel de Gestão de Afiliados - Aylle Duarte";



function readLegacyLocalBannerConfig(): BannerConfig | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage?.getItem("banner-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    const cfg = parsed?.state?.config;
    if (!cfg || typeof cfg !== "object") return null;
    if (typeof cfg.title !== "string" || !cfg.title.trim()) return null;

    return {
      title: String(cfg.title),
      description: typeof cfg.description === "string" ? cfg.description : DEFAULT_BANNER_CONFIG.description,
      gradientFrom: typeof cfg.gradientFrom === "string" ? cfg.gradientFrom : DEFAULT_BANNER_CONFIG.gradientFrom,
      gradientVia: typeof cfg.gradientVia === "string" ? cfg.gradientVia : DEFAULT_BANNER_CONFIG.gradientVia,
      gradientTo: typeof cfg.gradientTo === "string" ? cfg.gradientTo : DEFAULT_BANNER_CONFIG.gradientTo,
    };
  } catch {
    return null;
  }
}

async function loadUserSettings(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { settings: null as Record<string, any> | null, error };
  const settings = (data as any)?.settings as Record<string, any> | undefined;
  return { settings: settings || null, error: null };
}

async function upsertUserSettings(userId: string, settings: Record<string, any>) {
  const canWrite = await userCanWrite(userId);
  if (!canWrite) {
    toast.error("Esta funcionalidade não está disponível no seu plano atual.");
    return { data: null, error: { message: "forbidden" } } as any;
  }

  return supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
}

export const useBannerStore = create<BannerStore>()((set, get) => ({
  config: DEFAULT_BANNER_CONFIG,
  initializeFromSupabase: async () => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const { settings, error } = await loadUserSettings(userId);
    if (error) return;

    const currentSettings = settings || {};
    const existingBanner = (currentSettings as any)?.[SETTINGS_BANNER_KEY];

    if (existingBanner && typeof existingBanner === "object") {
      const merged: BannerConfig = {
        ...DEFAULT_BANNER_CONFIG,
        ...existingBanner,
      };

      set({ config: merged });

      if (!existingBanner.title || typeof existingBanner.title !== "string" || !existingBanner.title.trim()) {
        const nextSettings = { ...currentSettings, [SETTINGS_BANNER_KEY]: merged };
        await upsertUserSettings(userId, nextSettings);
      }

      return;
    }

    const legacyLocal = readLegacyLocalBannerConfig();
    const shouldMigrateLegacy =
      legacyLocal &&
      typeof legacyLocal.title === "string" &&
      legacyLocal.title.trim() &&
      legacyLocal.title !== LEGACY_DEFAULT_TITLE;

    const seed = shouldMigrateLegacy ? (legacyLocal as BannerConfig) : DEFAULT_BANNER_CONFIG;
    set({ config: seed });

    const nextSettings = { ...currentSettings, [SETTINGS_BANNER_KEY]: seed };
    await upsertUserSettings(userId, nextSettings);
  },
  updateConfig: async (newConfig) => {
    const nextConfig = { ...get().config, ...newConfig };
    set({ config: nextConfig });

    const userId = await getAuthedUserId();
    if (!userId) return;

    const { settings } = await loadUserSettings(userId);
    const currentSettings = settings || {};
    const nextSettings = { ...currentSettings, [SETTINGS_BANNER_KEY]: nextConfig };
    await upsertUserSettings(userId, nextSettings);
  },
}));
