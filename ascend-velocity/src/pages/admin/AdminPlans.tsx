import { useState, useEffect } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { usePlansStore, Plan } from "@/store/plansStore";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Plus, Trash2, Check, X, Star, RefreshCcw, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SortableFeatureItemProps {
  feature: any;
  index: number;
  handleUpdateFeature: (index: number, field: "text" | "included", value: string | boolean) => void;
  handleRemoveFeature: (index: number) => void;
}

const SortableFeatureItem = ({ feature, index, handleUpdateFeature, handleRemoveFeature }: SortableFeatureItemProps) => {
  const controls = useDragControls();
  
  return (
    <Reorder.Item
      value={feature}
      dragListener={false}
      dragControls={controls}
      className="group flex items-center gap-3 p-2 rounded-xl bg-card border border-border hover:border-primary/20 transition-all relative"
    >
      <div 
        className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground/50 hover:text-foreground transition-colors -ml-1 touch-none"
        onPointerDown={(e) => controls.start(e)}
      >
         <GripVertical className="w-4 h-4" />
      </div>
      <button
        type="button"
        onClick={() => handleUpdateFeature(index, 'included', !feature.included)}
        className={`p-2 rounded-lg transition-colors ${
          feature.included
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
        }`}
        title={feature.included ? "Incluído" : "Não incluído"}
      >
        {feature.included ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </button>
      
      <input
        value={feature.text}
        onChange={(e) => handleUpdateFeature(index, 'text', e.target.value)}
        placeholder="Descreva a funcionalidade..."
        className="flex-1 bg-transparent border-none text-sm focus:ring-0 px-0 placeholder:text-muted-foreground/50"
      />
      
      <button
        type="button"
        onClick={() => handleRemoveFeature(index)}
        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Remover"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </Reorder.Item>
  );
};

export default function AdminPlans() {
  const { plans, fetchPlans, addPlan, updatePlan, deletePlan } = usePlansStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan> & { allowedPages?: string[] }>({});
  const [priceInput, setPriceInput] = useState("");
  const [originalPriceInput, setOriginalPriceInput] = useState("");
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [freeUsageLimit, setFreeUsageLimit] = useState<number | null>(null);
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [trialDays, setTrialDays] = useState<number | string>(14);
  const [applyTrialToExistingUsers, setApplyTrialToExistingUsers] = useState(false);
  const [savingBillingSettings, setSavingBillingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const formatPricePtBr = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parsePriceToCents = (raw: string) => {
    const cleaned = raw.trim().replace(/[^\d.,]/g, "");
    if (!cleaned) return null;

    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "");
      const parts = normalized.split(",");
      if (parts.length > 2) return null;
      const reaisStr = parts[0].replace(/\D/g, "");
      const centsStr = (parts[1] ?? "").replace(/\D/g, "");
      if (!reaisStr && !centsStr) return null;
      const reais = reaisStr ? parseInt(reaisStr, 10) : 0;
      const cents = centsStr ? parseInt((centsStr + "00").slice(0, 2), 10) : 0;
      return reais * 100 + cents;
    }

    const dotDecimal = cleaned.match(/^\d+\.(\d{1,2})$/);
    if (dotDecimal) {
      const [reaisPart, centsPart] = cleaned.split(".");
      const reais = parseInt(reaisPart, 10);
      const cents = parseInt((centsPart + "00").slice(0, 2), 10);
      return reais * 100 + cents;
    }

    const reaisOnly = cleaned.replace(/\D/g, "");
    if (!reaisOnly) return null;
    return parseInt(reaisOnly, 10) * 100;
  };

  const parsePricePtBr = (raw: string) => {
    const cents = parsePriceToCents(raw);
    if (cents === null) return null;
    return cents / 100;
  };

  const AVAILABLE_PAGES = [
    { id: '/dashboard', label: 'Dashboard (Visão Geral)' },
    { id: '/dashboard/gamification', label: 'Gamificação' },
    { id: '/dashboard/settings', label: 'Configurações' },
    { id: '/dashboard/sorteios', label: 'Sorteios' },
    { id: '/dashboard/link-bio', label: 'Link na Bio' },
    { id: '/dashboard/whatsapp-link', label: 'Gerador WhatsApp' },
    { id: '/dashboard/roleta', label: 'Roleta Criativa' },
    { id: '/dashboard/workflows', label: 'Mapa Mental' },
    { id: '/dashboard/workflow', label: 'Mapa Mental (Editor)' },
    { id: '/dashboard/ranking', label: 'Ranking Global' },
  ];

  const [couponsLoading, setCouponsLoading] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    name: "",
    percentOff: 10 as number | string,
    maxRedemptions: "",
    duration: "once" as "once" | "repeating" | "forever",
    durationInMonths: ""
  });

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // useEffect removido para evitar recriação automática de planos.
  // A criação de planos padrão deve ser feita via seed ou botão explícito, não automaticamente.

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.functions.invoke("admin-stripe-plan", {
        body: { action: "status" }
      });

      setStripeConfigured(Boolean((data as any)?.stripeConfigured));
    };

    run();
  }, []);

  const loadCoupons = async () => {
    try {
      setCouponsLoading(true);
      const { data, error } = await supabase.functions.invoke("admin-stripe-coupon", {
        body: { action: "list" }
      });
      if (error) throw error;
      setCoupons(((data as any)?.items as any[]) ?? []);
    } catch {
      setCoupons([]);
      toast.error("Erro ao carregar cupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    const code = couponForm.code.trim();
    if (!code) {
      toast.error("Informe o código do cupom");
      return;
    }

    const percentOff = Number(couponForm.percentOff);
    if (!Number.isFinite(percentOff) || percentOff <= 0) {
      toast.error("Percentual inválido");
      return;
    }

    try {
      setCreatingCoupon(true);
      const { error } = await supabase.functions.invoke("admin-stripe-coupon", {
        body: {
          action: "create",
          code,
          name: couponForm.name.trim() || undefined,
          percentOff: percentOff,
          maxRedemptions: couponForm.maxRedemptions === "" ? undefined : Number(couponForm.maxRedemptions),
          duration: couponForm.duration,
          durationInMonths:
            couponForm.duration === "repeating" && couponForm.durationInMonths !== ""
              ? Number(couponForm.durationInMonths)
              : undefined
        }
      });

      if (error) throw error;

      toast.success("Cupom criado!");
      setCouponDialogOpen(false);
      setCouponForm({
        code: "",
        name: "",
        percentOff: 10,
        maxRedemptions: "",
        duration: "once",
        durationInMonths: ""
      });
      await loadCoupons();
    } catch {
      toast.error("Erro ao criar cupom");
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleSetCouponActive = async (promotionCodeId: string, active: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("admin-stripe-coupon", {
        body: { action: "set_active", promotionCodeId, active }
      });
      if (error) throw error;
      await loadCoupons();
    } catch {
      toast.error("Erro ao atualizar cupom");
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const { data: billingData, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "billing_settings")
          .maybeSingle();

        if (error) {
          setFreeUsageLimit(null);
          return;
        }

        const value = (billingData as any)?.value as { free_usage_limit?: number } | undefined;
        if (typeof value?.free_usage_limit === "number") {
          setFreeUsageLimit(value.free_usage_limit);
        } else {
          setFreeUsageLimit(null);
        }

        const { data: trialData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "trial_settings")
          .maybeSingle();

        const trialValue = (trialData as any)?.value as { enabled?: boolean; days?: number } | undefined;
        setTrialEnabled(typeof trialValue?.enabled === "boolean" ? trialValue.enabled : true);
        setTrialDays(typeof trialValue?.days === "number" && Number.isFinite(trialValue.days) ? trialValue.days : 14);
        setApplyTrialToExistingUsers(Boolean((trialValue as any)?.apply_to_existing_users));
      } catch {
        setFreeUsageLimit(null);
      }
    };

    run();
  }, []);

  const handleSaveBillingSettings = async () => {
    const daysCandidate = trialDays === "" ? 14 : trialDays;
    const daysValue = typeof daysCandidate === "string" ? Number(daysCandidate) : daysCandidate;

    if (!Number.isInteger(daysValue) || daysValue < 0) {
      toast.error("Duração do trial (dias) inválida");
      return;
    }

    try {
      setSavingBillingSettings(true);
      const value: Record<string, unknown> = {};
      if (typeof freeUsageLimit === "number") {
        value.free_usage_limit = freeUsageLimit;
      }

      const { error: billingError } = await supabase
        .from("app_settings")
        .upsert({ key: "billing_settings", value }, { onConflict: "key" });

      if (billingError) throw billingError;

      const { error: trialError } = await supabase
        .from("app_settings")
        .upsert(
          {
            key: "trial_settings",
            value: {
              enabled: trialEnabled,
              days: daysValue,
              apply_to_existing_users: applyTrialToExistingUsers,
            }
          },
          { onConflict: "key" },
        );

      if (trialError) throw trialError;

      const shouldApplyToExistingNow = applyTrialToExistingUsers || daysValue <= 0;

      if (shouldApplyToExistingNow) {
        const { data: affected, error: applyError } = await supabase.rpc("apply_trial_settings_to_existing_trials");
        if (applyError) throw applyError;
        const affectedCount = typeof affected === "number" ? affected : null;

        const verb = daysValue <= 0 ? "revogado" : "recalculado";
        toast.success(
          typeof affectedCount === "number"
            ? `Configurações atualizadas! Trial ${verb} para ${affectedCount} usuário(s).`
            : "Configurações atualizadas!"
        );
        return;
      }

      toast.success("Configurações atualizadas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSavingBillingSettings(false);
    }
  };

  const handleSave = async () => {
    const price = parsePricePtBr(priceInput) ?? currentPlan.price;

    if (!currentPlan.name) {
      toast.error("Informe o nome do plano");
      return;
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      toast.error("Preço inválido");
      return;
    }

    const originalPriceParsed = parsePricePtBr(originalPriceInput);
    const originalPrice = typeof originalPriceParsed === "number" && Number.isFinite(originalPriceParsed)
      ? originalPriceParsed
      : null;

    if (originalPrice !== null && originalPrice <= price) {
      toast.error("O preço original deve ser maior que o preço real");
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
    console.log('AdminPlans: Iniciando salvamento de plano', { plan: currentPlan, isNew: !currentPlan.id });

    try {
      if (currentPlan.id) {
        await updatePlan(currentPlan.id, { ...currentPlan, price, originalPrice });
        console.log('AdminPlans: Plano atualizado com sucesso', { planId: currentPlan.id });
        toast.success("Plano atualizado!");
      } else {
        await addPlan({
          name: currentPlan.name,
          price,
          originalPrice,
          description: currentPlan.description || '',
          features: currentPlan.features || [],
          interval: currentPlan.interval || 'monthly',
          color: currentPlan.color,
          isPopular: currentPlan.isPopular,
          gatewayId: currentPlan.gatewayId,
          trialDays: currentPlan.trialDays,
          allowCoupons: currentPlan.allowCoupons,
          usageLimit: currentPlan.usageLimit ?? null,
          allowedPages: currentPlan.allowedPages || []
        });
        console.log('AdminPlans: Plano criado com sucesso');
        toast.success("Plano criado!");
      }
      setIsEditing(false);
      setCurrentPlan({});
      setPriceInput("");
      setOriginalPriceInput("");
      setActiveTab("general");
    } catch (error) {
      console.error('AdminPlans: Erro ao salvar plano', { error });
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao salvar plano: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (plan?: Plan) => {
    const nextPlan: Partial<Plan> & { allowedPages?: string[] } = plan
      ? { 
          ...plan, 
          features: (plan.features || []).map(f => ({ 
            ...f, 
            id: f.id || `feature-${Math.random().toString(36).substr(2, 9)}` 
          })) 
        }
      : {
        features: [],
        color: "from-blue-500 to-cyan-500",
        price: undefined,
        interval: "monthly",
        isPopular: false,
        trialDays: 14,
        allowCoupons: true,
        usageLimit: null,
        allowedPages: [],
      };

    setCurrentPlan(nextPlan);
    setPriceInput(typeof nextPlan.price === "number" && Number.isFinite(nextPlan.price) ? formatPricePtBr(nextPlan.price) : "");
    setOriginalPriceInput(typeof nextPlan.originalPrice === "number" && Number.isFinite(nextPlan.originalPrice) ? formatPricePtBr(nextPlan.originalPrice) : "");
    setActiveTab("general");
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

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    console.log('AdminPlans: Iniciando remoção de plano', { planId: planToDelete });
    try {
      await deletePlan(planToDelete);
      console.log('AdminPlans: Plano removido com sucesso', { planId: planToDelete });
      toast.success("Plano removido!");
      setPlanToDelete(null);
    } catch (error) {
      console.error('AdminPlans: Erro ao remover plano', { planId: planToDelete, error });
      toast.error("Erro ao remover plano");
    } finally {
      setDeleting(false);
    }
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

      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Limites do plano Free</h2>
            <p className="text-sm text-muted-foreground">Defina quando bloquear e direcionar para assinatura.</p>
          </div>
          <NeonButton variant="glass" onClick={handleSaveBillingSettings} disabled={savingBillingSettings}>
            {savingBillingSettings ? "Salvando..." : "Salvar"}
          </NeonButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Limite mensal (ações)</div>
            <input
              type="number"
              min={0}
              value={freeUsageLimit ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setFreeUsageLimit(v === "" ? null : Number(v));
              }}
              placeholder="Ex: 20"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Trial para novos usuários</div>
            <div className="flex items-center gap-3 h-[48px] px-3 rounded-xl bg-muted/30 border border-border">
              <Switch id="trial-enabled" checked={trialEnabled} onCheckedChange={setTrialEnabled} />
              <Label htmlFor="trial-enabled">Ativar</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Trial para antigos usuários</div>
            <div className="flex items-center gap-3 h-[48px] px-3 rounded-xl bg-muted/30 border border-border">
              <Switch
                id="trial-existing-users"
                checked={applyTrialToExistingUsers}
                onCheckedChange={setApplyTrialToExistingUsers}
              />
              <Label htmlFor="trial-existing-users">Aplicar ao alterar</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Duração do trial (dias)</div>
            <input
              type="number"
              min={0}
              value={trialDays}
              onChange={(e) => {
                const v = e.target.value;
                setTrialDays(v === "" ? "" : Number(v));
              }}
              placeholder="Ex: 14"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
              disabled={!trialEnabled && !applyTrialToExistingUsers}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Cupons (Stripe)</h2>
            <p className="text-sm text-muted-foreground">Crie e ative/desative promo codes.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <NeonButton variant="glass" onClick={loadCoupons} disabled={couponsLoading} className="w-full sm:w-auto">
              <RefreshCcw className="w-4 h-4 mr-2" />
              {couponsLoading ? "Atualizando..." : "Atualizar"}
            </NeonButton>
            <NeonButton variant="neon" onClick={() => setCouponDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo cupom
            </NeonButton>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {coupons.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum cupom encontrado.</div>
          ) : (
            coupons.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold">
                    {c.code}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${c.active ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {typeof c.coupon?.percent_off === "number" ? `${c.coupon.percent_off}% off` : "-"}
                    {c.max_redemptions ? ` • Máx: ${c.max_redemptions}` : ""}
                    {typeof c.times_redeemed === "number" ? ` • Usos: ${c.times_redeemed}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  {c.active ? (
                    <NeonButton variant="glass" onClick={() => handleSetCouponActive(c.id, false)}>
                      Desativar
                    </NeonButton>
                  ) : (
                    <NeonButton variant="neon" onClick={() => handleSetCouponActive(c.id, true)}>
                      Ativar
                    </NeonButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

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
                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <span className="text-lg text-muted-foreground line-through font-medium block">
                    R$ {plan.originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                <span className="text-3xl font-bold">R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

      {/* Modal de Edição Redesenhado */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border rounded-xl shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
            <div>
              <DialogTitle className="sr-only">{currentPlan.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
              <h2 className="text-lg sm:text-xl font-bold">{currentPlan.id ? 'Editar Plano' : 'Novo Plano'}</h2>
              <p className="text-xs text-muted-foreground mt-1">Configure os detalhes, preços e permissões.</p>
            </div>
            {currentPlan.gatewayId && (
               <div className="hidden sm:block text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border">
                 Stripe ID: <span className="font-mono">{currentPlan.gatewayId}</span>
               </div>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 pt-4 border-b border-border bg-muted/10">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="general" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm"
                >
                  Geral & Preço
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm"
                >
                  Permissões & Páginas
                </TabsTrigger>
                <TabsTrigger 
                  value="features" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 sm:px-4 py-2 text-xs sm:text-sm"
                >
                  Funcionalidades
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6 space-y-6">
                <TabsContent value="general" className="mt-0 space-y-6 focus-visible:outline-none">
                  {/* Seção de Identificação */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identificação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Plano</label>
                        <input 
                          value={currentPlan.name || ''} 
                          onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})}
                          placeholder="Ex: Profissional"
                          className="w-full p-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-medium">Descrição Curta</label>
                         <input 
                           value={currentPlan.description || ''} 
                           onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})}
                           placeholder="Ex: Para usuários avançados"
                           className="w-full p-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                         />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Seção de Preços e Cobrança */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preços e Cobrança</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preço (R$)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={priceInput}
                            onChange={(e) => {
                              const next = e.target.value;
                              setPriceInput(next);
                              const parsed = parsePricePtBr(next);
                              setCurrentPlan((prev) => ({ ...prev, price: parsed ?? undefined }));
                            }}
                            onBlur={() => {
                              const value = parsePricePtBr(priceInput);
                              if (typeof value === "number" && Number.isFinite(value) && value > 0) {
                                setPriceInput(formatPricePtBr(value));
                              }
                            }}
                            placeholder="0,00"
                            className="w-full p-3 pl-10 rounded-xl bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preço Original (R$) <span className="text-xs text-muted-foreground font-normal">(Fictício)</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={originalPriceInput}
                            onChange={(e) => {
                              const next = e.target.value;
                              setOriginalPriceInput(next);
                              const parsed = parsePricePtBr(next);
                              setCurrentPlan((prev) => ({ ...prev, originalPrice: parsed ?? undefined }));
                            }}
                            onBlur={() => {
                              const value = parsePricePtBr(originalPriceInput);
                              if (typeof value === "number" && Number.isFinite(value) && value > 0) {
                                setOriginalPriceInput(formatPricePtBr(value));
                              }
                            }}
                            placeholder="0,00"
                            className="w-full p-3 pl-10 rounded-xl bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Deve ser maior que o preço real.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Intervalo</label>
                        <select
                          value={currentPlan.interval || 'monthly'}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              interval: e.target.value as Plan["interval"],
                            })
                          }
                          className="w-full p-3 rounded-xl bg-muted/30 border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status Popular</label>
                        <button
                          type="button"
                          onClick={handleTogglePopular}
                          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                            currentPlan.isPopular
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50'
                              : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${currentPlan.isPopular ? 'fill-yellow-600' : ''}`} />
                          {currentPlan.isPopular ? 'É Popular' : 'Não é Popular'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Limites e Testes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Limites e Testes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Período de Teste (Dias)</label>
                        <input
                          type="number"
                          min={0}
                          value={isNaN(currentPlan.trialDays ?? 14) ? "" : (currentPlan.trialDays ?? 14)}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              trialDays: e.target.value === "" ? NaN : Number(e.target.value)
                            })
                          }
                          className="w-full p-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Limite de Uso (Mensal)</label>
                        <input
                          type="number"
                          min={0}
                          value={currentPlan.usageLimit ?? ""}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              usageLimit: e.target.value === "" ? null : Number(e.target.value)
                            })
                          }
                          placeholder="Ilimitado"
                          className="w-full p-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                          <input 
                            type="checkbox"
                            checked={currentPlan.allowCoupons ?? true}
                            onChange={() =>
                              setCurrentPlan((prev) => ({
                                ...prev,
                                allowCoupons: !(prev.allowCoupons ?? true)
                              }))
                            }
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-sm font-medium block">Permitir Cupons</span>
                            <span className="text-xs text-muted-foreground">Usuários podem aplicar cupons de desconto neste plano.</span>
                          </div>
                        </label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="mt-0 space-y-6 focus-visible:outline-none">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acesso às Páginas</h3>
                       <button 
                         type="button"
                         onClick={() => {
                           const allIds = AVAILABLE_PAGES.map(p => p.id);
                           const currentIds = currentPlan.allowedPages || [];
                           const isAllSelected = allIds.every(id => currentIds.includes(id));
                           setCurrentPlan({ ...currentPlan, allowedPages: isAllSelected ? [] : allIds });
                         }}
                         className="text-xs text-primary hover:underline"
                       >
                         {((currentPlan.allowedPages?.length || 0) === AVAILABLE_PAGES.length) ? "Desmarcar todos" : "Marcar todos"}
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {AVAILABLE_PAGES.map((page) => {
                        const isSelected = (currentPlan.allowedPages || []).includes(page.id);
                        return (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => {
                              const current = currentPlan.allowedPages || [];
                              const updated = isSelected
                                ? current.filter((p: string) => p !== page.id)
                                : [...current, page.id];
                              setCurrentPlan({ ...currentPlan, allowedPages: updated });
                            }}
                            className={`relative group flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                : 'bg-card border-border hover:border-primary/20 hover:bg-muted/50'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium block truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {page.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate block opacity-70">
                                {page.id}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-0 space-y-6 focus-visible:outline-none">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lista de Funcionalidades</h3>
                          <p className="text-xs text-muted-foreground">O que será exibido no card do plano.</p>
                        </div>
                        <NeonButton onClick={handleAddFeature} className="h-8 text-xs">
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </NeonButton>
                      </div>

                      <div className="space-y-3">
                        <Reorder.Group 
                          axis="y" 
                          values={currentPlan.features || []} 
                          onReorder={(newFeatures) => setCurrentPlan(prev => ({ ...prev, features: newFeatures }))} 
                          className="space-y-3"
                        >
                          {(currentPlan.features || []).map((feature, index) => (
                            <SortableFeatureItem 
                              key={feature.id} 
                              feature={feature} 
                              index={index} 
                              handleUpdateFeature={handleUpdateFeature} 
                              handleRemoveFeature={handleRemoveFeature} 
                            />
                          ))}
                        </Reorder.Group>

                        {(currentPlan.features || []).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/5">
                            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                               <Star className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Nenhuma funcionalidade adicionada</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Adicione itens para mostrar os benefícios deste plano.</p>
                            <button onClick={handleAddFeature} className="mt-4 text-xs text-primary hover:underline">
                              Adicionar primeira funcionalidade
                            </button>
                          </div>
                        )}
                      </div>
                   </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          <div className="p-4 sm:p-6 border-t border-border bg-background/50 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-4 justify-between">
             <div className="text-xs text-muted-foreground hidden sm:block">
               {currentPlan.id ? 'Editando plano existente' : 'Criando novo plano'}
             </div>
             <div className="flex flex-col-reverse sm:flex-row w-full sm:w-auto gap-3">
               <button 
                 onClick={() => setIsEditing(false)}
                 className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
               >
                 Cancelar
               </button>
               <NeonButton onClick={handleSave} className="flex-1 sm:flex-none min-w-[120px]" disabled={saving}>
                 {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                 ) : 'Salvar Alterações'}
               </NeonButton>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-border">
          <DialogTitle className="sr-only">Novo cupom</DialogTitle>
          <h2 className="text-xl font-bold mb-4">Novo cupom</h2>

          <div className="space-y-4">
            <input
              value={couponForm.code}
              onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="Código (ex: AYLL10)"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
            />
            <input
              value={couponForm.name}
              onChange={(e) => setCouponForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nome (opcional)"
              className="w-full p-3 rounded-xl bg-muted/30 border border-border"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={couponForm.percentOff}
                onChange={(e) => {
                  const v = e.target.value;
                  setCouponForm((p) => ({ ...p, percentOff: v === "" ? "" : Number(v) }))
                }}
                placeholder="% off"
                className="w-full p-3 rounded-xl bg-muted/30 border border-border"
              />
              <input
                type="number"
                min={1}
                value={couponForm.maxRedemptions}
                onChange={(e) => setCouponForm((p) => ({ ...p, maxRedemptions: e.target.value }))}
                placeholder="Máx. resgates (opcional)"
                className="w-full p-3 rounded-xl bg-muted/30 border border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={couponForm.duration}
                onChange={(e) => setCouponForm((p) => ({ ...p, duration: e.target.value as any }))}
                className="w-full p-3 rounded-xl bg-muted/30 border border-border text-sm"
              >
                <option value="once">Uma vez</option>
                <option value="repeating">Repetindo</option>
                <option value="forever">Para sempre</option>
              </select>
              <input
                type="number"
                min={1}
                value={couponForm.durationInMonths}
                onChange={(e) => setCouponForm((p) => ({ ...p, durationInMonths: e.target.value }))}
                disabled={couponForm.duration !== "repeating"}
                placeholder="Meses (se repetindo)"
                className="w-full p-3 rounded-xl bg-muted/30 border border-border"
              />
            </div>

            <NeonButton onClick={handleCreateCoupon} className="w-full" disabled={creatingCoupon}>
              {creatingCoupon ? "Criando..." : "Criar cupom"}
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-border">
          <DialogHeader>
            <DialogTitle>Excluir Plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 flex flex-col-reverse sm:flex-row">
            <button
              onClick={() => setPlanToDelete(null)}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <NeonButton
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white border-red-600 hover:border-red-700 shadow-red-500/20"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
