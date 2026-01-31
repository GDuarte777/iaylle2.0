import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { supabase } from "../lib/supabase.ts";

describe("Banner do Dashboard", () => {
  it("deve definir título padrão, persistir no banco e preservar personalização", async () => {
    const db = new Map<string, any>();
    let currentUserId: string | null = "u1";

    mock.method(supabase.auth, "getUser", async () => ({
      data: {
        user: currentUserId ? { id: currentUserId } : null,
      },
    }));

    mock.method(supabase, "from", (table: string) => {
      assert.equal(table, "user_settings");
      return {
        select: () => ({
          eq: (_col: string, userId: string) => ({
            maybeSingle: async () => ({
              data: db.has(userId) ? { settings: db.get(userId) } : null,
              error: null,
            }),
          }),
        }),
        upsert: async (payload: any) => {
          db.set(payload.user_id, payload.settings);
          return { data: null, error: null };
        },
      };
    });

    const { useBannerStore } = await import("../store/bannerStore.ts");

    currentUserId = "u1";
    (globalThis as any).window = undefined;
    await useBannerStore.getState().initializeFromSupabase();

    assert.equal(useBannerStore.getState().config.title, "Painel de Gestão de Afiliados -");
    assert.equal(db.get("u1")?.dashboard_banner?.title, "Painel de Gestão de Afiliados -");

    currentUserId = "u2";
    db.set("u2", {
      dashboard_banner: {
        title: "Meu Painel Custom",
        description: "Custom desc",
        gradientFrom: "from-blue-500",
        gradientVia: "via-cyan-500",
        gradientTo: "to-teal-500",
      },
    });
    await useBannerStore.getState().initializeFromSupabase();
    assert.equal(useBannerStore.getState().config.title, "Meu Painel Custom");
    assert.equal(db.get("u2")?.dashboard_banner?.title, "Meu Painel Custom");

    currentUserId = "u3";
    const local = new Map<string, string>();
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => (local.has(k) ? local.get(k)! : null),
        setItem: (k: string, v: string) => {
          local.set(k, v);
        },
      },
    };
    local.set(
      "banner-storage",
      JSON.stringify({
        state: {
          config: {
            title: "Painel do U3",
            description: "Desc U3",
            gradientFrom: "from-purple-500",
            gradientVia: "via-pink-500",
            gradientTo: "to-red-500",
          },
        },
      })
    );

    await useBannerStore.getState().initializeFromSupabase();
    assert.equal(useBannerStore.getState().config.title, "Painel do U3");
    assert.equal(db.get("u3")?.dashboard_banner?.title, "Painel do U3");

    currentUserId = "u3";
    await useBannerStore.getState().updateConfig({ title: "Painel do U3 Editado" });
    assert.equal(db.get("u3")?.dashboard_banner?.title, "Painel do U3 Editado");
  });
});
