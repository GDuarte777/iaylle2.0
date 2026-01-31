import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { GamificationHeroAnimation } from "@/components/GamificationHeroAnimation";
import { FeatureMockupRoulette, FeatureMockupWhatsApp, FeatureMockupRaffle, FeatureMockupWorkflow } from "@/components/FeatureAnimations";
import { DotScreenShader } from "@/components/ui/dot-shader-background";
import { Link } from "react-router-dom";
import { usePlansStore } from "@/store/plansStore";
import { SocialProof } from "@/components/SocialProof";
import { Logo } from "@/components/Logo";
import {
  Trophy,
  Target,
  Zap,
  Users,
  BarChart3,
  Award,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Smartphone,
  Play,
  Star
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// --- Components ---


const FeatureMockupLinkBio = () => {
  return (
    <div className="relative w-full h-48 flex justify-center items-end overflow-hidden bg-black/20 rounded-lg">
      <motion.div
        initial={{ y: 100 }}
        whileInView={{ y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="w-32 h-40 bg-black rounded-t-2xl border-t border-x border-white/20 relative p-3 shadow-2xl"
      >
        {/* Profile */}
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-pink to-neon-orange mx-auto mb-2" 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-16 h-2 bg-white/20 rounded-full mx-auto mb-4" 
        />

        {/* Links */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="w-full h-6 rounded-md bg-white/10 border border-white/5 hover:bg-neon-pink/20 hover:border-neon-pink/40 transition-colors flex items-center px-2"
            >
              <div className="w-full h-1.5 bg-white/20 rounded-full" />
            </motion.div>
          ))}
        </div>

        {/* Cursor Animation */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: [20, 0, 0, 20],
            y: [20, -30, -30, 20]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            repeatDelay: 2,
            times: [0, 0.2, 0.8, 1]
          }}
          className="absolute bottom-4 right-4 pointer-events-none z-20"
        >
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-white transform -rotate-[30deg] drop-shadow-md" />
        </motion.div>
      </motion.div>
    </div>
  );
};

