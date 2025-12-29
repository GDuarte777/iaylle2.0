import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Link } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";
import { DotScreenShader } from "@/components/ui/dot-shader-background";
import { usePlansStore } from "@/store/plansStore";

export default function Pricing() {
  const { plans, fetchPlans, loading } = usePlansStore();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const faqs = [
    {
      question: "Posso mudar de plano depois?",
      answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.",
    },
    {
      question: "O que acontece se eu exceder o limite de membros?",
      answer: "Você receberá uma notificação para fazer upgrade do plano. Seus dados continuam seguros.",
    },
    {
      question: "Tem desconto para pagamento anual?",
      answer: "Sim! No pagamento anual você ganha 2 meses grátis (economize 16%).",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, sem multas ou taxas. Seus dados ficam disponíveis por 30 dias após cancelamento.",
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
            Planos para <span className="gradient-text">qualquer equipe</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal e comece a transformar sua equipe hoje mesmo.
            14 dias grátis, sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {loading ? (
             <div className="col-span-3 text-center text-muted-foreground">Carregando planos...</div>
          ) : plans.length > 0 ? (
            plans.map((plan, index) => (
              <GlassCard
                key={plan.id}
                hover
                className={`p-8 ${
                  plan.isPopular
                    ? "border-2 border-neon-blue relative lg:scale-105"
                    : ""
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-neon-blue to-neon-violet rounded-full text-sm font-semibold">
                    Mais Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">
                    {plan.description}
                  </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold">
                      R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-muted-foreground text-lg">
                      /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {plan.gatewayId ? (
                    <Link to={`/checkout?plan=${plan.id}`}>
                      <NeonButton
                        variant={plan.isPopular ? "neon" : "glass"}
                        className="w-full"
                      >
                        Começar Grátis
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
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <CheckCircle2 className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))
          ) : (
            <div className="col-span-3 text-center text-muted-foreground">Nenhum plano disponível no momento.</div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Perguntas Frequentes</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <GlassCard key={index} hover className="p-6">
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <GlassCard className="text-center p-12 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ainda tem dúvidas?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Nossa equipe está pronta para ajudar você a escolher o melhor plano
          </p>
          <Link to="/support">
            <NeonButton variant="neon" className="text-lg px-8 py-4">
              Falar com Especialista
            </NeonButton>
          </Link>
        </GlassCard>
      </section>

      <Footer />
    </div>
  );
}
