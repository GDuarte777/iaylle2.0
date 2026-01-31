import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CreditCard, MoreVertical, RefreshCcw, Search, TicketPercent, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlansStore } from "@/store/plansStore";

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

type SubscriptionRow = {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  started_at: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  plan: {
    id: string;
    name: string;
    price_cents: number;
    interval: string;
  } | null;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string | null;
    status: string | null;
    plan_status: string | null;
  } | null;
};

type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  external_invoice_id: string | null;
  subscription: {
    id: string;
    user_id: string;
    external_subscription_id: string | null;
    plan: { name: string } | null;
    profile: { email: string | null; full_name: string | null } | null;
  } | null;
};

type CouponItem = {
  id: string;
  code: string;
  active: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  coupon: {
    id: string;
    name: string | null;
    percent_off: number | null;
    amount_off: number | null;
    duration: string | null;
    duration_in_months: number | null;
  } | null;
};

const formatBRL = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function AdminBilling() {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "payments" | "coupons">("subscriptions");
  const [search, setSearch] = useState("");

  const [subsLoading, setSubsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);

  const { plans, fetchPlans } = usePlansStore();
  const [planDialogUser, setPlanDialogUser] = useState<SubscriptionRow | null>(null);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponName, setNewCouponName] = useState("");
  const [newCouponPercentOff, setNewCouponPercentOff] = useState<number | string>(10);
  const [newCouponMaxRedemptions, setNewCouponMaxRedemptions] = useState<number | "">("");

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const stripeCustomerUrl = useCallback((customerId: string) => {
    return `https://dashboard.stripe.com/customers/${customerId}`;
  }, []);

  const stripeSubscriptionUrl = useCallback((subscriptionId: string) => {
    return `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setSubsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "id, user_id, status, started_at, current_period_end, canceled_at, external_customer_id, external_subscription_id, plan:plans(id, name, price_cents, interval), profile:profiles(id, email, full_name, role, status, plan_status)",
        )
        .order("updated_at", { ascending: false })
        .range(0, 99);

      if (error) throw error;
      setSubscriptions((data as any) ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao carregar assinaturas: ${message}`);
      setSubscriptions([]);
    } finally {
      setSubsLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, amount_cents, currency, status, paid_at, created_at, external_invoice_id, subscription:subscriptions(id, user_id, external_subscription_id, plan:plans(name), profile:profiles(email, full_name))",
        )
        .order("created_at", { ascending: false })
        .range(0, 99);

      if (error) throw error;
      setPayments((data as any) ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao carregar pagamentos: ${message}`);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stripe-coupon", {
        body: { action: "list" },
      });
      if (error) throw error;
      setCoupons((((data as any) ?? {}) as any).items ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao carregar cupons: ${message}`);
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "subscriptions") {
      void loadSubscriptions();
      return;
    }
    if (activeTab === "payments") {
      void loadPayments();
      return;
    }
    void loadCoupons();
  }, [activeTab, loadCoupons, loadPayments, loadSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter((s) => {
      const email = s.profile?.email?.toLowerCase() ?? "";
      const name = s.profile?.full_name?.toLowerCase() ?? "";
      const plan = s.plan?.name?.toLowerCase() ?? "";
      return email.includes(q) || name.includes(q) || plan.includes(q);
    });
  }, [search, subscriptions]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const email = p.subscription?.profile?.email?.toLowerCase() ?? "";
      const name = p.subscription?.profile?.full_name?.toLowerCase() ?? "";
      const plan = p.subscription?.plan?.name?.toLowerCase() ?? "";
      const status = p.status?.toLowerCase() ?? "";
      return email.includes(q) || name.includes(q) || plan.includes(q) || status.includes(q);
    });
  }, [payments, search]);

  const handleChangePlan = useCallback(
    async (userId: string, planId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke("admin-stripe-subscription", {
          body: {
            action: "change_plan",
            userId,
            planId,
            returnUrl: `${window.location.origin}/admin/billing`,
          },
        });
        if (error) throw error;

        if (data && typeof data === "object" && (data as any).code === "missing_payment_method") {
          const portalUrl = (data as any).portalUrl as string | undefined;
          toast.error("O usuário precisa adicionar um método de pagamento.", {
            description: portalUrl ? "Abra o portal do Stripe para adicionar um cartão." : undefined,
            action: portalUrl
              ? {
                  label: "Abrir portal",
                  onClick: () => window.open(portalUrl, "_blank", "noreferrer")
                }
              : undefined
          });
          return;
        }

        toast.success("Plano alterado com sucesso");
        setPlanDialogUser(null);
        await loadSubscriptions();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(`Erro ao alterar plano: ${message}`);
      }
    },
    [loadSubscriptions],
  );

  const handleCancelSubscription = useCallback(
    async (userId: string) => {
      try {
        const { error } = await supabase.functions.invoke("admin-stripe-subscription", {
          body: { action: "cancel", userId },
        });
        if (error) throw error;
        toast.success("Assinatura cancelada");
        await loadSubscriptions();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(`Erro ao cancelar: ${message}`);
      }
    },
    [loadSubscriptions],
  );

  const handleCreateCoupon = useCallback(async () => {
    const code = newCouponCode.trim();
    if (!code) {
      toast.error("Informe um código");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin-stripe-coupon", {
        body: {
          action: "create",
          code,
          name: newCouponName.trim() || undefined,
          percentOff: Number(newCouponPercentOff),
          maxRedemptions: newCouponMaxRedemptions === "" ? undefined : Number(newCouponMaxRedemptions),
          duration: "once",
        },
      });
      if (error) throw error;
      toast.success("Cupom criado");
      setCouponDialogOpen(false);
      setNewCouponCode("");
      setNewCouponName("");
      setNewCouponPercentOff(10);
      setNewCouponMaxRedemptions("");
      await loadCoupons();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao criar cupom: ${message}`);
    }
  }, [loadCoupons, newCouponCode, newCouponMaxRedemptions, newCouponName, newCouponPercentOff]);

  const handleToggleCoupon = useCallback(
    async (promotionCodeId: string, active: boolean) => {
      try {
        const { error } = await supabase.functions.invoke("admin-stripe-coupon", {
          body: { action: "set_active", promotionCodeId, active },
        });
        if (error) throw error;
        await loadCoupons();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error(`Erro ao atualizar cupom: ${message}`);
      }
    },
    [loadCoupons],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Assinaturas e Cobrança
          </h1>
          <p className="text-muted-foreground">Controle assinaturas, pagamentos e cupons.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email, nome, plano..."
              className="pl-10 bg-background/60"
            />
          </div>
          <NeonButton
            variant="glass"
            onClick={() => {
              if (activeTab === "subscriptions") void loadSubscriptions();
              else if (activeTab === "payments") void loadPayments();
              else void loadCoupons();
            }}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </NeonButton>
        </div>
      </div>

      <GlassCard className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="subscriptions" className="gap-2">
              <Users className="w-4 h-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <TicketPercent className="w-4 h-4" />
              Cupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="mt-6">
            {subsLoading ? (
              <div className="py-10 text-center text-muted-foreground">Carregando...</div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Nenhuma assinatura encontrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima cobrança</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{s.profile?.full_name ?? "(sem nome)"}</span>
                          <span className="text-xs text-muted-foreground">{s.profile?.email ?? "(sem email)"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{s.plan?.name ?? "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {s.plan ? `${formatBRL(s.plan.price_cents)}/${s.plan.interval === "monthly" ? "mês" : "ano"}` : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{s.status}</TableCell>
                      <TableCell>
                        {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <NeonButton variant="glass" className="px-3">
                              <MoreVertical className="w-4 h-4" />
                            </NeonButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setPlanDialogUser(s)}>
                              Trocar plano
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => void handleCancelSubscription(s.user_id)}
                            >
                              Cancelar assinatura
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={!s.external_customer_id}
                              onClick={() => {
                                if (!s.external_customer_id) return;
                                window.open(stripeCustomerUrl(s.external_customer_id), "_blank", "noreferrer");
                              }}
                            >
                              Abrir cliente no Stripe
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={!s.external_subscription_id}
                              onClick={() => {
                                if (!s.external_subscription_id) return;
                                window.open(stripeSubscriptionUrl(s.external_subscription_id), "_blank", "noreferrer");
                              }}
                            >
                              Abrir assinatura no Stripe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            {paymentsLoading ? (
              <div className="py-10 text-center text-muted-foreground">Carregando...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Nenhum pagamento encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.subscription?.profile?.full_name ?? "(sem nome)"}</span>
                          <span className="text-xs text-muted-foreground">{p.subscription?.profile?.email ?? "(sem email)"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.subscription?.plan?.name ?? "—"}</TableCell>
                      <TableCell>
                        {(p.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: p.currency || "BRL" })}
                      </TableCell>
                      <TableCell className="capitalize">{p.status}</TableCell>
                      <TableCell>{new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="coupons" className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-sm text-muted-foreground">Cupons e promoções no Stripe.</div>
              <NeonButton variant="neon" onClick={() => setCouponDialogOpen(true)}>
                Criar cupom
              </NeonButton>
            </div>

            {couponsLoading ? (
              <div className="py-10 text-center text-muted-foreground">Carregando...</div>
            ) : coupons.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Nenhum cupom encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>
                        {c.coupon?.percent_off != null
                          ? `${c.coupon.percent_off}%`
                          : c.coupon?.amount_off != null
                            ? String(c.coupon.amount_off)
                            : "—"}
                      </TableCell>
                      <TableCell>
                        {c.times_redeemed}
                        {c.max_redemptions != null ? `/${c.max_redemptions}` : ""}
                      </TableCell>
                      <TableCell>{c.active ? "Ativo" : "Inativo"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <NeonButton variant="glass" className="px-3">
                              <MoreVertical className="w-4 h-4" />
                            </NeonButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border">
                            <DropdownMenuLabel>Cupom</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => void handleToggleCoupon(c.id, !c.active)}>
                              {c.active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </GlassCard>

      <Dialog open={planDialogUser != null} onOpenChange={(open) => (!open ? setPlanDialogUser(null) : undefined)}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[520px] bg-background/95 backdrop-blur-xl border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trocar plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="text-sm text-muted-foreground">{planDialogUser?.profile?.email ?? ""}</div>
            <div className="grid gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    planDialogUser?.plan?.id === plan.id
                      ? "bg-purple-100 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/50"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    if (!planDialogUser) return;
                    void handleChangePlan(planDialogUser.user_id, plan.id);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold">{plan.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {plan.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/{plan.interval === "monthly" ? "mês" : "ano"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[520px] bg-background/95 backdrop-blur-xl border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar cupom</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Código</div>
              <Input value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="EX: PROMO10" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Nome (opcional)</div>
              <Input value={newCouponName} onChange={(e) => setNewCouponName(e.target.value)} placeholder="Ex: Promo Janeiro" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">% de desconto</div>
              <Input
                type="number"
                min={1}
                max={100}
                value={newCouponPercentOff}
                onChange={(e) => setNewCouponPercentOff(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Máximo de resgates (opcional)</div>
              <Input
                type="number"
                min={1}
                value={newCouponMaxRedemptions}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewCouponMaxRedemptions(v === "" ? "" : Number(v));
                }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <NeonButton variant="glass" onClick={() => setCouponDialogOpen(false)}>
                Cancelar
              </NeonButton>
              <NeonButton variant="neon" onClick={() => void handleCreateCoupon()}>
                Criar
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
