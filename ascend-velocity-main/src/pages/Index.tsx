import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SplineHero } from "@/components/SplineHero";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Gift, Trophy, MessageCircle } from "lucide-react";

const Index = () => {
  const features = [
    {
      title: "Link na Bio",
      description: "Crie uma página personalizada com todos os seus links importantes. Estilo e conversão em um só lugar.",
      icon: Zap,
      color: "text-yellow-400"
    },
    {
      title: "Sorteios",
      description: "Realize sorteios justos e transparentes. Importe nomes ou use números para engajar sua audiência.",
      icon: Gift,
      color: "text-purple-400"
    },
    {
      title: "Gamificação",
      description: "Mantenha sua equipe motivada com níveis, conquistas e recompensas. Transforme trabalho em jogo.",
      icon: Trophy,
      color: "text-blue-400"
    },
    {
      title: "Gerador de WhatsApp",
      description: "Crie links diretos para WhatsApp com mensagens personalizadas. Facilite o contato com seus clientes.",
      icon: MessageCircle,
      color: "text-green-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full glass-card border-neon-blue/30 text-neon-blue text-sm font-medium animate-pulse">
                Plataforma 2.0 ✨
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Tudo o que você precisa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">crescer online</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Uma suíte completa de ferramentas para criadores, empreendedores e equipes. Link na bio, sorteios, gamificação e muito mais.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/signup">
                  <NeonButton className="flex items-center gap-2">
                    Começar Agora <ArrowRight className="w-4 h-4" />
                  </NeonButton>
                </Link>
                <Link to="/about">
                  <NeonButton variant="glass">Saiba Mais</NeonButton>
                </Link>
              </div>
            </div>
            <div className="h-[400px] lg:h-[600px] w-full hidden md:block">
              <SplineHero />
            </div>
            {/* Fallback for mobile if Spline is too heavy or layout issues, though SplineHero has w-full h-full */}
            <div className="h-[300px] w-full md:hidden bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-2xl flex items-center justify-center glass-card">
                 <Trophy className="w-24 h-24 text-neon-blue opacity-50" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Funcionalidades Poderosas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubra como nossa plataforma pode ajudar você a alcançar seus objetivos com ferramentas intuitivas e eficientes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={index} hover className="h-full flex flex-col items-start gap-4 p-6">
                <div className={`p-3 rounded-xl bg-background/50 ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <GlassCard className="max-w-4xl mx-auto text-center p-12 space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 pointer-events-none" />
            <h2 className="text-3xl md:text-4xl font-bold relative z-10">
              Pronto para transformar sua presença digital?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto relative z-10">
              Junte-se a milhares de usuários que já estão usando nossa plataforma para crescer e engajar sua audiência.
            </p>
            <div className="relative z-10 inline-block">
                <Link to="/signup">
                  <NeonButton className="px-8 text-lg">
                    Criar Conta Gratuita
                  </NeonButton>
                </Link>
            </div>
          </GlassCard>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
