export async function ensureDefaultWorkflow(supabase: { rpc: (fn: string) => PromiseLike<{ error?: unknown | null }> }) {
  const { error } = await supabase.rpc('ensure_default_workflow');
  return { error: error ?? null };
}

export function serializeWorkflowNodes(nodes: any[]) {
  return (nodes ?? []).map((n) => {
    const data = n?.data ?? {};
    const { onDelete, onEdit, onUpdate, onTitleChange, onHandleClick, onHandleDisconnect, ...safeData } = data;
    return { ...n, data: safeData };
  });
}

export async function deleteWorkflow(
  supabase: {
    from: (table: string) => {
      delete: () => { eq: (col: string, val: any) => any };
    };
  },
  params: { workflowId: string; userId: string },
) {
  const { workflowId, userId } = params;
  const res = await supabase.from('workflows').delete().eq('id', workflowId).eq('user_id', userId);
  return { error: (res as any)?.error ?? null };
}
