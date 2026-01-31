import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-purple-600">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ao utilizar nossa plataforma, você concorda com as regras e condições descritas abaixo. Por favor, leia com atenção.
            </p>
          </div>

          <GlassCard className="p-6 md:p-10 space-y-8">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                    Aceitação dos Termos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao criar uma conta ou acessar a plataforma, você confirma que leu, entendeu e concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                    Conta do Usuário
                  </h2>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li><strong>Elegibilidade:</strong> Você deve ter pelo menos 18 anos ou a maioridade legal em sua jurisdição para usar a plataforma.</li>
                    <li><strong>Segurança:</strong> Você é responsável por manter a confidencialidade de suas credenciais de login e por todas as atividades que ocorram em sua conta.</li>
                    <li><strong>Veracidade:</strong> Você concorda em fornecer informações verdadeiras, precisas e completas durante o cadastro e mantê-las atualizadas.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                    Uso da Plataforma
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    É estritamente proibido usar a plataforma para:
                  </p>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li>Violar leis ou regulamentos locais, nacionais ou internacionais.</li>
                    <li>Hospedar ou transmitir conteúdo ilegal, ofensivo, ameaçador, difamatório ou que viole direitos de terceiros.</li>
                    <li>Tentar obter acesso não autorizado a sistemas, redes ou contas de outros usuários.</li>
                    <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte da plataforma.</li>
                    <li>Interferir ou interromper a integridade ou o desempenho dos serviços.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                    Propriedade Intelectual
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Todos os direitos, títulos e interesses relativos à plataforma e seu conteúdo (incluindo software, design, logotipos e marcas) são de propriedade exclusiva da nossa empresa ou de nossos licenciadores. O uso da plataforma não lhe confere qualquer direito de propriedade sobre a mesma.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                    Planos e Pagamentos
                  </h2>
                  <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
                    <li><strong>Assinaturas:</strong> Alguns recursos exigem assinatura paga. Os valores e ciclos de cobrança são descritos no momento da contratação.</li>
                    <li><strong>Renovação:</strong> As assinaturas são renovadas automaticamente, a menos que canceladas antes do fim do período vigente.</li>
                    <li><strong>Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através do painel de controle. O acesso aos recursos pagos continuará até o fim do ciclo faturado.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                    Limitação de Responsabilidade
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A plataforma é fornecida "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais ou consequentes decorrentes do uso ou incapacidade de uso da plataforma.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">7</span>
                    Alterações nos Termos
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Podemos atualizar estes Termos de Uso periodicamente. Notificaremos sobre alterações significativas através da plataforma ou por e-mail. O uso contínuo após as alterações constitui aceitação dos novos termos.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="bg-neon-blue/10 text-neon-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">8</span>
                    Contato
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Para questões relacionadas a estes Termos de Uso, entre em contato através do nosso suporte.
                  </p>
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
