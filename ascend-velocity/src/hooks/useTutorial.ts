import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuthStore } from '@/store/authStore';

export const useTutorial = () => {
  const { user } = useAuthStore();

  const startTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          element: '#dock-nav',
          popover: {
            title: 'Menu de Navegação 🧭',
            description: 'Aqui você encontra todas as ferramentas da plataforma. Passe o mouse para expandir os ícones e descobrir novas funcionalidades.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#nav-dashboard',
          popover: {
            title: 'Dashboard 📊',
            description: 'Sua visão geral com métricas, indicadores e atalhos principais para gestão diária.',
            side: 'top',
          },
        },
        {
          element: '#nav-gamification',
          popover: {
            title: 'Gamificação 🏆',
            description: 'Gerencie sistemas de recompensas, níveis e engajamento para motivar seus usuários.',
            side: 'top',
          },
        },
        {
          element: '#nav-sorteios',
          popover: {
            title: 'Sorteios 🎁',
            description: 'Crie e gerencie sorteios automáticos para sua audiência de forma transparente.',
            side: 'top',
          },
        },
        {
          element: '#nav-roleta',
          popover: {
            title: 'Roleta 🎰',
            description: 'Uma ferramenta interativa e divertida para premiar seus usuários instantaneamente.',
            side: 'top',
          },
        },
        {
          element: '#nav-whatsapp-link',
          popover: {
            title: 'Link WhatsApp 💬',
            description: 'Gerador de links diretos para WhatsApp com mensagens personalizadas para facilitar o contato.',
            side: 'top',
          },
        },
        {
          element: '#nav-workflows',
          popover: {
            title: 'Mapa Mental ⚡',
            description: 'Crie e organize seus mapas mentais para ganhar produtividade.',
            side: 'top',
          },
        },
        {
          element: '#nav-link-bio',
          popover: {
            title: 'Link na Bio 🔗',
            description: 'Crie uma página personalizada e profissional com todos os seus links importantes.',
            side: 'top',
          },
        },
        {
          element: '#nav-settings',
          popover: {
            title: 'Perfil ⚙️',
            description: 'Gerencie sua conta, plano de assinatura e configurações pessoais.',
            side: 'top',
          },
        },
        {
          element: '#nav-ranking',
          popover: {
            title: 'Ranking Global 👑',
            description: 'Acompanhe quem são os melhores afiliados de toda a plataforma e inspire-se para chegar ao topo!',
            side: 'top',
          },
        },
        {
          element: '#theme-toggle',
          popover: {
            title: 'Tema 🌓',
            description: 'Prefere claro ou escuro? Alterne o visual da plataforma conforme sua preferência.',
            side: 'top',
          },
        },
        {
          element: '#tutorial-btn',
          popover: {
            title: 'Tutorial 💡',
            description: 'Precisa de ajuda? Clique aqui sempre que quiser rever este guia.',
            side: 'top',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startDashboardTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          popover: {
            title: 'Bem-vindo ao Dashboard 🚀',
            description: 'Vamos fazer um tour rápido pelas principais funcionalidades para você gerenciar suas afiliadas com eficiência máxima.',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#dashboard-banner',
          popover: {
            title: 'Seu Painel Personalizável 🎨',
            description: 'Defina a identidade do seu painel. Clique no ícone de lápis para editar título, descrição e cores do banner.',
            side: 'bottom',
          },
        },
        {
          element: '#dashboard-tabs',
          popover: {
            title: 'Navegação Rápida ⚡',
            description: 'Alterne facilmente entre a Visão Geral, Gamificação e Métricas Detalhadas para diferentes análises.',
            side: 'bottom',
          },
        },
        {
          element: '#dashboard-stats',
          popover: {
            title: 'Indicadores em Tempo Real 📊',
            description: 'Monitore o desempenho das afiliadas, taxas de cumprimento, inativos e os destaques do mês num piscar de olhos.',
            side: 'bottom',
          },
        },
        {
          element: '#dashboard-add-affiliate',
          popover: {
            title: 'Cadastro Rápido ✨',
            description: 'Adicione novas afiliadas em segundos. Basta preencher os dados essenciais e clicar em "Adicionar".',
            side: 'top',
          },
        },
        {
          element: '#dashboard-list',
          popover: {
            title: 'Gestão Completa 👥',
            description: 'Visualize, edite e acompanhe o progresso de cada afiliada. Use os filtros e busca para encontrar exatamente quem você precisa.',
            side: 'top',
          },
        },
        {
          element: '.tutorial-calendar-btn',
          popover: {
            title: 'Calendário de Atividades 📅',
            description: 'Este é o coração da gestão! Clique no calendário para registrar se a afiliada cumpriu o desafio do dia, fez vendas ou falhou. É aqui que a gamificação acontece.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          popover: {
            title: 'Tudo Pronto! 🎉',
            description: 'Você já domina o básico! Agora é hora de explorar e potenciar seus resultados. Se precisar rever, o botão "Como usar" está sempre ali.',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('dashboard_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startGamificationTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          popover: {
            title: 'Sistema de Gamificação 🏆',
            description: 'Engaje sua equipe com um sistema completo de níveis, pontuações e conquistas. Vamos ver como configurar?',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#gamification-levels',
          popover: {
            title: 'Níveis de Evolução 📈',
            description: 'Defina a jornada de crescimento. Crie níveis progressivos (ex: Iniciante, Mestre) baseados em XP para motivar a evolução constante.',
            side: 'bottom',
          },
        },
        {
          element: '#gamification-add-level',
          popover: {
            title: 'Novo Nível ✨',
            description: 'Clique aqui para criar um novo patamar. Defina nome, XP necessário e personalize com cores e ícones exclusivos.',
            side: 'left',
          },
        },
        {
          element: '#gamification-classes',
          popover: {
            title: 'Regras de Pontuação 🎯',
            description: 'Configure como os usuários ganham pontos. Crie categorias como "Venda Realizada" ou "Postagem Criativa" e defina o valor em XP de cada ação.',
            side: 'top',
          },
        },
        {
          element: '#gamification-add-class',
          popover: {
            title: 'Nova Regra de Pontuação ➕',
            description: 'Adicione uma nova forma de ganhar pontos. Escolha um nome, descrição, quantidade de pontos e uma cor de identificação. Importante: Defina o "Tipo de dia" corretamente (Positivo ou Negativo) para que as métricas no Dashboard reflitam o desempenho real.',
            side: 'left',
          },
        },
        {
          element: '#gamification-achievements',
          popover: {
            title: 'Conquistas e Medalhas 🏅',
            description: 'Crie desafios especiais! Recompense comportamentos específicos como "Sequência de 7 dias" ou "100 Vendas no Mês" com medalhas e XP extra.',
            side: 'top',
          },
        },
        {
          element: '#gamification-add-achievement',
          popover: {
            title: 'Criar Desafio 🚀',
            description: 'Configure uma nova conquista. Defina as regras (dias seguidos, quantidade, período), o prêmio em XP e o ícone da medalha.',
            side: 'left',
          },
        },
        {
          popover: {
            title: 'Pronto para Gamificar! 🎮',
            description: 'Agora você tem todas as ferramentas para criar um ambiente competitivo e motivador. Configure suas regras e veja o engajamento decolar!',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('gamification_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startRaffleTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          popover: {
            title: 'Sorteios Rápidos e Justos 🎁',
            description: 'Bem-vindo à ferramenta de sorteios! Aqui você pode realizar sorteios profissionais para sua audiência em segundos.',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#raffle-numbers-tab',
          popover: {
            title: 'Sorteio de Números 🔢',
            description: 'Defina um intervalo (ex: 1 a 100) e a quantidade de números a serem sorteados. Ideal para rifas e sorteios numéricos.',
            side: 'bottom',
          },
        },
        {
          element: '#raffle-names-tab',
          popover: {
            title: 'Sorteio de Nomes 📝',
            description: 'Cole uma lista de nomes (um por linha) para sortear ganhadores diretamente. Perfeito para listas de presença ou comentários.',
            side: 'bottom',
          },
        },
        {
          element: '#raffle-import-tab',
          popover: {
            title: 'Importar Lista 📂',
            description: 'Tem uma lista grande? Importe arquivos CSV ou TXT diretamente para realizar o sorteio sem precisar copiar e colar.',
            side: 'bottom',
          },
        },
        {
          element: '#raffle-result-area',
          popover: {
            title: 'Área de Resultados 🎉',
            description: 'Aqui é onde a mágica acontece! Os resultados aparecerão com uma animação de suspense e celebração.',
            side: 'left',
          },
        },
        {
          popover: {
            title: 'Tudo Pronto! 🚀',
            description: 'Agora é só configurar e clicar em "Sortear Agora". Boa sorte aos participantes!',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('raffle_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startRouletteTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          popover: {
            title: 'Roleta Criativa 🎲',
            description: 'Sem ideias para postar? A Roleta Criativa é sua aliada contra o bloqueio criativo! Vamos ver como funciona.',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#roulette-wheel',
          popover: {
            title: 'Sua Roda de Ideias 🎡',
            description: 'Aqui estão seus desafios. Cada fatia representa uma ideia de conteúdo diferente. Você pode personalizar tudo!',
            side: 'right',
          },
        },
        {
          element: '#roulette-spin-btn',
          popover: {
            title: 'Girar a Roleta 💫',
            description: 'Clique aqui para girar! A roleta escolherá aleatoriamente um desafio para você cumprir hoje.',
            side: 'top',
          },
        },
        {
          element: '#roulette-result-card',
          popover: {
            title: 'O Desafio Escolhido 🎯',
            description: 'O resultado aparecerá aqui com destaque. Aceite o desafio e crie um conteúdo incrível!',
            side: 'left',
          },
        },
        {
          element: '#roulette-manage-btn',
          popover: {
            title: 'Personalizar Opções ✏️',
            description: 'Quer usar suas próprias ideias? Clique aqui para adicionar, editar ou remover os desafios da roleta.',
            side: 'bottom',
          },
        },
        {
          popover: {
            title: 'Mãos à Obra! 🚀',
            description: 'Agora é com você. Gire a roleta e divirta-se criando conteúdo!',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('roulette_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startWhatsAppTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          popover: {
            title: 'Gerador de Links WhatsApp 💬',
            description: 'Crie links personalizados para facilitar o contato dos seus clientes. Vamos ver como é simples!',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#whatsapp-phone-input',
          popover: {
            title: 'Número do WhatsApp 📱',
            description: 'Digite o número com DDD. Não se preocupe com a formatação, nós cuidamos disso.',
            side: 'bottom',
          },
        },
        {
          element: '#whatsapp-message-input',
          popover: {
            title: 'Mensagem Personalizada ✍️',
            description: 'Escreva uma mensagem que aparecerá pronta para seu cliente enviar. Ex: "Olá, vim pelo Instagram!"',
            side: 'bottom',
          },
        },
        {
          element: '#whatsapp-preview-card',
          popover: {
            title: 'Link Gerado ✅',
            description: 'Seu link aparecerá aqui. Você pode copiá-lo ou testar para garantir que está tudo certo.',
            side: 'left',
          },
        },
        {
          element: '#whatsapp-preview-mockup',
          popover: {
            title: 'Pré-visualização 👀',
            description: 'Veja exatamente como a mensagem aparecerá no celular do seu cliente antes de compartilhar o link.',
            side: 'top',
          },
        },
        {
          popover: {
            title: 'Pronto para Compartilhar! 🚀',
            description: 'Agora é só copiar seu link e colocar na Bio, Stories ou enviar para seus contatos.',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('whatsapp_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startWorkflowsTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
           popover: {
             title: 'Mapa Mental ⚡',
             description: 'Bem-vindo ao construtor de mapas mentais! Aqui você pode criar quadros de ensino poderosos e formulários interativos para reuniões ou organização pessoal.',
             side: 'over',
             align: 'center',
           },
         },
        {
          element: '#workflow-header',
          popover: {
            title: 'Gerenciamento de Mapas Mentais 📂',
            description: 'Aqui você tem uma visão geral de todos os seus mapas mentais criados, ativos e inativos.',
            side: 'bottom',
          },
        },
        {
          element: '#workflow-search',
          popover: {
            title: 'Busca Rápida 🔍',
            description: 'Encontre seus mapas mentais facilmente pelo nome ou descrição.',
            side: 'bottom',
          },
        },
        {
          element: '#workflow-new-btn',
          popover: {
            title: 'Criar Novo Mapa Mental ✨',
            description: 'Clique aqui para começar um novo projeto do zero. Vamos criar algo incrível!',
            side: 'left',
          },
        },
        {
          element: '#workflow-list-grid',
          popover: {
            title: 'Seus Mapas Mentais 📋',
            description: 'Seus projetos aparecerão aqui. Você pode editar, duplicar ou excluir cada um deles.',
            side: 'top',
          },
        },
        {
          popover: {
            title: 'Vamos Criar! 🚀',
            description: 'Agora que você conhece a lista, clique em "Novo Mapa Mental" ou abra um existente para ver o editor visual.',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('workflows_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  const startWorkflowEditorTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      doneBtnText: 'Concluir',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      progressText: 'Passo {{current}} de {{total}}',
      steps: [
        {
          popover: {
            title: 'Editor Visual 🎨',
            description: 'Este é o seu canvas de criação. Aqui você desenha seus mapas mentais arrastando e conectando elementos.',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#workflow-editor-panel',
          popover: {
            title: 'Painel de Controle 🎛️',
            description: 'Dê um nome ao seu mapa mental, adicione novos nós (etapas) e salve seu progresso aqui.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#workflow-add-node-btn',
          popover: {
            title: 'Adicionar Etapas ➕',
            description: 'Clique para adicionar novos blocos ao seu mapa mental. Cada bloco pode conter campos de formulário, mensagens ou ações.',
            side: 'bottom',
          },
        },
        {
          element: '.react-flow__pane',
          popover: {
            title: 'Área de Trabalho 🖱️',
            description: 'Arraste os blocos para organizar. Clique nas bolinhas (conectores) e arraste até outro bloco para criar uma conexão.',
            side: 'over',
          },
        },
        {
          element: '.react-flow__controls',
          popover: {
            title: 'Navegação 🗺️',
            description: 'Use estes controles para dar zoom, centralizar e navegar pelo seu mapa mental.',
            side: 'top',
          },
        },
        {
          element: '#workflow-save-btn',
          popover: {
            title: 'Salvar Progresso 💾',
            description: 'Não esqueça de salvar suas alterações! O botão fica sempre à mão aqui no topo.',
            side: 'left',
          },
        },
        {
          popover: {
            title: 'Mãos à Obra! 🚀',
            description: 'Comece adicionando seu primeiro nó e conectando as ideias. Boa criação!',
            side: 'over',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem('workflow_editor_tutorial_completed', 'true');
      },
    });

    driverObj.drive();
  };

  return { 
    startTutorial, 
    startDashboardTutorial, 
    startGamificationTutorial, 
    startRaffleTutorial, 
    startRouletteTutorial, 
    startWhatsAppTutorial,
    startWorkflowsTutorial,
    startWorkflowEditorTutorial
  };
};
