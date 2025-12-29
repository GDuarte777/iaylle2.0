import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { SplineHero } from "@/components/SplineHero";
import { DotScreenShader } from "@/components/ui/dot-shader-background";
import { Link } from "react-router-dom";
import { usePlansStore } from "@/store/plansStore";
import {
  Trophy,
  Target,
  Zap,
  Users,
  TrendingUp,
  Award,
  Calendar,
  BarChart3,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Landing() {
  const { plans: dbPlans, fetchPlans, loading } = usePlansStore();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const features = [
    {
      icon: Trophy,
      title: "Sistema de Conquistas",
      description: "Crie conquistas personalizadas que motivam e recompensam o desempenho da equipe.",
    },
    {
      icon: Target,
      title: "Níveis e XP",
      description: "Sistema de progressão com níveis customizáveis que mostram a evolução de cada membro.",
    },
    {
      icon: Calendar,
      title: "Calendário Gamificado",
      description: "Acompanhe o progresso diário com visualização clara e intuitiva.",
    },
    {
      icon: Users,
      title: "Gestão de Equipes",
      description: "Administre múltiplas afiliadas e membros com facilidade.",
    },
    {
      icon: BarChart3,
      title: "Ranking em Tempo Real",
      description: "Leaderboard dinâmico que incentiva a competição saudável.",
    },
    {
      icon: Award,
      title: "Missões Personalizadas",
      description: "Defina missões globais e individuais com regras flexíveis.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Crie sua Equipe",
      description: "Adicione membros e configure seus perfis com avatares e informações.",
    },
    {
      number: "02",
      title: "Defina Regras",
      description: "Configure níveis, conquistas, XP e missões personalizadas.",
    },
    {
      number: "03",
      title: "Acompanhe o Progresso",
      description: "Monitore em tempo real o desempenho através do dashboard.",
    },
    {
      number: "04",
      title: "Celebre Conquistas",
      description: "Veja sua equipe crescer e conquistar resultados extraordinários.",
    },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Gerente de Vendas",
      content: "GameTeam transformou completamente a motivação da minha equipe. Resultados 40% melhores!",
      avatar: "MS",
    },
    {
      name: "João Santos",
      role: "Diretor Comercial",
      content: "A gamificação fez o trabalho se tornar mais engajador. Equipe mais feliz e produtiva.",
      avatar: "JS",
    },
    {
      name: "Ana Costa",
      role: "Coordenadora",
      content: "Ferramenta incrível! Fácil de usar e com impacto real na performance do time.",
      avatar: "AC",
    },
  ];

  const enterprisePlan = {
    id: 'enterprise',
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    gatewayId: null as string | null,
    features: [
      "Membros ilimitados",
      "API de integração",
      "Gerente dedicado",
      "Treinamento completo",
      "SLA garantido",
    ],
    isPopular: false,
  };

  const displayPlans = [
    ...dbPlans.map(p => ({
      id: p.id,
      name: p.name,
      price: `R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
      period: p.interval === 'monthly' ? '/mês' : '/ano',
      features: p.features.filter(f => f.included).map(f => f.text),
      isPopular: p.isPopular,
      gatewayId: p.gatewayId
    })),
    enterprisePlan
  ];

  const faqs = [
    {
      question: "Como funciona o sistema de XP?",
      answer: "Cada ação da equipe gera pontos de experiência (XP) que acumulam para subir de nível. Você define quanto XP cada atividade vale.",
    },
    {
      question: "Posso personalizar as conquistas?",
      answer: "Sim! Você pode criar conquistas totalmente personalizadas com nomes, regras e pontuações próprias.",
    },
    {
      question: "Quantas equipes posso gerenciar?",
      answer: "Depende do plano. No Professional você pode ter até 5 equipes, e no Enterprise, ilimitado.",
    },
    {
      question: "Tem período de teste?",
      answer: "Sim! Oferecemos 14 dias de teste grátis em todos os planos, sem necessidade de cartão de crédito.",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <DotScreenShader />
      </div>
      <Header />

      {/* Hero Section with 3D Robot */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text Content */}
          <div className="max-w-xl animate-fade-in-up order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Zap className="w-4 h-4 text-neon-blue" />
              <span className="text-sm">Transforme trabalho em jogo</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Gamifique o desempenho da sua{" "}
              <span className="gradient-text">equipe</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Conquistas, níveis, XP e progressão transformam o trabalho em jogo.
              Motive sua equipe a alcançar resultados extraordinários.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <NeonButton variant="neon" className="text-lg px-8 py-4">
                  Começar Grátis
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </NeonButton>
              </Link>
              <Link to="/about">
                <NeonButton variant="glass" className="text-lg px-8 py-4">
                  Ver Como Funciona
                </NeonButton>
              </Link>
            </div>
          </div>

          {/* Right - 3D Robot */}
          <div className="order-1 lg:order-2 animate-fade-in">
            <SplineHero />
          </div>
        </div>
      </section>

      {/* Mock Dashboard Preview */}
      <section className="container mx-auto px-4 pb-20">
        <GlassCard className="p-8 animate-scale-in">
          <div className="aspect-video bg-gradient-to-br from-muted to-background rounded-xl flex items-center justify-center border border-border">
            <div className="text-center">
              <BarChart3 className="w-20 h-20 mx-auto mb-4 text-neon-blue animate-glow" />
              <p className="text-muted-foreground">Dashboard Preview</p>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Recursos Poderosos</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para criar uma experiência de gamificação profissional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <GlassCard key={index} hover className="animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Como Funciona</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Começe a gamificar sua equipe em 4 passos simples
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <GlassCard key={index} className="text-center animate-fade-in">
              <div className="text-6xl font-bold gradient-text mb-4">{step.number}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">O Que Dizem Nossos Clientes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <GlassCard key={index} hover className="animate-fade-in">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-neon-blue text-neon-blue" />
                ))}
              </div>
              <p className="text-foreground mb-6">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Planos e Preços</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o tamanho da sua equipe
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {loading ? (
             <div className="col-span-3 text-center text-muted-foreground">Carregando planos...</div>
          ) : displayPlans.map((plan, index) => (
            <GlassCard
              key={plan.id || index}
              hover
              className={plan.isPopular ? "border-2 border-neon-blue relative" : ""}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-neon-blue to-neon-violet rounded-full text-sm font-medium">
                  Mais Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-neon-blue flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.id === "enterprise" ? (
                <Link to="/support" className="block">
                  <NeonButton
                    variant={plan.isPopular ? "neon" : "glass"}
                    className="w-full"
                  >
                    Falar com Vendas
                  </NeonButton>
                </Link>
              ) : plan.gatewayId ? (
                <Link to={`/checkout?plan=${plan.id}`} className="block">
                  <NeonButton
                    variant={plan.isPopular ? "neon" : "glass"}
                    className="w-full"
                  >
                    Escolher Plano
                  </NeonButton>
                </Link>
              ) : (
                <NeonButton
                  variant={plan.isPopular ? "neon" : "glass"}
                  className="w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  Indisponível
                </NeonButton>
              )}
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Perguntas Frequentes</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <GlassCard key={index} hover>
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <GlassCard className="text-center p-12">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para transformar sua equipe?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comece hoje mesmo e veja o engajamento da sua equipe crescer exponencialmente
          </p>
          <Link to="/signup">
            <NeonButton variant="neon" className="text-lg px-8 py-4">
              Começar Grátis por 14 Dias
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </NeonButton>
          </Link>
        </GlassCard>
      </section>

      <Footer />
    </div>
  );
}
