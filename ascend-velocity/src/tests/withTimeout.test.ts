import { test } from "node:test";
import assert from "node:assert/strict";
import { withTimeout } from "../lib/utils.ts";

test("withTimeout resolve quando promise completa", async () => {
  const result = await withTimeout(Promise.resolve("ok"), 50);
  assert.equal(result, "ok");
});

test("withTimeout rejeita quando estoura o tempo", async () => {
  const never = new Promise<string>(() => void 0);
  await assert.rejects(() => withTimeout(never, 20, "Tempo excedido ao enviar a imagem."), /Tempo excedido/);
});
