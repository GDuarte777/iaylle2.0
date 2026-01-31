import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { WORKFLOW_LIMIT, getWorkflowLimitText, isRlsPolicyError, isWorkflowLimitReached } from '../lib/workflowLimits.ts';
import { deleteWorkflow, ensureDefaultWorkflow, serializeWorkflowNodes } from '../lib/workflows.ts';

describe('workflowLimits', () => {
  it('WORKFLOW_LIMIT deve ser 4', () => {
    assert.equal(WORKFLOW_LIMIT, 4);
  });

  it('isWorkflowLimitReached deve retornar true quando >= limite', () => {
    assert.equal(isWorkflowLimitReached(0), false);
    assert.equal(isWorkflowLimitReached(3), false);
    assert.equal(isWorkflowLimitReached(4), true);
    assert.equal(isWorkflowLimitReached(10), true);
  });

  it('getWorkflowLimitText deve formatar contador/limite', () => {
    assert.equal(getWorkflowLimitText(0), '0/4');
    assert.equal(getWorkflowLimitText(4), '4/4');
  });

  it('isRlsPolicyError deve detectar erro típico de RLS', () => {
    const err = {
      code: '42501',
      message: 'new row violates row-level security policy for table "workflows"',
      details: '',
    };

    assert.equal(isRlsPolicyError(err), true);
    assert.equal(isRlsPolicyError({ code: '123', message: 'x' }), false);
    assert.equal(isRlsPolicyError(null), false);
  });

  it('ensureDefaultWorkflow deve chamar o RPC correto', async () => {
    let called = '';

    const supabaseStub = {
      rpc: async (fn: string) => {
        called = fn;
        return { error: null };
      },
    };

    const { error } = await ensureDefaultWorkflow(supabaseStub);
    assert.equal(error, null);
    assert.equal(called, 'ensure_default_workflow');
  });

  it('serializeWorkflowNodes deve remover handlers da data', () => {
    const nodes = [
      {
        id: 'n1',
        data: {
          title: 'A',
          onDelete: () => {},
          onEdit: () => {},
          onUpdate: () => {},
          onTitleChange: () => {},
          onHandleClick: () => {},
          onHandleDisconnect: () => {},
          fields: [],
        },
      },
    ];

    const serialized = serializeWorkflowNodes(nodes as any);
    assert.equal(Array.isArray(serialized), true);
    assert.equal(serialized.length, 1);
    assert.equal(typeof serialized[0].data.onDelete, 'undefined');
    assert.equal(typeof serialized[0].data.onEdit, 'undefined');
    assert.equal(typeof serialized[0].data.onUpdate, 'undefined');
    assert.equal(typeof serialized[0].data.onTitleChange, 'undefined');
    assert.equal(typeof serialized[0].data.onHandleClick, 'undefined');
    assert.equal(typeof serialized[0].data.onHandleDisconnect, 'undefined');
    assert.equal(serialized[0].data.title, 'A');
  });

  it('deleteWorkflow deve aplicar filtros por id e user_id', async () => {
    const calls: Array<{ type: string; value?: any }> = [];

    const supabaseStub = {
      from: (table: string) => {
        calls.push({ type: 'from', value: table });
        return {
          delete: () => {
            calls.push({ type: 'delete' });
            return {
              eq: (col: string, val: any) => {
                calls.push({ type: 'eq', value: { col, val } });
                return {
                  eq: (col2: string, val2: any) => {
                    calls.push({ type: 'eq', value: { col: col2, val: val2 } });
                    return { error: null };
                  },
                };
              },
            };
          },
        };
      },
    };

    const { error } = await deleteWorkflow(supabaseStub as any, { workflowId: 'w1', userId: 'u1' });
    assert.equal(error, null);

    assert.deepEqual(calls[0], { type: 'from', value: 'workflows' });
    assert.deepEqual(calls[1], { type: 'delete' });
    assert.deepEqual(calls[2], { type: 'eq', value: { col: 'id', val: 'w1' } });
    assert.deepEqual(calls[3], { type: 'eq', value: { col: 'user_id', val: 'u1' } });
  });
});
