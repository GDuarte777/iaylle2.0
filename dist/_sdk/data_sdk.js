window.dataSdk = {
  init: async function (handler) {
    const afiliadaId = 1;
    const sampleData = [
      { id: afiliadaId, nome: 'Raquel Rodrigues', instagram: 'raquel.rodrigues', empresa: 'Aylle Duarte' },
      { afiliada_id: afiliadaId, mes_ano: '2025-11', pontos: 120 },
      { afiliada_id: afiliadaId, data: '2025-11-10', status: 'postou' },
      { afiliada_id: afiliadaId, data: '2025-11-11', status: 'postou' },
      { afiliada_id: afiliadaId, data: '2025-11-12', status: 'postou_vendas' },
      { afiliada_id: afiliadaId, data: '2025-11-13', status: 'postou_vendas' },
      { afiliada_id: afiliadaId, data: '2025-11-14', status: 'postou' },
      { afiliada_id: afiliadaId, data: '2025-11-18', status: 'nao_postou' },
      { afiliada_id: afiliadaId, data: '2025-11-20', status: 'postou_vendas' }
    ];
    if (handler && typeof handler.onDataChanged === 'function') {
      handler.onDataChanged(sampleData);
    }
    return { isOk: true };
  },
  fetch: async function () {
    return [];
  }
};
