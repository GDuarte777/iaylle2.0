import { useState, useEffect } from "react";
import { usePlansStore, Plan } from "@/store/plansStore";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Plus, Trash2, Check, X, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function AdminPlans() {
  const { plans, fetchPlans, addPlan, updatePlan, deletePlan } = usePlansStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.functions.invoke("admin-stripe-plan", {
        body: { action: "status" }
      });

      setStripeConfigured(Boolean((data as any)?.stripeConfigured));
    };

    run();
  }, []);

  const handleSave = async () => {
    if (!currentPlan.name || !currentPlan.price) {
      toast.error("Preencha pelo menos nome e preço do plano");
      return;
    }

    if (!stripeConfigured) {
      toast.error("Stripe não configurado. Defina STRIPE_SECRET_KEY no Supabase");
      return;
    }

    if (!currentPlan.interval) {
      currentPlan.interval = "monthly";
    }

    setSaving(true);

    try {
      if (currentPlan.id) {
        await updatePlan(currentPlan.id, currentPlan);
        toast.success("Plano atualizado!");
      } else {
        await addPlan({
          name: currentPlan.name,
          price: currentPlan.price,
          description: currentPlan.description || '',
          features: currentPlan.features || [],
          interval: currentPlan.interval || 'monthly',
          color: currentPlan.color,
          isPopular: currentPlan.isPopular,
          gatewayId: currentPlan.gatewayId
        });
        toast.success("Plano criado!");
      }
      setIsEditing(false);
      setCurrentPlan({});
    } catch (error) {
      toast.error("Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (plan?: Plan) => {
    setCurrentPlan(
      plan || {
        features: [],
        color: "from-blue-500 to-cyan-500",
        interval: "monthly",
        isPopular: false,
      }
    );
    setIsEditing(true);
  };

  const handleTogglePopular = () => {
    setCurrentPlan((prev) => ({
      ...prev,
      isPopular: !prev.isPopular,
    }));
  };

  const handleAddFeature = () => {
    setCurrentPlan((prev) => ({
      ...prev,
      features: [
        ...(prev.features || []),
        {
          id: `feature-${(prev.features || []).length}-${Date.now()}`,
          text: "",
          included: true,
        },
      ],
    }));
  };

  const handleUpdateFeature = (index: number, field: "text" | "included", value: string | boolean) => {
    setCurrentPlan((prev) => {
      const features = [...(prev.features || [])];
      const feature = { ...features[index] };
      (feature as any)[field] = value;
      features[index] = feature;
      return { ...prev, features };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setCurrentPlan((prev) => {
      const features = [...(prev.features || [])];
      features.splice(index, 1);
      return { ...prev, features };
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Planos & Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie os preços e funcionalidades.</p>
        </div>
        <NeonButton variant="neon" onClick={() => openEdit()} disabled={stripeConfigured === false}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </NeonButton>
      </div>

      {stripeConfigured === false && (
        <GlassCard className="p-4 border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-sm text-yellow-200">
            Stripe não configurado. A aba de planos exige `STRIPE_SECRET_KEY` nos secrets do Supabase.
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.color} rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500`} />
            <GlassCard className="relative h-full p-6 flex flex-col">
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20">
                  Mais Popular
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {!plan.gatewayId && (
                  <div className="mt-2 inline-flex px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
                    Stripe não configurado
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1 h-10">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold">R$ {plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-3 text-sm">
                    <div className={`p-1 rounded-full ${
                      feature.included 
                        ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 opacity-50'
                    }`}>
                      {feature.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </div>
                    <span className={feature.included ? 'text-foreground' : 'text-muted-foreground line-through opacity-50'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => openEdit(plan)} className="flex-1 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-border transition-colors text-sm font-medium">
                  Editar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deletePlan(plan.id);
                      toast.success("Plano removido!");
                    } catch {
                      toast.error("Erro ao remover plano");
                    }
                  }}
                  className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Modal de Edição (Simplificado para demonstração) */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-background/95 backdrop-blur-2xl border-border">
          <DialogTitle className="sr-only">{currentPlan.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          <h2 className="text-xl font-bold mb-4">{currentPlan.id ? 'Editar Plano' : 'Novo Plano'}</h2>
          <div className="space-y-4">
            <input 
              value={currentPlan.name || ''} 
              onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})}
              placeholder="Nome do Plano"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
            />
            <input 
              type="number"
              value={currentPlan.price || ''} 
              onChange={e => setCurrentPlan({...currentPlan, price: Number(e.target.value)})}
              placeholder="Preço"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={currentPlan.interval || 'monthly'}
                onChange={(e) =>
                  setCurrentPlan({
                    ...currentPlan,
                    interval: e.target.value as Plan["interval"],
                  })
                }
                className="w-full p-3 rounded-xl bg-muted/30 border border-border text-sm"
              >
                <option value="monthly">Cobrança mensal</option>
                <option value="yearly">Cobrança anual</option>
              </select>
              <button
                type="button"
                onClick={handleTogglePopular}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  currentPlan.isPopular
                    ? 'bg-yellow-500 text-yellow-950 border-yellow-500'
                    : 'bg-muted/30 text-muted-foreground border-border'
                }`}
              >
                <Star className="w-4 h-4" />
                {currentPlan.isPopular ? 'Plano mais popular' : 'Marcar como popular'}
              </button>
            </div>
            <textarea 
              value={currentPlan.description || ''} 
              onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})}
              placeholder="Descrição"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Funcionalidades do plano</span>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-xs px-2 py-1 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  Adicionar funcionalidade
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(currentPlan.features || []).map((feature, index) => (
                  <div key={feature.id || index} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateFeature(index, 'included', !feature.included)
                      }
                      className={`p-1.5 rounded-full border transition-colors ${
                        feature.included
                          ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-300/60'
                          : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200/60 opacity-70'
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                    <input
                      value={feature.text}
                      onChange={(e) =>
                        handleUpdateFeature(index, 'text', e.target.value)
                      }
                      placeholder="Descrição da funcionalidade"
                      className="flex-1 p-2 text-sm rounded-xl bg-muted/30 border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-1.5 rounded-lg text-xs bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(currentPlan.features || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma funcionalidade adicionada ainda.
                  </p>
                )}
              </div>
            </div>
            {currentPlan.gatewayId && (
              <div className="text-xs text-muted-foreground">
                Stripe Price ID: <span className="font-mono break-all">{currentPlan.gatewayId}</span>
              </div>
            )}
            <NeonButton onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
