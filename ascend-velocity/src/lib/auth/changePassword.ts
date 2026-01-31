export type ChangePasswordResult =
  | { success: true; notified: boolean }
  | { success: false; error: string };

export interface ChangePasswordClient {
  auth: {
    signInWithPassword: (input: { email: string; password: string }) => Promise<{ error: { message: string } | null }>;
    updateUser: (input: { password: string }) => Promise<{ error: { message: string } | null }>;
    signOut: (input?: unknown) => Promise<{ error?: { message: string } | null } | void>;
  };
  functions: {
    invoke: (name: string, input: { body: unknown }) => Promise<{ error: { message: string } | null }>;
  };
}

export async function changePasswordWithReauth(input: {
  client: ChangePasswordClient;
  email: string;
  currentPassword: string;
  newPassword: string;
  notify: boolean;
  signOutEverywhere: boolean;
}): Promise<ChangePasswordResult> {
  const { client, email, currentPassword, newPassword } = input;

  const { error: reauthError } = await client.auth.signInWithPassword({
    email,
    password: currentPassword
  });

  if (reauthError) {
    const msg = reauthError.message || "Senha atual incorreta.";
    return { success: false, error: msg };
  }

  const { error: updateError } = await client.auth.updateUser({
    password: newPassword
  });

  if (updateError) {
    const msg = updateError.message || "Não foi possível alterar a senha.";
    return { success: false, error: msg };
  }

  let notified = false;
  if (input.notify) {
    const { error: notifyError } = await client.functions.invoke("auth-password-changed-notify", {
      body: {}
    });
    notified = !notifyError;
  }

  if (input.signOutEverywhere) {
    try {
      await client.auth.signOut({ scope: "global" } as any);
    } catch {
      await client.auth.signOut();
    }
  }

  return { success: true, notified };
}

