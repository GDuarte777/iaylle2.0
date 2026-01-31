import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  canUseTool,
  computeDenyReason,
  computePageToolsEnabled,
  normalizeDashboardPath,
} from "../lib/accessControl.ts";

describe("accessControl", () => {
  it("normalizeDashboardPath normaliza workflow", () => {
    assert.equal(normalizeDashboardPath("/dashboard/workflow/123"), "/dashboard/workflow");
    assert.equal(normalizeDashboardPath("/dashboard/workflows"), "/dashboard/workflows");
  });

  it("computePageToolsEnabled permite admin", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "admin",
        path: "/dashboard/sorteios",
        planAllowedPages: [],
        mergedAdds: [],
        mergedRemoves: ["/dashboard/sorteios"],
      }),
      true,
    );
  });

  it("computePageToolsEnabled bloqueia páginas removidas pelo admin", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: null,
        mergedAdds: [],
        mergedRemoves: ["/dashboard/sorteios"],
      }),
      false,
    );

    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios/editar",
        planAllowedPages: null,
        mergedAdds: [],
        mergedRemoves: ["/dashboard/sorteios"],
      }),
      false,
    );
  });

  it("computePageToolsEnabled respeita plano quando presente", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: ["/dashboard"],
        mergedAdds: [],
        mergedRemoves: [],
      }),
      false,
    );

    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard",
        planAllowedPages: ["/dashboard"],
        mergedAdds: [],
        mergedRemoves: [],
      }),
      true,
    );

    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: ["/dashboard"],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: [],
      }),
      true,
    );
  });

  it("computeDenyReason retorna not_in_plan quando plano bloqueia", () => {
    assert.equal(
      computeDenyReason({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: ["/dashboard"],
        mergedAdds: [],
        mergedRemoves: [],
      }),
      "not_in_plan",
    );
  });

  it("Permissão do admin ignora plano e trial", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: ["/dashboard"],
        mergedAdds: [],
        mergedRemoves: [],
        globallyBlocked: true,
      }),
      false,
    );

    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: ["/dashboard"],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: [],
        globallyBlocked: true,
      }),
      true,
    );

    assert.equal(
      computeDenyReason({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: ["/dashboard"],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: [],
        globallyBlocked: true,
      }),
      null,
    );
  });

  it("Perfil (/dashboard/settings) fica sempre liberado", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/settings",
        planAllowedPages: [],
        mergedAdds: [],
        mergedRemoves: ["/dashboard/settings", "*"],
        globallyBlocked: true,
      }),
      true,
    );

    assert.equal(
      computeDenyReason({
        userRole: "member",
        path: "/dashboard/settings",
        planAllowedPages: [],
        mergedAdds: [],
        mergedRemoves: ["/dashboard/settings", "*"],
        globallyBlocked: true,
      }),
      null,
    );

    assert.equal(
      canUseTool({
        userRole: "member",
        path: "/dashboard/settings",
        planAllowedPages: [],
        mergedAdds: [],
        mergedRemoves: ["/dashboard/settings", "*"],
        globallyBlocked: true,
        toolsDisabledByPage: {
          "*": ["tool-global"],
          "/dashboard/settings": ["tool-local"],
        },
        toolId: "tool-global",
      }),
      true,
    );
  });

  it("Remove '*' bloqueia tudo mesmo com add em páginas específicas", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: [],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: ["*"],
      }),
      false,
    );

    assert.equal(
      computeDenyReason({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: [],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: ["*"],
      }),
      "blocked_by_admin",
    );

    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/roleta",
        planAllowedPages: ["*"],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: ["*"],
      }),
      false,
    );

    assert.equal(
      computeDenyReason({
        userRole: "member",
        path: "/dashboard/roleta",
        planAllowedPages: ["*"],
        mergedAdds: ["/dashboard/sorteios"],
        mergedRemoves: ["*"],
      }),
      "blocked_by_admin",
    );
  });

  it("Admin consegue bloquear gamificação", () => {
    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/gamification",
        planAllowedPages: ["*"],
        mergedAdds: [],
        mergedRemoves: ["/dashboard/gamification"],
      }),
      false,
    );

    assert.equal(
      computePageToolsEnabled({
        userRole: "member",
        path: "/dashboard/gamification",
        planAllowedPages: ["*"],
        mergedAdds: [],
        mergedRemoves: ["*"],
      }),
      false,
    );
  });

  it("canUseTool bloqueia ferramenta por página e por wildcard", () => {
    const toolsDisabledByPage = {
      "*": ["tool-global"],
      "/dashboard/sorteios": ["tool-local"],
    };

    assert.equal(
      canUseTool({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: null,
        mergedAdds: [],
        mergedRemoves: [],
        toolsDisabledByPage,
        toolId: "tool-global",
      }),
      false,
    );

    assert.equal(
      canUseTool({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: null,
        mergedAdds: [],
        mergedRemoves: [],
        toolsDisabledByPage,
        toolId: "tool-local",
      }),
      false,
    );

    assert.equal(
      canUseTool({
        userRole: "member",
        path: "/dashboard/sorteios",
        planAllowedPages: null,
        mergedAdds: [],
        mergedRemoves: [],
        toolsDisabledByPage,
        toolId: "tool-ok",
      }),
      true,
    );
  });
});
