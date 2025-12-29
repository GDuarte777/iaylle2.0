import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, initialize } = useAuthStore();
  const { subscription, payments, loading: loadingSub } = useSubscription();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    bio: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.name || "",
        email: user.email || "",
        company: "", // Add company to profile table if needed, for now we keep it empty or local state
        bio: "" // Same for bio
      });
      fetchAdditionalProfileData();
    }
  }, [user]);

  const fetchAdditionalProfileData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          full_name: data.full_name || prev.full_name,
          company: data.company || "",
          bio: data.bio || ""
        }));
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company: formData.company,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local store
      await initialize();
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const origin = window.location.origin;
      const returnUrl = `${origin}/dashboard/settings`;

      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: { returnUrl },
      });

      if (error) throw error;

      const url = (data as any)?.url as string | undefined;

      if (!url) {
        throw new Error("URL do portal não retornada");
      }

      window.location.href = url;
    } catch (error) {
      console.error("Error opening Stripe portal:", error);
      toast.error("Erro ao abrir portal de faturamento");
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "billing", label: "Faturamento", icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <User className="w-10 h-10 text-neon-blue animate-glow" />
            Perfil
          </h1>
          <p className="text-muted-foreground">
            Gerencie as configurações da sua conta e da plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-neon-blue/20 to-neon-violet/20 border border-neon-blue/30 text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </GlassCard>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Informações do Perfil</h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center font-bold text-3xl overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <div>
                      {/* Placeholder for avatar upload */}
                      <NeonButton variant="glass" disabled>Alterar Foto (Em breve)</NeonButton>
                      <p className="text-sm text-muted-foreground mt-2">
                        Foto de perfil vinculada à sua conta.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="glass-card border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="glass-card border-white/10 opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Nome da Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Não informado"
                      className="glass-card border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Sobre</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Conte um pouco sobre você..."
                      className="glass-card border-white/10 min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <NeonButton variant="neon" onClick={handleUpdateProfile} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Salvar Alterações
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === "notifications" && (
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Preferências de Notificação</h2>
                <div className="space-y-6">
                  {[
                    { label: "Novas conquistas desbloqueadas", description: "Receba notificações quando alguém desbloquear uma conquista" },
                    { label: "Missões completadas", description: "Notificações sobre missões concluídas pela equipe" },
                    { label: "Novos membros", description: "Avisos quando novos membros entrarem na equipe" },
                    { label: "Relatórios semanais", description: "Resumo semanal do desempenho da equipe" },
                    { label: "Avisos de sistema", description: "Atualizações e manutenções programadas" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-4 rounded-xl bg-white/5">
                      <div className="flex-1">
                        <p className="font-medium mb-1">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <button className="w-12 h-6 rounded-full bg-neon-blue relative ml-4">
                        <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {activeTab === "security" && (
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Segurança</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="glass-card border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="glass-card border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="glass-card border-white/10"
                    />
                  </div>

                  <NeonButton variant="neon">Alterar Senha</NeonButton>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="font-semibold mb-4">Autenticação de Dois Fatores</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                    <NeonButton variant="glass">Ativar 2FA</NeonButton>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeTab === "billing" && (
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Faturamento e Assinatura</h2>
                
                {loadingSub ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
                  </div>
                ) : subscription ? (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-neon-blue/10 to-neon-violet/10 border border-neon-blue/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{subscription.plan.name}</h3>
                          <p className="text-muted-foreground">{subscription.plan.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-neon-blue">
                            {(subscription.plan.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-sm text-muted-foreground">/{subscription.plan.interval === 'monthly' ? 'mês' : 'ano'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Próxima cobrança em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex gap-4">
                        <NeonButton variant="glass" onClick={handleManageSubscription}>Alterar Plano</NeonButton>
                        <NeonButton variant="outline" className="text-destructive" onClick={handleManageSubscription}>
                          Cancelar Assinatura
                        </NeonButton>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Histórico de Pagamentos</h3>
                      {payments.length > 0 ? (
                        <div className="space-y-2">
                          {payments.map((payment) => (
                            <div key={payment.id} className="p-4 rounded-xl bg-white/5 flex items-center justify-between">
                              <div>
                                <p className="font-medium">{new Date(payment.paid_at).toLocaleDateString('pt-BR')}</p>
                                <p className="text-sm text-muted-foreground">{subscription.plan.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {(payment.amount_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: payment.currency })}
                                </p>
                                <p className="text-sm text-neon-turquoise capitalize">{payment.status === 'paid' ? 'Pago' : payment.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Plano Gratuito</h3>
                    <p className="text-muted-foreground mb-6">
                      Você está usando o plano gratuito. Faça upgrade para desbloquear mais recursos.
                    </p>
                    <NeonButton variant="neon" onClick={() => window.location.href = '/pricing'}>
                      Ver Planos Disponíveis
                    </NeonButton>
                  </div>
                )}
              </GlassCard>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
