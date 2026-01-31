import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Tipos simplificados para teste
interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// A função core que queremos testar (extraída da lógica do componente)
function filterEdgesToRemove(edges: Edge[], nodeId: string, handleId: string) {
  return edges.filter(
    (e) => (e.source === nodeId && e.sourceHandle === handleId) || 
           (e.target === nodeId && e.targetHandle === handleId)
  );
}

describe('Workflow Connection Removal Logic', () => {
  const edges: Edge[] = [
    { id: 'e1', source: 'node-1', target: 'node-2', sourceHandle: 'r-source', targetHandle: 'l-target' },
    { id: 'e2', source: 'node-1', target: 'node-3', sourceHandle: 'r-source', targetHandle: 'l-target' }, // Mesma origem que e1
    { id: 'e3', source: 'node-1', target: 'node-4', sourceHandle: 'b-source', targetHandle: 't-target' }, // Mesmo node, handle diferente
    { id: 'e4', source: 'node-5', target: 'node-1', sourceHandle: 'r-source', targetHandle: 'l-target' }, // node-1 é destino
    { id: 'e5', source: 'node-6', target: 'node-7', sourceHandle: 'r-source', targetHandle: 'l-target' }, // Nada a ver
  ];

  it('deve identificar todas as conexões de um handle de saída específico', () => {
    // Clique duplo no handle 'r-source' do 'node-1'
    const toRemove = filterEdgesToRemove(edges, 'node-1', 'r-source');
    
    assert.equal(toRemove.length, 2);
    assert.ok(toRemove.map(e => e.id).includes('e1'));
    assert.ok(toRemove.map(e => e.id).includes('e2'));
    assert.ok(!toRemove.map(e => e.id).includes('e3'));
  });

  it('deve identificar conexão de um handle de entrada específico', () => {
    // Clique duplo no handle 'l-target' do 'node-1'
    const toRemove = filterEdgesToRemove(edges, 'node-1', 'l-target');
    
    assert.equal(toRemove.length, 1);
    assert.equal(toRemove[0].id, 'e4');
  });

  it('não deve remover conexões de outros nodes com mesmo ID de handle', () => {
    // Digamos que node-6 também tem um 'r-source' (comum em handles padronizados)
    // Clique no 'r-source' do 'node-6'
    const toRemove = filterEdgesToRemove(edges, 'node-6', 'r-source');
    
    assert.equal(toRemove.length, 1);
    assert.equal(toRemove[0].id, 'e5');
    // Não deve pegar e1 ou e2 que também são 'r-source' mas do node-1
    assert.ok(!toRemove.map(e => e.id).includes('e1'));
  });

  it('deve retornar lista vazia se não houver conexões no handle', () => {
    const toRemove = filterEdgesToRemove(edges, 'node-1', 'unused-handle');
    assert.equal(toRemove.length, 0);
  });
});
