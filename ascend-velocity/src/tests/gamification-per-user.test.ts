import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { supabase } from "../lib/supabase.ts";

describe("Gamificação por usuário", () => {
  it("deve isolar configurações entre usuários e persistir ao re-login", async () => {
    const db = new Map<string, any>();
    let currentUserId: string | null = "u1";

    mock.method(supabase.auth, "getUser", async () => ({
      data: {
        user: currentUserId ? { id: currentUserId } : null,
      },
    }));

    mock.method(supabase, "from", (table: string) => {
      assert.equal(table, "user_gamification_config");
      return {
        select: () => ({
          eq: (_col: string, userId: string) => ({
            maybeSingle: async () => ({
              data: db.has(userId) ? { config: db.get(userId) } : null,
              error: null,
            }),
          }),
        }),
        upsert: async (payload: any) => {
          db.set(payload.user_id, payload.config);
          return { data: null, error: null };
        },
      };
    });

    const { useStatusConfig } = await import("../store/statusConfig.ts");

    currentUserId = "u1";
    await useStatusConfig.getState().initializeFromSupabase();

    await useStatusConfig.getState().addLevel({
      id: "nivel_u1",
      name: "U1",
      minXP: 123,
      color: "from-red-500 to-red-600",
    });

    assert.equal(Array.isArray(db.get("u1")?.levels), true);
    assert.equal(db.get("u1")?.levels.some((l: any) => l.id === "nivel_u1"), true);

    currentUserId = "u2";
    await useStatusConfig.getState().initializeFromSupabase();
    await useStatusConfig.getState().addLevel({
      id: "nivel_u2",
      name: "U2",
      minXP: 456,
      color: "from-blue-500 to-blue-600",
    });

    assert.equal(db.get("u1")?.levels.some((l: any) => l.id === "nivel_u2"), false);
    assert.equal(db.get("u2")?.levels.some((l: any) => l.id === "nivel_u2"), true);

    currentUserId = "u1";
    await useStatusConfig.getState().initializeFromSupabase();
    assert.equal(useStatusConfig.getState().levels.some((l) => l.id === "nivel_u1"), true);

    currentUserId = null;
    await useStatusConfig.getState().initializeFromSupabase();

    currentUserId = "u1";
    await useStatusConfig.getState().initializeFromSupabase();
    assert.equal(useStatusConfig.getState().levels.some((l) => l.id === "nivel_u1"), true);
  });

  it("não deve ter restrição de admin na página", async () => {
    const content = await fs.readFile(new URL("../pages/dashboard/Gamification.tsx", import.meta.url), "utf8");
    assert.equal(content.includes("Somente administradores podem configurar gamificação."), false);
    assert.equal(content.includes('user.role !== "admin"'), false);
  });
});
