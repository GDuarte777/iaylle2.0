import { DashboardLayout, useAccessControl } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { User, Bell, Shield, CreditCard, Loader2, LogOut, Camera, Trash2, Eye, EyeOff } from "lucide-react";
import { getPasswordStrength, validatePasswordChangeForm } from "@/lib/password";
import { changePasswordWithReauth } from "@/lib/auth/changePassword";

function SettingsInner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const { user, initialize, logout } = useAuthStore();
  const { subscription, payments, loading: loadingSub } = useSubscription();
  const access = useAccessControl();
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    bio: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    signOutEverywhere: true
  });

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    form?: string;
  }>({});

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false
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

  const isAvatarFromStorage = (url: string) => {
    return url.includes('/storage/v1/object/') && url.includes('/avatars/');
  };

  const getAvatarPathFromUrl = (url: string) => {
    try {
      if (!isAvatarFromStorage(url)) return null;
      const urlObj = new URL(url);
      const idx = urlObj.pathname.indexOf('/avatars/');
      if (idx === -1) return null;
      return decodeURIComponent(urlObj.pathname.slice(idx + '/avatars/'.length));
    } catch {
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (access && !access.isPageToolsEnabled()) {
      access.notifyToolBlocked();
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setLoading(true);

      const previousPath = user.avatar ? getAvatarPathFromUrl(user.avatar) : null;

      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase.rpc("set_own_profile_avatar", {
        p_avatar_url: publicUrl,
      });

      if (updateError) throw updateError;

      if (previousPath && previousPath !== filePath) {
        await supabase.storage.from('avatars').remove([previousPath]);
      }

      await initialize();
      toast.success('Foto de perfil atualizada!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao atualizar foto: ${message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;

    if (access && !access.isPageToolsEnabled()) {
      access.notifyToolBlocked();
      return;
    }

    try {
      setLoading(true);

      const path = getAvatarPathFromUrl(user.avatar);
      const { error } = await supabase.rpc("set_own_profile_avatar", {
        p_avatar_url: null,
      });

      if (error) throw error;

      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }

      await initialize();
      toast.success('Foto de perfil removida!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao remover foto: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (access && !access.isPageToolsEnabled()) {
      access.notifyToolBlocked();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("update_own_profile_details", {
        p_full_name: formData.full_name,
        p_company: formData.company,
        p_bio: formData.bio,
      });

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(passwordForm.newPassword);
  }, [passwordForm.newPassword]);

  const passwordStrengthProgress = useMemo(() => {
    const ratio = passwordStrength.score / 4;
    return Math.round(ratio * 100);
  }, [passwordStrength.score]);

  const passwordStrengthIndicatorClass = useMemo(() => {
    if (passwordStrength.score <= 1) return "bg-red-500";
    if (passwordStrength.score === 2) return "bg-yellow-500";
    if (passwordStrength.score === 3) return "bg-neon-blue";
    return "bg-green-500";
  }, [passwordStrength.score]);

  const confirmMismatch = useMemo(() => {
    if (!passwordForm.confirmPassword) return false;
    return passwordForm.newPassword !== passwordForm.confirmPassword;
  }, [passwordForm.confirmPassword, passwordForm.newPassword]);

  const canSubmitPasswordChange = useMemo(() => {
    const errors = validatePasswordChangeForm({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    });
    return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword;
  }, [passwordForm.confirmPassword, passwordForm.currentPassword, passwordForm.newPassword]);

  const handleChangePassword = async () => {
    if (!user?.email) {
      setPasswordErrors({ form: "Você precisa estar autenticado para alterar a senha." });
      toast.error("Você precisa estar autenticado para alterar a senha.");
      return;
    }

    if (access && !access.isPageToolsEnabled()) {
      access.notifyToolBlocked();
      return;
    }

    const errors = validatePasswordChangeForm({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    });

    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
      setPasswordErrors({ ...errors, form: "Corrija os campos antes de continuar." });
      toast.error("Revise os campos de senha.");
      return;
    }

    setChangingPassword(true);
    setPasswordErrors({});
    try {
      const result = await changePasswordWithReauth({
        client: supabase as any,
        email: user.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        notify: true,
        signOutEverywhere: passwordForm.signOutEverywhere
      });

      if (result.success === false) {
        const msg = result.error || "Não foi possível alterar a senha.";
        const msgLower = msg.toLowerCase();
        if (msgLower.includes("invalid login") || msgLower.includes("credenciais") || msgLower.includes("senha")) {
          setPasswordErrors({ currentPassword: "Senha atual incorreta." });
          toast.error("Senha atual incorreta.");
        } else {
          setPasswordErrors({ form: msg });
          toast.error(msg);
        }
        return;
      }

      toast.success("Senha alterada com sucesso.");
      if (!result.notified) {
        toast.warning("Senha alterada. Não foi possível enviar o e-mail de confirmação.");
      }

      setPasswordForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setShowPasswords({ current: false, next: false, confirm: false });

      if (passwordForm.signOutEverywhere) {
        await logout();
        navigate("/login");
        return;
      }

      await initialize();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao alterar senha";
      setPasswordErrors({ form: "Erro ao alterar senha. Tente novamente." });
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "billing", label: "Faturamento", icon: CreditCard },
  ];

  return (
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

                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-500/10 hover:text-red-400 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ring-offset-background"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
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
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center font-bold text-3xl overflow-hidden relative">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                      />
                      <div className="flex gap-2">
                        <NeonButton 
                          variant="glass" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                          Alterar Foto
                        </NeonButton>
                        
                        {user?.avatar && user.avatar.includes('avatars') && (
                          <NeonButton 
                            variant="glass" 
                            className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10"
                            onClick={handleRemoveAvatar}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </NeonButton>
                        )}
                      </div>
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
                  {passwordErrors.form && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    >
                      {passwordErrors.form}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordForm((p) => ({ ...p, currentPassword: value }));
                          setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined, form: undefined }));
                        }}
                        aria-invalid={!!passwordErrors.currentPassword}
                        aria-describedby={passwordErrors.currentPassword ? "current-password-error" : undefined}
                        className="glass-card border-white/10 pr-12"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((v) => ({ ...v, current: !v.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPasswords.current ? "Ocultar senha atual" : "Mostrar senha atual"}
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p id="current-password-error" role="alert" className="text-sm text-red-300">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPasswords.next ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordForm((p) => ({ ...p, newPassword: value }));
                          setPasswordErrors((prev) => ({ ...prev, newPassword: undefined, form: undefined }));
                        }}
                        aria-invalid={!!passwordErrors.newPassword}
                        aria-describedby={passwordErrors.newPassword ? "new-password-error new-password-strength" : "new-password-strength"}
                        className="glass-card border-white/10 pr-12"
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((v) => ({ ...v, next: !v.next }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPasswords.next ? "Ocultar nova senha" : "Mostrar nova senha"}
                      >
                        {showPasswords.next ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div id="new-password-strength" className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground" aria-live="polite">
                          Força: <span className="text-foreground">{passwordStrength.label}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{passwordStrengthProgress}%</p>
                      </div>
                      <Progress
                        value={passwordStrengthProgress}
                        indicatorClassName={passwordStrengthIndicatorClass}
                        aria-label="Força da senha"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {passwordStrength.checks.map((c) => (
                          <p
                            key={c.id}
                            className={cn(
                              "text-sm",
                              c.passed ? "text-green-300" : c.required ? "text-red-300" : "text-muted-foreground"
                            )}
                          >
                            {c.label}
                          </p>
                        ))}
                      </div>
                    </div>
                    {passwordErrors.newPassword && (
                      <p id="new-password-error" role="alert" className="text-sm text-red-300">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordForm((p) => ({ ...p, confirmPassword: value }));
                          setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined, form: undefined }));
                        }}
                        aria-invalid={!!passwordErrors.confirmPassword || confirmMismatch}
                        aria-describedby={
                          passwordErrors.confirmPassword
                            ? "confirm-password-error"
                            : confirmMismatch
                              ? "confirm-password-mismatch"
                              : undefined
                        }
                        className="glass-card border-white/10 pr-12"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((v) => ({ ...v, confirm: !v.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPasswords.confirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmMismatch && (
                      <p id="confirm-password-mismatch" role="alert" className="text-sm text-red-300">
                        A confirmação não corresponde à nova senha.
                      </p>
                    )}
                    {passwordErrors.confirmPassword && (
                      <p id="confirm-password-error" role="alert" className="text-sm text-red-300">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-xl bg-white/5 p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Encerrar sessões em outros dispositivos</p>
                      <p className="text-sm text-muted-foreground">Recomendado: você fará login novamente após a troca.</p>
                    </div>
                    <Switch
                      checked={passwordForm.signOutEverywhere}
                      onCheckedChange={(checked) => setPasswordForm((p) => ({ ...p, signOutEverywhere: checked }))}
                      aria-label="Encerrar outras sessões"
                    />
                  </div>

                  <NeonButton
                    variant="neon"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !user || !canSubmitPasswordChange}
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Alterar Senha
                  </NeonButton>

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
                    <NeonButton variant="neon" onClick={() => window.location.href = '/dashboard/settings'}>
                      Ver Planos Disponíveis
                    </NeonButton>
                  </div>
                )}
              </GlassCard>
            )}

          </div>
        </div>
      </div>
  );
}

export default function Settings() {
  return (
    <DashboardLayout>
      <SettingsInner />
    </DashboardLayout>
  );
}
