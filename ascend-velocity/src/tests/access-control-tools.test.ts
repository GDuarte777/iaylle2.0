import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { normalizeToolIdList, normalizeToolsDisabledByPage } from "../lib/utils.ts";
import { computePageToolsEnabled } from "../lib/accessControl.ts";

describe("access control tool overrides", () => {
  it("normalizeToolIdList deve separar por vírgula/linha, trimar e deduplicar", () => {
    const out = normalizeToolIdList("  a, b\n c \n\n b ");
    assert.deepEqual(out, ["a", "b", "c"]);
  });

  it("normalizeToolsDisabledByPage deve filtrar chaves inválidas e listas vazias", () => {
    const out = normalizeToolsDisabledByPage({
      "/dashboard": ["x", "x", ""],
      "*": ["y"],
      "/other": ["z"],
      "": ["w"],
      "/dashboard/settings": [],
    });

    assert.deepEqual(out, {
      "/dashboard": ["x"],
      "*": ["y"],
    });
  });
});

describe("trial access", () => {
  it("trial deve liberar tudo, mas respeitar permissões removidas", () => {
    const enabled = computePageToolsEnabled({
      userRole: "member",
      path: "/dashboard/gamification",
      planAllowedPages: ["*"],
      mergedAdds: [],
      mergedRemoves: ["/dashboard/gamification"],
      globallyBlocked: false,
    });

    assert.equal(enabled, false);
  });

  it("trial deve liberar páginas quando não há remoções", () => {
    const enabled = computePageToolsEnabled({
      userRole: "member",
      path: "/dashboard/roleta",
      planAllowedPages: ["*"],
      mergedAdds: [],
      mergedRemoves: [],
      globallyBlocked: false,
    });

    assert.equal(enabled, true);
  });

  it("trial expirado deve bloquear, a menos que admin libere", () => {
    const blocked = computePageToolsEnabled({
      userRole: "member",
      path: "/dashboard/roleta",
      planAllowedPages: ["*"],
      mergedAdds: [],
      mergedRemoves: [],
      globallyBlocked: true,
    });

    const allowedByAdmin = computePageToolsEnabled({
      userRole: "member",
      path: "/dashboard/roleta",
      planAllowedPages: ["*"],
      mergedAdds: ["*"],
      mergedRemoves: [],
      globallyBlocked: true,
    });

    assert.equal(blocked, false);
    assert.equal(allowedByAdmin, true);
  });
});
