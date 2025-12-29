import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import { usePlansStore } from "@/store/plansStore";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("plan");
  const { plans, fetchPlans, loading } = usePlansStore();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cpf: "",
  });

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const selectedPlanFromDb = plans.find((p) => p.id === planId);

  useEffect(() => {
    if (loading) return;
    if (!planId) return;
    if (selectedPlanFromDb) return;

    toast.error("Plano não encontrado");
    navigate("/pricing", { replace: true });
  }, [loading, planId, selectedPlanFromDb, navigate]);

  const canCheckout = Boolean(planId && selectedPlanFromDb?.gatewayId);

  const selectedPlan = selectedPlanFromDb || {
    name: "Professional",
    price: 197,
    interval: "monthly",
    features: [
      { text: "Até 50 membros", included: true },
      { text: "Personalização total", included: true },
      { text: "Conquistas ilimitadas", included: true },
      { text: "Suporte prioritário", included: true },
    ],
  };

  const planPrice = typeof selectedPlan.price === 'number' 
    ? selectedPlan.price 
    : 0;

  const planFeatures = selectedPlan.features
    ? selectedPlan.features.filter((f: any) => f.included).map((f: any) => f.text)
    : [];

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

    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/dashboard/settings`;
      const cancelUrl = `${origin}/pricing`;

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          planId,
          successUrl,
          cancelUrl,
          cpf: formData.cpf,
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="GameTeam" className="h-12 w-auto" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <GlassCard className="p-8 lg:order-last">
            <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>

            <div className="p-6 rounded-xl bg-gradient-to-br from-neon-blue/10 to-neon-violet/10 border border-white/10 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedPlan.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedPlan.interval === 'yearly' ? 'Plano Anual' : 'Plano Mensal'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    R$ {planPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{selectedPlan.interval === 'monthly' ? 'mês' : 'ano'}
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
                <span className="text-neon-blue">-R$ {(planPrice * 0.45).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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

          {/* Payment Form */}
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold mb-6">Dados de Pagamento</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center text-sm">
                    1
                  </div>
                  Informações Pessoais
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Como está no cartão"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="glass-card border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="glass-card border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: e.target.value })
                    }
                    className="glass-card border-white/10"
                    required
                  />
                </div>
              </div>

              {/* Card Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center text-sm">
                    2
                  </div>
                  Cartão de Crédito
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do cartão</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={formData.cardNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, cardNumber: e.target.value })
                      }
                      className="glass-card border-border pl-10"
                      required
                    />
                    <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Validade</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={formData.expiry}
                      onChange={(e) =>
                        setFormData({ ...formData, expiry: e.target.value })
                      }
                      className="glass-card border-white/10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      maxLength={4}
                      value={formData.cvv}
                      onChange={(e) =>
                        setFormData({ ...formData, cvv: e.target.value })
                      }
                      className="glass-card border-white/10"
                      required
                    />
                  </div>
                </div>
              </div>

              {!canCheckout && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-center">
                  Pagamento indisponível no momento para este plano.
                </div>
              )}

              <NeonButton
                type="submit"
                variant="neon"
                disabled={!canCheckout}
                className={`w-full text-lg py-6 ${!canCheckout ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Lock className="w-5 h-5 mr-2" />
                Começar Teste Grátis
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
