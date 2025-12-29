import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { Trophy, Users, Target, Zap, BarChart3, Award } from "lucide-react";
import { DotScreenShader } from "@/components/ui/dot-shader-background";

export default function About() {
  const values = [
    {
      icon: Trophy,
      title: "Excelência",
      description: "Buscamos a melhor experiência em gamificação para equipes.",
    },
    {
      icon: Users,
      title: "Colaboração",
      description: "Acreditamos no poder das equipes unidas por objetivos comuns.",
    },
    {
      icon: Target,
      title: "Resultados",
      description: "Focados em gerar impacto real no desempenho das empresas.",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <DotScreenShader />
      </div>
      <Navigation />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Sobre a <span className="gradient-text">GameTeam</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transformamos equipes através da gamificação, criando experiências que motivam,
            engajam e geram resultados extraordinários.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <GlassCard className="p-8">
            <div className="aspect-square bg-gradient-to-br from-neon-blue/20 to-neon-violet/20 rounded-2xl flex items-center justify-center">
              <Zap className="w-32 h-32 text-neon-blue animate-glow" />
            </div>
          </GlassCard>
          
          <div className="animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">Nossa Missão</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Acreditamos que o trabalho pode ser tão envolvente quanto um jogo.
              Nossa missão é transformar a rotina das equipes em uma jornada
              gamificada, onde cada membro se sente motivado a crescer e conquistar.
            </p>
            <p className="text-lg text-muted-foreground">
              Com GameTeam, gestores têm controle total para personalizar níveis,
              conquistas e missões, criando um ambiente de trabalho único que
              reflete a cultura da empresa.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Nossos Valores</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Princípios que guiam cada decisão e cada linha de código
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <GlassCard key={index} hover className="text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center mx-auto mb-4">
                <value.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">O Que Oferecemos</h2>
        </div>

        <div className="space-y-20">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Sistema de Conquistas</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Crie conquistas totalmente personalizadas que refletem os objetivos
                do seu negócio. Defina regras, pontuações e critérios únicos.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Conquistas globais para toda equipe</li>
                <li>✓ Conquistas individuais personalizadas</li>
                <li>✓ Emblemas e badges visuais</li>
                <li>✓ Sistema de notificações em tempo real</li>
              </ul>
            </div>
            <GlassCard className="p-8">
              <div className="aspect-square bg-gradient-to-br from-muted to-background rounded-xl flex items-center justify-center">
                <Award className="w-32 h-32 text-neon-turquoise animate-glow" />
              </div>
            </GlassCard>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <GlassCard className="p-8 lg:order-first">
              <div className="aspect-square bg-gradient-to-br from-muted to-background rounded-xl flex items-center justify-center">
                <BarChart3 className="w-32 h-32 text-neon-violet animate-glow" />
              </div>
            </GlassCard>
            <div className="animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-violet to-neon-turquoise flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Analytics Avançado</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Acompanhe métricas detalhadas do desempenho individual e coletivo
                da sua equipe com dashboards intuitivos.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Gráficos de progressão em tempo real</li>
                <li>✓ Comparativos de performance</li>
                <li>✓ Relatórios exportáveis</li>
                <li>✓ Insights baseados em dados</li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-turquoise to-neon-blue flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Personalização Total</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Adapte cada aspecto da gamificação às necessidades da sua empresa.
                Você tem controle total sobre como tudo funciona.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Níveis customizados com nomes únicos</li>
                <li>✓ XP configurável por atividade</li>
                <li>✓ Missões com regras flexíveis</li>
                <li>✓ Visual adaptável à sua marca</li>
              </ul>
            </div>
            <GlassCard className="p-8">
              <div className="aspect-square bg-gradient-to-br from-muted to-background rounded-xl flex items-center justify-center">
                <Target className="w-32 h-32 text-neon-blue animate-glow" />
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
