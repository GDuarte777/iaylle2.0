import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8 text-sm md:text-base">
            Este documento explica de forma clara como coletamos, utilizamos e protegemos os dados pessoais tratados pela plataforma.
          </p>
          <GlassCard className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">1. Controlador dos Dados</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                A plataforma é responsável pelo tratamento dos dados pessoais inseridos por você no uso do produto, incluindo informações de conta, métricas de desempenho e dados de afiliados cadastrados.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">2. Dados Coletados</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Coletamos dados como nome, email, foto de perfil, identificadores de conta, dados de login, registros de uso da plataforma, informações de afiliados e métricas gamificadas utilizadas para exibir rankings, níveis e calendários.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">3. Finalidades do Tratamento</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Utilizamos os dados para autenticação, personalização da experiência, funcionamento dos recursos de gamificação, geração de relatórios de performance, suporte ao usuário, prevenção a fraudes e melhorias contínuas do produto.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">4. Compartilhamento de Dados</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Não comercializamos dados pessoais. As informações podem ser compartilhadas apenas com provedores de infraestrutura, ferramentas analíticas e outros parceiros estritamente necessários para operação do serviço, sempre sob obrigações de confidencialidade.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">5. Direitos do Titular</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Você pode solicitar acesso, correção, atualização ou exclusão dos seus dados pessoais, além de informações sobre o compartilhamento, por meio dos canais oficiais de suporte da plataforma.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">6. Segurança da Informação</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados pessoais contra acessos não autorizados, perda, alteração ou destruição, mantendo controles compatíveis com a natureza das informações tratadas.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">7. Atualizações desta Política</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Esta política pode ser atualizada para refletir ajustes legais ou melhorias no produto. Quando isso ocorrer, a versão vigente será sempre exibida nesta página.
              </p>
            </div>
          </GlassCard>
        </section>
      </main>
      <Footer />
    </div>
  );
}