const FeatureMockupGamification = () => (
  <div className="relative w-full h-48 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-t from-neon-violet/20 to-transparent" />
    <div className="text-center z-10">
      <div className="relative inline-block">
        <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
        <motion.div 
          className="absolute -top-2 -right-2 bg-neon-magenta text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          LVL 10
        </motion.div>
      </div>
      <div className="mt-4 w-48 h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-neon-blue to-neon-violet"
          initial={{ width: "0%" }}
          whileInView={{ width: "75%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">750 / 1000 XP</p>
    </div>
  </div>
);

export default function LandingNew() {
  const { plans: dbPlans, fetchPlans, loading } = usePlansStore();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const displayPlans = dbPlans.map(p => ({
    ...p,
    price: `R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    originalPriceFormatted: p.originalPrice ? `R$ ${p.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
    period: p.interval === 'monthly' ? '/mês' : '/ano',
  }));

  const maxTrialDays = dbPlans.length > 0 
    ? Math.max(...dbPlans.map(p => p.trialDays || 0)) 
    : 14;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-neon-blue/30 selection:text-neon-blue">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-blue via-neon-violet to-neon-magenta transform origin-left z-50"
        style={{ scaleX }}
      />
      
      <div className="absolute inset-0 z-0">
        <DotScreenShader />
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-8 md:mb-12 flex justify-center w-full animate-fade-in-up">
            <Logo className="h-16 md:h-24 lg:h-32 w-auto drop-shadow-[0_0_35px_rgba(214,0,214,0.4)]" alt="Guildas" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                </span>
                <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Guildas Disponível</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                Sua Gestão com <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-violet to-neon-magenta animate-gradient-x">
                  Gamificação
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-4 leading-relaxed max-w-lg">
                Crie suas próprias regras na gamificação. Faça a gestão de suas afiliadas, engaje sua equipe, crie mapas mentais e celebre conquistas em uma única plataforma.
              </p>

              <ol className="list-decimal list-inside space-y-2 mb-8 text-muted-foreground text-sm font-medium">
                <li>Suas afiliadas terão um calendário pessoal.</li>
                <li>Marque no calendário de cada afiliada, o progresso delas.</li>
                <li>Decida quantos pontos elas recebem por marcação.</li>
              </ol>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <NeonButton variant="neon" className="h-14 px-8 text-lg w-full sm:w-auto shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </NeonButton>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-full flex justify-center lg:justify-end"
            >
              <GamificationHeroAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-24 relative bg-black/20 backdrop-blur-sm border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ferramentas de Gestão</h2>
            <p className="text-lg text-muted-foreground">
              Um ecossistema completo de ferramentas interconectadas para maximizar a produtividade e o engajamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
            {/* Card 1: Gamification (Large) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="lg:col-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-full bg-black/40 backdrop-blur-md rounded-[22px] p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden">
                <div className="flex-1 z-10">
                  <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center mb-6 text-neon-blue">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Gamificação Completa</h3>
                  <p className="text-muted-foreground mb-6">
                    Sistema robusto de XP, níveis, conquistas e rankings. Crie uma cultura de alta performance onde o trabalho é recompensado instantaneamente.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon-blue" /> Crie suas regras de gamificação</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon-blue" /> Ranking em tempo real</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon-blue" /> Medalhas personalizáveis</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon-blue" /> Feed de atividades</li>
                  </ul>
                </div>
                <div className="flex-1 w-full max-w-sm relative">
                   <FeatureMockupGamification />
                </div>
              </div>
            </motion.div>

            {/* Card 2: Workflow */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1"
            >
              <div className="h-full bg-black/40 backdrop-blur-md rounded-[22px] p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-neon-violet/20 flex items-center justify-center mb-4 text-neon-violet">
                  <Workflow className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mapa Mental</h3>
                <p className="text-sm text-muted-foreground mb-6">Crie mapas mentais para reuniões ou organização pessoal.</p>
                <div className="mt-auto">
                  <FeatureMockupWorkflow />
                </div>
              </div>
            </motion.div>

            {/* Card 3: Link Bio */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1"
            >
              <div className="h-full bg-black/40 backdrop-blur-md rounded-[22px] p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center mb-4 text-neon-pink">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2">Link na Bio</h3>
                <p className="text-sm text-muted-foreground mb-6">Crie uma landing page pessoal incrível em segundos para suas redes sociais.</p>
                <div className="mt-auto">
                  <FeatureMockupLinkBio />
                </div>
              </div>
            </motion.div>

            {/* Card 4: More Tools (Grid) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="lg:col-span-2 relative group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1"
            >
              <div className="h-full bg-black/40 backdrop-blur-md rounded-[22px] p-8">
                <h3 className="text-2xl font-bold mb-6">E muito mais...</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 hover:border-neon-green/50 transition-colors overflow-hidden h-[200px]">
                    <FeatureMockupRoulette />
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 hover:border-neon-orange/50 transition-colors overflow-hidden h-[200px]">
                    <FeatureMockupWhatsApp />
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 hover:border-neon-blue/50 transition-colors overflow-hidden h-[200px]">
                    <FeatureMockupRaffle />
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <Link to="/signup">
                    <NeonButton variant="glass" className="px-8">
                      Criar Conta Gratuita
                    </NeonButton>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Message Section */}
      <section className="py-24 relative bg-black/40 backdrop-blur-md border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Founder Image */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-2 md:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl max-w-md mx-auto md:mr-4 lg:mr-auto">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <img 
                  src="https://i.postimg.cc/7LK7q5rj/IMG-4625-JPG.jpg" 
                  alt="Fundadores da Guildas" 
                  className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-6 left-6 z-20">
                  <div className="text-white font-bold text-xl">Gabriel Duarte / Aylle Duarte</div>
                  <div className="text-neon-blue font-medium text-sm">Fundadores da Guildas</div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -z-10 top-10 -left-10 w-32 h-32 bg-neon-blue/20 rounded-full blur-[40px]" />
              <div className="absolute -z-10 -bottom-10 -right-10 w-40 h-40 bg-neon-violet/20 rounded-full blur-[50px]" />
            </motion.div>

            {/* Founder Message Content */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-1 md:order-2"
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neon-blue text-xs font-bold uppercase tracking-wider mb-4">
                  <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                  Mensagem dos Fundadores
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  Nascido de uma <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-purple-400 to-white">
                    necessidade real
                  </span>
                </h2>
              </div>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <div className="relative pl-6 border-l-2 border-neon-blue/30">
                  <p className="italic text-gray-300 mb-4">
                    "A plataforma Guildas nasceu de uma necessidade real. 
                    Ao acompanhar de perto a gestão de afiliadas da minha esposa Aylle Duarte, na empresa Ybera, percebi o desafio de escalar equipes, manter engajamento e gerar performance de forma organizada.
                  </p>
                  <p className="italic text-gray-300">
                    Foi assim que criamos a Guildas: uma plataforma de gestão com gamificação, pensada para que gestoras possam criar sua própria gamificação para obter equipes mais engajadas, produtivas e focadas em resultados, com ferramentas essenciais para afiliadas e influenciadoras em um só lugar."
                  </p>
                  <p className="text-neon-blue font-semibold mt-4 text-base">
                    - Gabriel Duarte
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Guildas Section */}
      <section className="py-24 relative bg-black/20 backdrop-blur-sm border-y border-white/5 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                Por que o nome <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  Guildas?
                </span>
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Guildas sempre foram comunidades formadas por pessoas unidas por um propósito comum, onde o crescimento individual fortalecia o coletivo.
                </p>
                <p>
                  Na Guildas, esse conceito ganha vida através da gamificação:
                  metas se transformam em missões, resultados geram evolução de nível e o desempenho é reconhecido de forma clara e motivadora.
                </p>
                <p>
                  A gamificação aplicada de forma estratégica aumenta o engajamento, melhora a produtividade e facilita a escalabilidade das operações.
                </p>
              </div>
            </motion.div>

            {/* Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex justify-center items-center relative"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-neon-blue/20 blur-[100px] rounded-full" />
              
              {/* Animated Logo Container */}
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <div className="relative">
                  <Logo className="w-auto h-auto max-w-[280px] md:max-w-[400px] drop-shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-transform duration-500 hover:scale-105" alt="Guildas Logo Animation" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Planos Flexíveis</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece pequeno e cresça rápido. Teste qualquer plano por 14 dias grátis.
            </p>
          </div>

          {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
             </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto items-stretch">
              {displayPlans.map((plan, index) => (
                <motion.div
                  key={plan.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="w-full md:w-[350px]"
                >
                  <div 
                    className={`relative rounded-3xl p-1 h-full ${
                      plan.isPopular 
                        ? "bg-gradient-to-b from-neon-blue via-neon-violet to-neon-blue shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] scale-105 z-10" 
                        : "bg-white/10 hover:bg-white/20 transition-colors"
                    }`}
                  >
                    <div className="h-full bg-background/95 backdrop-blur-xl rounded-[20px] p-8 flex flex-col">
                      {plan.isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-neon-blue to-neon-violet rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                          Mais Popular
                        </div>
                      )}

                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description || "Para equipes que buscam alta performance."}</p>
                      </div>

                      <div className="mb-8 flex flex-col">
                        {plan.id === 'enterprise' ? (
                          <span className="text-4xl font-bold">Sob Consulta</span>
                        ) : (
                          <>
                            {plan.originalPriceFormatted && (
                                <span className="text-lg text-muted-foreground line-through font-medium block">
                                    {plan.originalPriceFormatted}
                                </span>
                            )}
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                                <span className="text-muted-foreground">{plan.period}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex-1 mb-8">
                        <ul className="space-y-4">
                          {plan.features.map((feature: any, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${feature.included ? 'text-neon-green' : 'text-gray-600'}`} />
                              <span className={feature.included ? 'text-gray-200' : 'text-gray-500 line-through'}>
                                {typeof feature === 'string' ? feature : feature.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link to={`/checkout?plan=${plan.id}`} className="mt-auto">
                        <NeonButton
                          variant={plan.isPopular ? "neon" : "glass"}
                          className="w-full h-12"
                        >
                          Começar Teste Grátis
                        </NeonButton>
                      </Link>
                      
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        Não requer cartão de crédito
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-blue/10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-[40px] p-12 md:p-20 overflow-hidden relative"
          >
            {/* Decorative background blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-neon-blue/30 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-magenta/30 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Sua equipe merece o <br />
              <span className="text-white">futuro da gamificação</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Junte-se a vários Gestores de equipes que já transformaram a produtividade de seus times com nossa plataforma.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/signup">
                <NeonButton variant="neon" className="h-16 px-10 text-xl w-full sm:w-auto">
                  Criar Conta Gratuita
                </NeonButton>
              </Link>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Teste grátis por {maxTrialDays} dias • Cancelamento a qualquer momento • Setup instantâneo
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
