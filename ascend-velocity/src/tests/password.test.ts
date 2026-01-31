import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPasswordStrength, validatePasswordChangeForm } from "../lib/password.ts";

describe("Validações de senha", () => {
  it("deve marcar como inválido quando requisitos mínimos falham", () => {
    const errors = validatePasswordChangeForm({
      currentPassword: "senha-atual",
      newPassword: "aaaaaaa",
      confirmPassword: "aaaaaaa"
    });
    assert.ok(!!errors.newPassword);
  });

  it("deve exigir confirmação igual à nova senha", () => {
    const errors = validatePasswordChangeForm({
      currentPassword: "senha-atual",
      newPassword: "Aa1aaaaa",
      confirmPassword: "Aa1aaaab"
    });
    assert.equal(errors.confirmPassword, "A confirmação não corresponde à nova senha.");
  });

  it("deve exigir senha atual", () => {
    const errors = validatePasswordChangeForm({
      currentPassword: " ",
      newPassword: "Aa1aaaaa",
      confirmPassword: "Aa1aaaaa"
    });
    assert.equal(errors.currentPassword, "Informe sua senha atual.");
  });

  it("deve calcular força com base nos requisitos obrigatórios", () => {
    const s1 = getPasswordStrength("");
    assert.equal(s1.score, 0);
    assert.equal(typeof s1.label, "string");

    const s2 = getPasswordStrength("Aa1aaaaa");
    assert.equal(s2.score, 4);
    const requiredChecks = s2.checks.filter((c) => c.required);
    assert.ok(requiredChecks.every((c) => c.passed));
  });
});
