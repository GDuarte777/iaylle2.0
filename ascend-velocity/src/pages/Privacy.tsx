import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-purple-600">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sua privacidade é nossa prioridade. Este documento detalha como tratamos seus dados pessoais com transparência e segurança, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </div>

          <GlassCard className="p-6 md:p-10 space-y-8">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                    Coleta de Dados
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Coletamos apenas os dados necessários para o funcionamento da plataforma e melhoria da sua experiência:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li><strong>Dados de Cadastro:</strong> Nome completo, endereço de e-mail e senha (criptografada).</li>
                    <li><strong>Dados de Perfil:</strong> Foto, biografia, cargo e informações profissionais opcionais.</li>
                    <li><strong>Dados de Uso:</strong> Registros de acesso, interações com funcionalidades (gamificação, links), e preferências de configuração.</li>
                    <li><strong>Dados de Pagamento:</strong> Histórico de transações e status de assinatura (processados de forma segura por nosso parceiro de pagamentos, Stripe).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                    Uso das Informações
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Utilizamos seus dados para as seguintes finalidades:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li>Fornecer e manter os serviços da plataforma, incluindo autenticação e recursos gamificados.</li>
                    <li>Processar pagamentos e gerenciar sua assinatura.</li>
                    <li>Enviar comunicações importantes sobre sua conta, atualizações de segurança e novidades do produto.</li>
                    <li>Personalizar sua experiência e o conteúdo exibido.</li>
                    <li>Melhorar e otimizar a plataforma através de análise de dados agregados e anônimos.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                    Compartilhamento de Dados
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Não vendemos seus dados pessoais. O compartilhamento ocorre apenas nas seguintes situações:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li><strong>Fornecedores de Serviço:</strong> Com parceiros confiáveis que nos ajudam a operar a plataforma (ex: processamento de pagamentos, hospedagem em nuvem), sob estritas obrigações de confidencialidade.</li>
                    <li><strong>Obrigação Legal:</strong> Quando exigido por lei ou ordem judicial.</li>
                    <li><strong>Proteção de Direitos:</strong> Para proteger os direitos, propriedade ou segurança da plataforma, seus usuários ou o público.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                    Cookies e Rastreamento
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Utilizamos cookies e tecnologias similares para:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li>Manter você conectado à sua conta.</li>
                    <li>Lembrar suas preferências e configurações.</li>
                    <li>Analisar o desempenho e uso da plataforma para melhorias.</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    Você pode gerenciar as preferências de cookies diretamente nas configurações do seu navegador.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                    Segurança de Dados
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Adotamos práticas robustas de segurança para proteger seus dados, incluindo:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li>Criptografia de dados em trânsito e em repouso.</li>
                    <li>Controles de acesso rigorosos aos nossos sistemas.</li>
                    <li>Monitoramento contínuo para detecção e prevenção de ameaças.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                    Seus Direitos (LGPD)
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    De acordo com a Lei Geral de Proteção de Dados, você tem direito a:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li>Confirmar a existência de tratamento de dados.</li>
                    <li>Acessar seus dados pessoais.</li>
                    <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                    <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                    <li>Revogar seu consentimento a qualquer momento.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">7</span>
                    Contato
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos, entre em contato conosco através do canal de suporte oficial ou pelo e-mail de privacidade.
                  </p>
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="font-medium text-foreground">Canal de Privacidade</p>
                    <p className="text-neon-blue">privacidade@plataforma.com</p>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </GlassCard>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
