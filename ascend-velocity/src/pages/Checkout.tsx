import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { usePlansStore } from "@/store/plansStore";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useSubscription } from "@/hooks/useSubscription";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("plan");
  const { plans, fetchPlans, loading } = usePlansStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { subscription, loading: loadingSub, refresh } = useSubscription();
  const sessionId = searchParams.get("session_id");
  const isSuccess = searchParams.get("success") === "1";
  
  const [cpf, setCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) return;
    const redirectTo = window.location.pathname + window.location.search;
    navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const selectedPlanFromDb = plans.find((p) => p.id === planId);

  useEffect(() => {
    if (loading) return;
    if (!planId) {
      navigate("/", { replace: true });
      return;
    }
    if (selectedPlanFromDb) return;

    toast.error("Plano não encontrado");
    navigate("/", { replace: true });
  }, [loading, planId, selectedPlanFromDb, navigate]);

  const canCheckout = Boolean(planId && selectedPlanFromDb?.gatewayId && !loadingSub);

  const selectedPlan = selectedPlanFromDb;

  const planPrice = selectedPlan?.price ?? 0;
  const planDiscountToday = planPrice;

  const planFeatures = useMemo(() => {
    if (!selectedPlan?.features) return [];
    return selectedPlan.features.filter((f) => f.included).map((f) => f.text);
  }, [selectedPlan?.features]);

  const hasActiveSubscription = Boolean(subscription && ["active", "trialing", "past_due"].includes(subscription.status));
  const subscriptionLabel =
    subscription?.status === "trialing"
      ? "em teste"
      : subscription?.status === "past_due"
        ? "com pagamento pendente"
        : subscription?.status === "active"
          ? "ativa"
          : "";

  useEffect(() => {
    if (!sessionId) return;
    if (hasActiveSubscription) return;

    let cancelled = false;
    const startedAt = Date.now();

    const run = async () => {
      while (!cancelled) {
        await refresh();
        if (Date.now() - startedAt > 60_000) return;
        await new Promise((r) => setTimeout(r, 2000));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, refresh, hasActiveSubscription]);

  const handleManageSubscription = async () => {
    try {
      const origin = window.location.origin;
      const returnUrl = `${origin}/dashboard/settings`;

      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: { returnUrl }
      });

      if (error) throw error;

      const url = (data as any)?.url as string | undefined;
      if (!url) throw new Error("URL do portal não retornada");

      window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao abrir portal: ${message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planId) {
      toast.error("Plano não selecionado ou inválido");
      return;
    }

    if (!canCheckout) {
      toast.error("Pagamento indisponível para este plano");
      return;
    }

    if (hasActiveSubscription) {
      toast("Você já possui uma assinatura ativa.");
      return;
    }

    try {
      setSubmitting(true);
      const origin = window.location.origin;
      const successUrl = `${origin}/checkout?success=1&plan=${encodeURIComponent(planId)}`;
      const cancelUrl = `${origin}/`;

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          planId,
          successUrl,
          cancelUrl,
          cpf,
        },
      });

      if (error) throw error;

      const url = (data as any)?.url as string | undefined;

      if (!url) {
        throw new Error("URL de checkout não retornada");
      }

      window.location.href = url;
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      toast.error("Erro ao redirecionar para pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo className="h-32 w-auto" alt="Guildas" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <GlassCard className="p-8 lg:order-last">
            <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>

            <div className="p-6 rounded-xl bg-gradient-to-br from-neon-blue/10 to-neon-violet/10 border border-white/10 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedPlan?.name ?? "Plano"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedPlan?.interval === 'yearly' ? 'Plano Anual' : 'Plano Mensal'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    R$ {planPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{selectedPlan?.interval === 'monthly' ? 'mês' : 'ano'}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-medium mb-2">Incluído:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {planFeatures.map((feature: string, i: number) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {planPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto (14 dias grátis)</span>
                <span className="text-neon-blue">-R$ {planDiscountToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
                <span>Total hoje</span>
                <span>R$ 0,00</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
              <p className="text-sm text-center">
                <Lock className="w-4 h-4 inline mr-1" />
                Cobrança de R$ {planPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} após 14 dias
              </p>
            </div>
          </GlassCard>

          {/* Checkout */}
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold mb-6">Finalizar assinatura</h2>

            {(isSuccess || sessionId) && !hasActiveSubscription && (
              <div className="p-4 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-sm mb-6">
                Estamos confirmando sua assinatura. Isso pode levar alguns segundos.
              </div>
            )}

            {hasActiveSubscription && (
              <div className="space-y-4 mb-6">
                <div
                  className={`p-4 rounded-lg text-sm ${subscription?.status === "past_due" ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-neon-blue/10 border border-neon-blue/20"}`}
                >
                  Sua assinatura está {subscriptionLabel}.
                </div>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <NeonButton variant="neon" className="w-full" onClick={() => navigate("/dashboard/settings")}
                  >
                    Ir para configurações
                  </NeonButton>
                  <NeonButton variant="glass" className="w-full" onClick={handleManageSubscription}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Gerenciar no Stripe
                  </NeonButton>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (opcional)</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="glass-card border-white/10"
                />
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm">
                Você será redirecionado para o Stripe para inserir os dados do cartão com segurança.
              </div>

              {!canCheckout && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-center">
                  Pagamento indisponível no momento para este plano.
                </div>
              )}

              <NeonButton
                type="submit"
                variant="neon"
                disabled={!canCheckout || submitting || !selectedPlan}
                className={`w-full text-lg py-6 ${!canCheckout || submitting || !selectedPlan ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Lock className="w-5 h-5 mr-2" />
                {submitting ? "Redirecionando..." : "Continuar no Stripe"}
              </NeonButton>

              <p className="text-xs text-center text-muted-foreground">
                Ao confirmar, você concorda com nossos Termos de Uso e Política
                de Privacidade. Cancelamento gratuito a qualquer momento.
              </p>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
