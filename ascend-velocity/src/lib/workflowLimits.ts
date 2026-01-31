export const WORKFLOW_LIMIT = 4;

export function isWorkflowLimitReached(workflowCount: number) {
  return workflowCount >= WORKFLOW_LIMIT;
}

export function getWorkflowLimitText(workflowCount: number) {
  return `${workflowCount}/${WORKFLOW_LIMIT}`;
}

export function isRlsPolicyError(error: unknown) {
  const anyErr = error as any;
  const code = anyErr?.code;
  const message = String(anyErr?.message ?? '');
  const details = String(anyErr?.details ?? '');

  if (code === '42501' && (message.includes('row-level security') || details.includes('row-level security'))) {
    return true;
  }

  return false;
}

