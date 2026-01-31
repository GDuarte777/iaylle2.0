import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { getSessionSafe, supabase } from "../lib/supabase.ts";

describe("getSessionSafe", () => {
  it("deve deduplicar chamadas concorrentes de sessão", async () => {
    let calls = 0;

    mock.method(supabase.auth, "getSession", async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 25));
      return { data: { session: null }, error: null } as any;
    });

    const [a, b] = await Promise.all([getSessionSafe(2000), getSessionSafe(2000)]);
    assert.equal(calls, 1);
    assert.deepEqual((a as any)?.data?.session ?? null, null);
    assert.deepEqual((b as any)?.data?.session ?? null, null);
  });
});

