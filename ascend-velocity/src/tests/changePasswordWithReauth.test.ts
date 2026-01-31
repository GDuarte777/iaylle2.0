import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { changePasswordWithReauth, type ChangePasswordClient } from "../lib/auth/changePassword.ts";

type ChangePasswordClientStubs = {
  auth?: Partial<ChangePasswordClient["auth"]>;
  functions?: Partial<ChangePasswordClient["functions"]>;
};

function createClient(stubs: ChangePasswordClientStubs): ChangePasswordClient {
  const authDefaults: ChangePasswordClient["auth"] = {
    signInWithPassword: async (_input) => ({ error: null }),
    updateUser: async (_input) => ({ error: null }),
    signOut: async (_input?: unknown) => ({})
  };

  const functionsDefaults: ChangePasswordClient["functions"] = {
    invoke: async (_name, _input) => ({ error: null })
  };

  return {
    auth: { ...authDefaults, ...(stubs.auth ?? {}) } as ChangePasswordClient["auth"],
    functions: { ...functionsDefaults, ...(stubs.functions ?? {}) } as ChangePasswordClient["functions"]
  };
}

describe("changePasswordWithReauth", () => {
  it("deve autenticar, atualizar senha e notificar", async () => {
    const calls: string[] = [];
    const client = createClient({
      auth: {
        signInWithPassword: async () => {
          calls.push("reauth");
          return { error: null };
        },
        updateUser: async () => {
          calls.push("update");
          return { error: null };
        },
        signOut: async () => {
          calls.push("signout");
          return {};
        }
      },
      functions: {
        invoke: async () => {
          calls.push("notify");
          return { error: null };
        }
      }
    });

    const result = await changePasswordWithReauth({
      client,
      email: "a@b.com",
      currentPassword: "old",
      newPassword: "Aa1aaaaa",
      notify: true,
      signOutEverywhere: false
    });

    assert.equal(result.success, true);
    assert.equal((result as any).notified, true);
    assert.deepEqual(calls, ["reauth", "update", "notify"]);
  });

  it("deve encerrar sessões quando solicitado", async () => {
    const calls: unknown[] = [];
    const client = createClient({
      auth: {
        signOut: async (arg?: unknown) => {
          calls.push(arg);
          return {};
        }
      }
    });

    const result = await changePasswordWithReauth({
      client,
      email: "a@b.com",
      currentPassword: "old",
      newPassword: "Aa1aaaaa",
      notify: false,
      signOutEverywhere: true
    });

    assert.equal(result.success, true);
    assert.equal(calls.length, 1);
  });

  it("deve falhar quando senha atual estiver incorreta", async () => {
    const client = createClient({
      auth: {
        signInWithPassword: async () => ({ error: { message: "Invalid login credentials" } })
      }
    });

    const result = await changePasswordWithReauth({
      client,
      email: "a@b.com",
      currentPassword: "wrong",
      newPassword: "Aa1aaaaa",
      notify: true,
      signOutEverywhere: false
    });

    assert.equal(result.success, false);
    assert.ok((result as any).error);
  });

  it("deve falhar quando updateUser retornar erro", async () => {
    const client = createClient({
      auth: {
        updateUser: async () => ({ error: { message: "Password too weak" } })
      }
    });

    const result = await changePasswordWithReauth({
      client,
      email: "a@b.com",
      currentPassword: "old",
      newPassword: "Aa1aaaaa",
      notify: true,
      signOutEverywhere: false
    });

    assert.equal(result.success, false);
    assert.equal((result as any).error, "Password too weak");
  });
});
