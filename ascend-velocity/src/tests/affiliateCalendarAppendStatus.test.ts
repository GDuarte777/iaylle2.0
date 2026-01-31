import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { supabase } from "../lib/supabase.ts";
import { useStatusConfig } from "../store/statusConfig.ts";
import { appendCalendarStatus } from "../hooks/useAffiliates.ts";

describe("Calendário de afiliadas", () => {
  it("deve salvar status com pontos quando afiliada pertence ao usuário", async () => {
    const userId = "u1";
    const affiliateId = "a1";
    const date = "2026-01-15";

    const previousState = useStatusConfig.getState();
    useStatusConfig.setState({
      ...previousState,
      achievements: [],
      classes: [{ key: "postou", label: "Postou", points: 2 } as any],
    });

    (globalThis as any).Event = class {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    };

    (globalThis as any).CustomEvent = class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: any) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    (globalThis as any).window = {
      dispatchEvent: () => true,
    };

    mock.method(supabase.auth, "getSession", async () => ({
      data: {
        session: {
          access_token: "t",
          user: { id: userId },
        },
      },
      error: null,
    } as any));

    const upserts: any[] = [];

    mock.method(supabase, "from", (table: string) => {
      if (table === "affiliates") {
        return {
          select: () => ({
            eq: (_col1: string, _val1: any) => ({
              eq: (_col2: string, _val2: any) => ({
                maybeSingle: async () => ({ data: { id: affiliateId }, error: null }),
              }),
            }),
          }),
        } as any;
      }

      if (table === "affiliate_metrics") {
        return {
          upsert: async (payload: any, opts?: any) => {
            upserts.push({ payload, opts });
            return { data: null, error: null };
          },
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        } as any;
      }

      if (table === "affiliate_achievements") {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        } as any;
      }

      throw new Error(`Tabela não mockada: ${table}`);
    });

    const ok = await appendCalendarStatus(affiliateId, date, "postou");
    assert.equal(ok, true);
    assert.equal(upserts.length, 1);
    assert.deepEqual(upserts[0].opts, { onConflict: "affiliate_id,date" });
    assert.deepEqual(upserts[0].payload, {
      affiliate_id: affiliateId,
      date,
      status: "postou",
      points: 2,
    });

    useStatusConfig.setState(previousState);
    delete (globalThis as any).window;
  });

  it("deve conceder conquista quando requisito for atendido", async () => {
    const userId = "u1";
    const affiliateId = "a1";
    const date = "2026-01-15";

    const previousState = useStatusConfig.getState();
    useStatusConfig.setState({
      ...previousState,
      classes: [{ key: "postou", label: "Postou", points: 2 } as any],
      achievements: [
        {
          id: "sequencia_2",
          title: "Sequência 2 dias",
          description: "",
          xp: 50,
          classKeys: ["postou"],
          streakDays: 2,
          timeWindow: "month",
          scope: "individual",
        } as any,
      ],
    });

    (globalThis as any).Event = class {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    };

    (globalThis as any).CustomEvent = class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: any) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    (globalThis as any).window = {
      dispatchEvent: () => true,
    };

    mock.method(supabase.auth, "getSession", async () => ({
      data: {
        session: {
          access_token: "t",
          user: { id: userId },
        },
      },
      error: null,
    } as any));

    const inserted: any[] = [];

    mock.method(supabase, "from", (table: string) => {
      if (table === "affiliates") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: affiliateId }, error: null }),
              }),
            }),
          }),
        } as any;
      }

      if (table === "affiliate_metrics") {
        return {
          upsert: async () => ({ data: null, error: null }),
          select: () => ({
            eq: async () => ({
              data: [
                { affiliate_id: affiliateId, date: "2026-01-14", status: "postou" },
                { affiliate_id: affiliateId, date: "2026-01-15", status: "postou" },
              ],
              error: null,
            }),
          }),
        } as any;
      }

      if (table === "affiliate_achievements") {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
          insert: async (rows: any[]) => {
            inserted.push(...rows);
            return { data: null, error: null };
          },
          delete: () => ({
            in: async () => ({ data: null, error: null }),
          }),
        } as any;
      }

      throw new Error(`Tabela não mockada: ${table}`);
    });

    const ok = await appendCalendarStatus(affiliateId, date, "postou");
    assert.equal(ok, true);

    for (let i = 0; i < 10 && inserted.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 0));
    }

    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].affiliate_id, affiliateId);
    assert.equal(inserted[0].achievement_id, "sequencia_2");
    assert.equal(inserted[0].period_tag, "2026-01");
    assert.equal(inserted[0].points_awarded, 50);

    useStatusConfig.setState(previousState);
    delete (globalThis as any).window;
  });
});

