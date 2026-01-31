import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildLinkBioAddItemDraftKey,
  buildLinkBioUnsavedDraftKey,
  canSubmitLinkBioAddItem,
  readStorageJson,
  safeJsonParse,
  writeStorageJson,
} from "../pages/dashboard/linkbio/shared.ts";

class MemoryStorage {
  #store = new Map();

  getItem(key) {
    return this.#store.has(key) ? this.#store.get(key) : null;
  }

  setItem(key, value) {
    this.#store.set(key, value);
  }

  removeItem(key) {
    this.#store.delete(key);
  }
}

test("safeJsonParse retorna null para entradas inválidas", () => {
  assert.equal(safeJsonParse(null), null);
  assert.equal(safeJsonParse(""), null);
  assert.equal(safeJsonParse("{"), null);
});

test("safeJsonParse faz parse de JSON válido", () => {
  const result = safeJsonParse('{"ok":true,"n":1}');
  assert.deepEqual(result, { ok: true, n: 1 });
});

test("readStorageJson/writeStorageJson fazem round-trip", () => {
  const storage = new MemoryStorage();
  const key = "k";
  const payload = { v: 1, userId: "u1", isAddLinkOpen: true };

  writeStorageJson(storage, key, payload);
  const read = readStorageJson(storage, key);

  assert.deepEqual(read, payload);
});

test("buildLinkBioAddItemDraftKey e buildLinkBioUnsavedDraftKey são estáveis", () => {
  assert.equal(buildLinkBioAddItemDraftKey("u1"), "linkbio:add-item-draft:v1:u1");
  assert.equal(buildLinkBioUnsavedDraftKey("u1"), "linkbio:unsaved-draft:v1:u1");
});

test("canSubmitLinkBioAddItem bloqueia salvar quando estado está inconsistente", () => {
  const base = {
    isLoading: false,
    pageId: "p1",
    userId: "u1",
    isDirtyAfterBlur: false,
    isRevalidating: false,
    isSaving: false,
    isToolsEnabled: true,
  };

  assert.equal(canSubmitLinkBioAddItem(base), true);
  assert.equal(canSubmitLinkBioAddItem({ ...base, isLoading: true }), false);
  assert.equal(canSubmitLinkBioAddItem({ ...base, pageId: null }), false);
  assert.equal(canSubmitLinkBioAddItem({ ...base, userId: null }), false);
  assert.equal(canSubmitLinkBioAddItem({ ...base, isToolsEnabled: false }), false);
  assert.equal(canSubmitLinkBioAddItem({ ...base, isDirtyAfterBlur: true }), false);
  assert.equal(canSubmitLinkBioAddItem({ ...base, isRevalidating: true }), false);
  assert.equal(canSubmitLinkBioAddItem({ ...base, isSaving: true }), false);
});

function extractFunctionBody(source: string, marker: string) {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `Não encontrou marcador: ${marker}`);

  const braceStart = source.indexOf("{", start);
  assert.ok(braceStart >= 0, "Não encontrou '{' do corpo da função");

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(braceStart + 1, i);
    }
  }

  assert.fail("Não conseguiu extrair corpo da função (chaves desbalanceadas)");
}

test("confirmAddLink não faz atualização otimista antes do commit no banco", async () => {
  const linkBioPath = path.resolve(
    process.cwd(),
    "src/pages/dashboard/LinkBio.tsx",
  );
  const content = await readFile(linkBioPath, "utf8");
  const body = extractFunctionBody(content, "const confirmAddLink = async () =>");

  assert.equal(body.includes("setLinks("), false);
  assert.equal(body.includes("await refreshLinksFromDb"), true);
  assert.equal(body.includes("from(\"bio_links\")"), true);
});

test("LinkBio usa timeouts e lifecycle para evitar loading eterno", async () => {
  const linkBioPath = path.resolve(process.cwd(), "src/pages/dashboard/LinkBio.tsx");
  const content = await readFile(linkBioPath, "utf8");

  assert.equal(content.includes("Tempo excedido ao salvar alterações."), true);
  assert.equal(content.includes("Tempo excedido ao atualizar itens."), true);
  assert.equal(content.includes("window.addEventListener(\"blur\""), true);
  assert.equal(content.includes("window.addEventListener(\"focus\""), true);
  assert.equal(content.includes("setIsAddItemSaving(false)"), true);
});
