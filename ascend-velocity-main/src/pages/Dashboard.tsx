import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, CheckCircle, UserX, Star, FileText, Target, TrendingUp, Calendar, Search, Grid3x3, List, Edit, Trash2, ChevronLeft, ChevronRight, Lightbulb, Award, BarChart3, Zap, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/GlassCard";
import { GlowCard } from "@/components/ui/spotlight-card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { fetchAffiliates, fetchCalendarStatuses, fetchCalendarStatusesForMonth, addAffiliate as apiAddAffiliate, fetchAwardedAchievements, updateAffiliate as apiUpdateAffiliate, deleteAffiliate as apiDeleteAffiliate, deleteMonthData as apiDeleteMonthData } from "@/hooks/useAffiliates";
import "@/lib/legacyCalendar";
import { useStatusConfig } from "@/store/statusConfig";
import { useBannerStore } from "@/store/bannerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NeonButton } from "@/components/NeonButton";
import { AffiliateCalendarModal } from "@/components/AffiliateCalendarModal";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [metricsSearch, setMetricsSearch] = useState("");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const { config: bannerConfig, updateConfig: updateBannerConfig } = useBannerStore();
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState(bannerConfig);

  // Sync bannerForm with bannerConfig when modal opens
  useEffect(() => {
    if (isEditingBanner) {
      setBannerForm(bannerConfig);
    }
  }, [isEditingBanner, bannerConfig]);

  const handleSaveBanner = () => {
    updateBannerConfig(bannerForm);
    setIsEditingBanner(false);
    toast.success("Banner atualizado com sucesso!");
  };

  const { classes, levels, achievements, initializeFromSupabase } = useStatusConfig();

  const getLevelInfo = (points: number) => {
    let currentLevel = levels[0];
    let nextLevel = levels[levels.length - 1];

    for (let i = 0; i < levels.length; i++) {
      if (points >= levels[i].minXP) {
        currentLevel = levels[i];
        if (i < levels.length - 1) {
          nextLevel = levels[i + 1];
        } else {
          nextLevel = { ...levels[i], minXP: levels[i].minXP * 1.5 }; // Estimativa para último nível
        }
      }
    }

    const progress = Math.min(100, Math.max(0, ((points - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100));
    
    return { currentLevel, nextLevel, progress };
  };

  useEffect(() => {
    void initializeFromSupabase();
  }, [initializeFromSupabase]);

  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [isClearingMonth, setIsClearingMonth] = useState(false);
  const [isClearingMonthLoading, setIsClearingMonthLoading] = useState(false);

  const filteredAffiliates = affiliates.filter((affiliate) => {
    if (!affiliateSearch.trim()) return true;
    const query = affiliateSearch.toLowerCase();
    return (
      (affiliate.name || "").toLowerCase().includes(query) ||
      (affiliate.username || "").toLowerCase().includes(query)
    );
  });

  const refreshData = async () => {
    try {
      const [rows, allStatuses, monthStatuses, awards] = await Promise.all([
        fetchAffiliates(),
        fetchCalendarStatuses(),
        fetchCalendarStatusesForMonth(year, monthIdx),
        fetchAwardedAchievements()
      ]);
      
      const combinedStatuses = { ...allStatuses, ...monthStatuses };
      (window as any).__calendarStatuses = combinedStatuses;
      (window as any).__awardedAchievements = awards;
      
      const ym = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      
      const list = rows.map((r: any) => {
        const id = r.id;
        const username = r.instagram?.startsWith('@') ? r.instagram : `@${r.instagram || ''}`;
        
        const entries = Object.entries(combinedStatuses).filter(([k]) => (k as string).startsWith(`${id}:`));
        const inMonth = entries.filter(([k]) => (k as string).includes(`:${ym}-`));
        
        const posted = inMonth.filter(([, v]) => v === 'postou' || v === 'postou_vendas').length;
        const notPosted = inMonth.filter(([, v]) => v === 'nao_postou').length;
        const noAnalysis = inMonth.filter(([, v]) => v === 'sem_analise').length;
        const salesPosts = inMonth.filter(([, v]) => v === 'postou_vendas').length;
        
        const pointsBase = inMonth.reduce((acc, [, v]) => {
          const cls = classes.find((c) => c.key === v);
          return acc + (cls?.points || 0);
        }, 0);
        
        const affiliateAwards = awards[id] || {};
        const achievementPoints = achievements.reduce((acc, ach) => {
          const count = Object.keys(affiliateAwards).filter((k) => k === ach.id || k.startsWith(`${ach.id}@`)).length;
          return acc + (count * ach.xp);
        }, 0);

        const bonus = ((window as any).__affiliatePoints || {})[id] || 0;
        const points = pointsBase + bonus + achievementPoints;
        
        const totalDays = posted + notPosted;
        const performance = totalDays > 0 ? Math.round((posted / totalDays) * 100) : 0;
        
        const { currentLevel } = getLevelInfo(points);
        
        return { 
          id, 
          name: r.name, 
          username, 
          points, 
          level: currentLevel.name, 
          performance, 
          posted, 
          notPosted, 
          noAnalysis, 
          salesPosts 
        };
      });
      
      setAffiliates(list);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleClearMonth = async () => {
    setIsClearingMonthLoading(true);
    const ok = await apiDeleteMonthData(year, monthIdx);
    if (ok) {
      toast.success("Dados do mês apagados com sucesso");
      setIsClearingMonth(false);
      await refreshData();
    } else {
      toast.error("Erro ao apagar dados do mês");
    }
    setIsClearingMonthLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [year, monthIdx]); // Refresh when context changes

  useEffect(() => {
    const onFocus = () => refreshData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [year, monthIdx]);

  useEffect(() => {
    (window as any).onAchievementAwarded = (e: { affiliateId: string; achievementId: string; xp: number; title: string }) => {
      setAffiliates((prev) => prev.map((a) => {
        if (a.id === e.affiliateId) return { ...a, points: (a.points || 0) + e.xp };
        return a;
      }));
      toast.success(`Conquista desbloqueada: ${e.title} (+${e.xp} XP)`);
    };
    return () => { (window as any).onAchievementAwarded = undefined; };
  }, []);

  useEffect(() => {
    const onAward = () => refreshData();
    window.addEventListener('achievement-awarded', onAward as EventListener);
    return () => window.removeEventListener('achievement-awarded', onAward as EventListener);
  }, [year, monthIdx]);

  useEffect(() => {
    const onCalendarStatusUpdated = () => refreshData();
    window.addEventListener('calendar-status-updated', onCalendarStatusUpdated as EventListener);
    return () => window.removeEventListener('calendar-status-updated', onCalendarStatusUpdated as EventListener);
  }, [year, monthIdx]);

  const [form, setForm] = useState({ nome: "", instagram: "", link: "", observacoes: "" });
  const monthLabel = new Date(year, monthIdx, 1).toLocaleString("pt-BR", { month: "long" });

  const rankingData = [
    { position: 1, name: "Raissa Fabiola", level: "Aprendiz", xp: 15, maxXp: 100, points: 15, days: 1 },
    { position: 2, name: "Carolyne Cristine", level: "Aprendiz", xp: 15, maxXp: 100, points: 15, days: 1 },
    { position: 3, name: "Jeane Alves", level: "Aprendiz", xp: 15, maxXp: 100, points: 15, days: 1 }
  ];

  const openCalendarForAffiliate = (affiliate: any) => {
    (window as any).openLegacyCalendar?.({ id: affiliate.id, nome: affiliate.name });
  };

  const addAffiliate = async () => {
    const { nome, instagram, link } = form;
    if (!nome.trim() || !instagram.trim()) {
      toast("Preencha todos os campos obrigatórios");
      return;
    }
    
    const newAffiliate = await apiAddAffiliate(nome.trim(), instagram.trim());
    
    if (newAffiliate) {
      setForm({ nome: "", instagram: "", link: "", observacoes: "" });
      toast.success("Afiliada adicionada com sucesso");
      refreshData();
    }
  };

  const [isDeletingAffiliate, setIsDeletingAffiliate] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDeleteAffiliate = (affiliate: { id: string; name: string }) => {
    setAffiliateToDelete({ id: affiliate.id, name: affiliate.name });
    setIsDeletingAffiliate(true);
  };

  const handleDeleteAffiliate = async () => {
    if (!affiliateToDelete) return;
    const ok = await apiDeleteAffiliate(affiliateToDelete.id);
    if (ok) {
      toast.success("Afiliada removida com sucesso");
      setIsDeletingAffiliate(false);
      setAffiliateToDelete(null);
      await refreshData();
    }
  };

  const [isEditingAffiliate, setIsEditingAffiliate] = useState(false);
  const [editingAffiliateData, setEditingAffiliateData] = useState<any>(null);

  const openEditAffiliate = (affiliate: any) => {
    setEditingAffiliateData({ ...affiliate, instagram: affiliate.username.replace('@', '') });
    setIsEditingAffiliate(true);
  };

  const handleSaveAffiliate = async () => {
    if (!editingAffiliateData) return;
    const name = String(editingAffiliateData.name || '').trim();
    const instagram = String(editingAffiliateData.instagram || '').trim();
    if (!name || !instagram) {
      toast.error("Preencha nome e Instagram");
      return;
    }
    const ok = await apiUpdateAffiliate(editingAffiliateData.id, { name, instagram });
    if (ok) {
      toast.success("Afiliada atualizada com sucesso");
      setIsEditingAffiliate(false);
      setEditingAffiliateData(null);
      await refreshData();
    }
  };

  const changeMonth = (dir: "prev" | "next") => {
    const delta = dir === "prev" ? -1 : 1;
    const d = new Date(year, monthIdx + delta, 1);
    setYear(d.getFullYear());
    setMonthIdx(d.getMonth());
  };

  return (
    <DashboardLayout>
      <div className="bg-background">
      {/* Header com gradiente neon */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${bannerConfig.gradientFrom} ${bannerConfig.gradientVia} ${bannerConfig.gradientTo} opacity-10`} />
        <div className="glass-card border-b border-border/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-4 mb-3 animate-fade-in">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    {bannerConfig.title}
                  </h1>
                  <button 
                    onClick={() => setIsEditingBanner(true)}
                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors" 
                    title="Editar Banner"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {bannerConfig.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição do Banner */}
      <Dialog open={isEditingBanner} onOpenChange={setIsEditingBanner}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg bg-background/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Personalizar Banner</DialogTitle>
          <div className={`relative h-32 bg-gradient-to-br ${bannerForm.gradientFrom} ${bannerForm.gradientVia} ${bannerForm.gradientTo}`}>
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
            <div className="absolute bottom-6 left-8">
              <h2 className="text-2xl font-bold text-foreground">Personalizar Banner</h2>
              <p className="text-sm text-muted-foreground">Edite o título e visual do painel</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título do Painel</label>
                <div className="relative group">
                  <input
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full bg-muted/50 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-muted font-medium"
                    placeholder="Ex: Painel de Gestão"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <div className="relative group">
                  <input
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                    className="w-full bg-muted/50 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-muted font-medium"
                    placeholder="Ex: Acompanhe o desempenho..."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estilo do Gradiente</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { from: 'from-primary', via: 'via-secondary', to: 'to-accent', label: 'Neon' },
                    { from: 'from-blue-500', via: 'via-cyan-500', to: 'to-teal-500', label: 'Ocean' },
                    { from: 'from-purple-500', via: 'via-pink-500', to: 'to-red-500', label: 'Sunset' },
                    { from: 'from-green-500', via: 'via-emerald-500', to: 'to-lime-500', label: 'Nature' },
                    { from: 'from-yellow-500', via: 'via-orange-500', to: 'to-red-500', label: 'Fire' },
                    { from: 'from-gray-500', via: 'via-gray-400', to: 'to-gray-300', label: 'Mono' },
                  ].map((theme, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerForm({ ...bannerForm, gradientFrom: theme.from, gradientVia: theme.via, gradientTo: theme.to })}
                      className={`h-12 rounded-xl bg-gradient-to-r ${theme.from} ${theme.via} ${theme.to} opacity-80 hover:opacity-100 transition-all duration-300 ring-2 ring-offset-2 ring-offset-background ${
                        bannerForm.gradientFrom === theme.from ? 'ring-primary scale-105' : 'ring-transparent hover:scale-105'
                      }`}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsEditingBanner(false)}
                className="flex-1 px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-300"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveBanner}
                className="flex-[2] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeletingAffiliate} onOpenChange={setIsDeletingAffiliate}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Remover Afiliado</DialogTitle>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Remover Afiliado?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja remover <strong>{affiliateToDelete?.name}</strong>? Esta ação não pode ser desfeita e todos os dados serão perdidos.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeletingAffiliate(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors duration-300"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAffiliate}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearingMonth} onOpenChange={setIsClearingMonth}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Apagar dados do mês</DialogTitle>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Apagar dados do mês?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Esta ação remove todos os registros de todas as afiliadas para {monthLabel} de {year}. Esta operação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsClearingMonth(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors duration-300"
                disabled={isClearingMonthLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleClearMonth}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
                disabled={isClearingMonthLoading}
              >
                {isClearingMonthLoading ? "Apagando..." : "Sim, apagar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Afiliado */}
      <Dialog open={isEditingAffiliate} onOpenChange={setIsEditingAffiliate}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Editar Afiliado</DialogTitle>
          <div className="relative h-24 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px]" />
            <div className="absolute bottom-6 left-8">
              <h2 className="text-2xl font-bold text-foreground">Editar Afiliado</h2>
              <p className="text-sm text-muted-foreground">Atualize os dados do perfil</p>
            </div>
          </div>

          {editingAffiliateData && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.name}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="Nome do afiliado"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instagram (sem @)</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.instagram}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, instagram: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="usuario"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link do Instagram</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.instagramLink || ""}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, instagramLink: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.notes || ""}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, notes: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="Anotações gerais..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsEditingAffiliate(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAffiliate}
                  className="flex-[2] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="relative h-auto bg-gray-100/50 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 p-1.5 rounded-2xl inline-flex w-full sm:w-auto shadow-sm">
              <TabsTrigger 
                value="dashboard" 
                className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:shadow-sm dark:data-[state=active]:shadow-black/50 hover:text-foreground dark:hover:text-white min-w-0 sm:min-w-[120px]"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="truncate">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gamificacao" 
                className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:shadow-sm dark:data-[state=active]:shadow-black/50 hover:text-foreground dark:hover:text-white min-w-0 sm:min-w-[120px]"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span className="truncate">Gamificação</span>
              </TabsTrigger>
              <TabsTrigger 
                value="metricas" 
                className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:shadow-sm dark:data-[state=active]:shadow-black/50 hover:text-foreground dark:hover:text-white min-w-0 sm:min-w-[120px]"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="truncate">Métricas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ABA 1 - DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Cards de indicadores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.filter(a => (a.posted || 0) > 0).length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total de Afiliadas Ativas</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 group-hover:border-accent/40 transition-all duration-300">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.length > 0 ? Math.round(affiliates.reduce((acc, a) => acc + (a.performance || 0), 0) / affiliates.length) : 0}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Taxa Média de Cumprimento</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 group-hover:border-secondary/40 transition-all duration-300">
                    <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.filter(a => (a.posted || 0) === 0).length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total de Afiliados Inativos</div>
                    <div className="text-xs text-muted-foreground/70">Nunca fizeram postagens</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{affiliates.length > 0 ? [...affiliates].sort((a, b) => (b.points || 0) - (a.points || 0))[0].name : 'N/A'}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Afiliada Destaque</div>
                    <div className="text-xs text-muted-foreground/70">{affiliates.length > 0 ? `${[...affiliates].sort((a, b) => (b.points || 0) - (a.points || 0))[0].points} pts` : 'Sem dados'}</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Adicionar Nova Afiliada */}
            <GlassCard className="animate-scale-in">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">Adicionar Nova Afiliada</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Nome Completo</label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Instagram (sem @)</label>
                  <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Link do Instagram</label>
                  <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://instagram.com/usuario" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Observações</label>
                  <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
              </div>
              <Button onClick={addAffiliate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 sm:py-6 text-sm sm:text-lg font-semibold transition-all duration-300">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Adicionar Afiliada
              </Button>
            </GlassCard>

            {/* Gerenciar Afiliadas */}
            <GlassCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">Gerenciar Afiliadas</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="relative glass-card flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-border/50">
                    <Calendar className="w-4 h-4 text-primary" />
                    <button onClick={() => changeMonth("prev")} className="text-primary hover:scale-110 transition-transform"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs sm:text-sm font-medium">{monthLabel} de {year}</span>
                    <button onClick={() => changeMonth("next")} className="text-primary hover:scale-110 transition-transform"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "glass-card border border-border/50"}`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "glass-card border border-border/50"}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsClearingMonth(true)}
                    className="flex items-center gap-2 px-3 py-2 h-9 rounded-lg text-xs sm:text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/30"
                    title="Apagar dados do mês"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Apagar mês</span>
                  </button>
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={affiliateSearch}
                      onChange={(e) => setAffiliateSearch(e.target.value)}
                      placeholder="Buscar afiliada..."
                      className="pl-9 w-full glass-card border-border/50 focus:border-primary transition-all text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAffiliates.map((affiliate) => (
                    <div 
                      key={affiliate.id} 
                      className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-black/40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative h-full rounded-xl bg-gray-50/50 dark:bg-black/40 p-4 transition-colors duration-300 group-hover:bg-white dark:group-hover:bg-black/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative w-12 h-12 shrink-0">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse group-hover:animate-none" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-lg bg-white dark:bg-white/10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300">
                              {affiliate.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                              {affiliate.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mb-0.5">
                              {affiliate.username}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {affiliate.points} pts
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {affiliate.level}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Performance</span>
                            <span className={affiliate.performance && affiliate.performance >= 80 ? "text-green-500" : "text-primary"}>
                              {affiliate.performance ? `${affiliate.performance}%` : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                affiliate.performance && affiliate.performance >= 80 
                                  ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                                  : "bg-gradient-to-r from-primary to-blue-400"
                              }`}
                              style={{ width: `${affiliate.performance || 0}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 py-3 border-t border-gray-200 dark:border-white/5 mb-4">
                          <div className="text-center p-2 rounded-lg bg-gray-100/50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                            <div className="text-accent font-bold text-sm">{affiliate.posted}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Positivo</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-gray-100/50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                            <div className="text-destructive font-bold text-sm">{affiliate.notPosted}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Negativo</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => openEditAffiliate(affiliate)} 
                            className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 flex items-center justify-center group/btn"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => openCalendarForAffiliate(affiliate)} 
                            className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-secondary hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-all duration-300 flex items-center justify-center group/btn"
                            title="Calendário"
                          >
                            <Calendar className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => confirmDeleteAffiliate(affiliate)} 
                            className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all duration-300 flex items-center justify-center group/btn"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>

                        {affiliate.noRegistro && (
                          <button
                            onClick={() => openCalendarForAffiliate(affiliate)}
                            className="w-full mt-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                          >
                            Começar a marcar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAffiliates.map((affiliate) => (
                    <div key={affiliate.id} className="glass-card-hover border border-border/50 rounded-2xl p-4 group">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative w-12 h-12 shrink-0">
                            <div className="absolute inset-0 bg-primary/20 rounded-full" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-lg bg-white dark:bg-white/10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300">
                              {affiliate.name.charAt(0)}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                              {affiliate.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mb-1">
                              {affiliate.username}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
                              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {affiliate.points} pts
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {affiliate.level}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className={affiliate.performance && affiliate.performance >= 80 ? "text-green-500" : "text-primary"}>
                                {affiliate.performance ? `${affiliate.performance}%` : "0%"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-accent font-bold text-sm">{affiliate.posted}</div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Positivo</div>
                            </div>
                            <div className="text-center">
                              <div className="text-destructive font-bold text-sm">{affiliate.notPosted}</div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Negativo</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => openEditAffiliate(affiliate)} 
                              className="w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 flex items-center justify-center group/btn"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={() => openCalendarForAffiliate(affiliate)} 
                              className="w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-secondary hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-all duration-300 flex items-center justify-center group/btn"
                              title="Calendário"
                            >
                              <Calendar className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={() => confirmDeleteAffiliate(affiliate)} 
                              className="w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all duration-300 flex items-center justify-center group/btn"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {affiliate.noRegistro && (
                        <button
                          onClick={() => openCalendarForAffiliate(affiliate)}
                          className="w-full mt-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                        >
                          Começar a marcar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* ABA 2 - GAMIFICAÇÃO */}
          <TabsContent value="gamificacao" className="space-y-6 sm:space-y-8 animate-fade-in">
            <GlassCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-secondary/10 border border-secondary/20">
                      <Award className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-foreground">Sistema de Gamificação</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe pontuação, níveis e conquistas das suas afiliadas</p>
                </div>
              </div>

              {/* Como Funciona a Pontuação */}
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Como Funciona a Pontuação</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Cada ação registrada no calendário gera pontos (XP). Exemplo: Ao marcar "Postou Completo", você ganha 5 XP imediatamente. Esses pontos ajudam você a subir de nível e desbloquear novas recompensas.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {classes.map((statusClass) => {
                    let Icon = FileText;
                    if (statusClass.key === 'postou_vendas') Icon = Zap;
                    if (statusClass.key === 'postou') Icon = CheckCircle;
                    if (statusClass.key === 'nao_postou') Icon = UserX;
                    if (statusClass.key === 'sem_analise') Icon = Calendar;
                    const color = statusClass.bg || '#9b184e';
                    const textColor = statusClass.textColor || '#111827';

                    return (
                      <div
                        key={statusClass.key}
                        className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 p-1 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/20 h-full"
                      >
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                          style={{ background: color }}
                        />
                        
                        <div className="relative flex h-full flex-col justify-between rounded-xl bg-white dark:bg-black/40 p-5 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/80 dark:group-hover:bg-black/30">
                          {/* Header with Icon and Points */}
                          <div className="flex items-center justify-between mb-4 w-full">
                            <div
                              className="rounded-xl p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0"
                              style={{ color: textColor }}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm whitespace-nowrap ml-2 shrink-0"
                              style={{
                                background: `${color}20`,
                                borderColor: `${color}40`,
                                color: textColor,
                              }}
                            >
                              +{statusClass.points} pts
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-start text-left">
                            <h4 className="text-lg font-bold text-foreground mb-2 dark:group-hover:text-white transition-colors break-words">
                              {statusClass.label}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed dark:group-hover:text-muted-foreground/80 break-words">
                              {statusClass.description || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Como Funciona a Conquista */}
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Como Funciona a Conquista</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Conquistas são marcos especiais de dedicação. Exemplo: Manter uma sequência de 5 dias postando sem falhar libera um bônus extra de 50 XP. Elas podem ser mensais, semanais ou únicas.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-black/40 h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      <div className="relative flex h-full flex-col justify-between rounded-xl bg-white dark:bg-black/40 p-5 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/80 dark:group-hover:bg-black/30">
                        {/* Header with Icon and Points */}
                        <div className="flex items-center justify-between mb-4 w-full">
                          <div className="rounded-xl p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-yellow-500 shadow-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                            {achievement.icon?.startsWith("http") ? (
                              <img src={achievement.icon} alt="" className="w-6 h-6 object-cover rounded-md" />
                            ) : (
                              <span className="text-xl leading-none">{achievement.icon || "🏆"}</span>
                            )}
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-500 whitespace-nowrap ml-2 shrink-0">
                            +{achievement.xp} XP
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-start text-left">
                          <h4 className="text-lg font-bold text-foreground mb-2 dark:group-hover:text-white transition-colors break-words">
                            {achievement.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed dark:group-hover:text-muted-foreground/80 break-words">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Como Funcionam os Níveis */}
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-1">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Como Funcionam os Níveis</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Seu nível reflete sua experiência total acumulada. Quanto mais XP você ganha, mais alto você sobe na hierarquia.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {levels.map((level, index) => {
                    const nextLevel = levels[index + 1];
                    const xpRange = nextLevel ? `${level.minXP} - ${nextLevel.minXP} XP` : `${level.minXP}+ XP`;
                    
                    return (
                      <div key={level.id} className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-black/40 h-full">
                        <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                        
                        <div className="relative flex h-full flex-col justify-between rounded-xl bg-white dark:bg-black/40 p-5 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/80 dark:group-hover:bg-black/30">
                          {/* Header with Level Badge */}
                          <div className="flex items-center justify-between mb-4 w-full">
                            <div className={`rounded-xl p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-[10px] font-bold text-white overflow-hidden`}>
                                {level.icon?.startsWith("http") ? (
                                  <img src={level.icon} alt="" className="w-full h-full object-cover" />
                                ) : level.icon ? (
                                  <span className="text-sm leading-none">{level.icon}</span>
                                ) : (
                                  level.name.charAt(0)
                                )}
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-primary/10 border-primary/20 text-primary whitespace-nowrap ml-2 shrink-0">
                              Nível {index + 1}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-start text-left">
                            <h4 className="text-lg font-bold text-foreground mb-2 dark:group-hover:text-white transition-colors break-words">
                              {level.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed dark:group-hover:text-muted-foreground/80 break-words">
                              Faixa de XP: <span className="font-mono font-bold text-foreground">{xpRange}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dica */}
              <div className="glass-card border-l-4 border-primary rounded-xl p-4 mb-8">
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground mb-1 text-sm sm:text-base">Dica:</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Complete conquistas para ganhar pontos extras! Cada conquista tem sua própria recompensa em pontos.</div>
                  </div>
                </div>
              </div>

              

            </GlassCard>
          </TabsContent>

          {/* ABA 3 - MÉTRICAS */}
          <TabsContent value="metricas" className="space-y-6 sm:space-y-8 animate-fade-in">
            <GlassCard>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground">Métricas Mensais</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe o desempenho detalhado das suas afiliadas</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input value={metricsSearch} onChange={(e) => setMetricsSearch(e.target.value)} placeholder="Buscar afiliada..." className="pl-10 w-full sm:w-64 glass-card border-border/50 focus:border-primary transition-all" />
                  </div>
                </div>
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="glass-card-hover border border-border/50 rounded-2xl p-4 sm:p-6 group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.reduce((acc, a) => acc + (a.posted || 0), 0)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total de Postagens</div>
                      <div className="text-xs text-muted-foreground/70">No mês selecionado</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card-hover border border-border/50 rounded-2xl p-4 sm:p-6 group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 group-hover:border-accent/40 transition-all duration-300">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    </div>
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.reduce((acc, a) => acc + (a.salesPosts || 0), 0)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">Vendas Realizadas</div>
                      <div className="text-xs text-muted-foreground/70">Total no mês</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card-hover border border-border/50 rounded-2xl p-4 sm:p-6 group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 group-hover:border-secondary/40 transition-all duration-300">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-foreground">{affiliates.length > 0 ? [...affiliates].sort((a, b) => (b.performance || 0) - (a.performance || 0))[0].name : 'N/A'}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">Melhor Performance</div>
                      <div className="text-xs text-muted-foreground/70">{affiliates.length > 0 ? `${[...affiliates].sort((a, b) => (b.performance || 0) - (a.performance || 0))[0].performance}%` : 'Sem dados'}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-card-hover border border-border/50 rounded-2xl p-4 sm:p-6 group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.length}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Cadastradas</div>
                      <div className="text-xs text-muted-foreground/70">{affiliates.filter(a => (a.posted || 0) > 0).length} ativas no mês</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ranking de Pontuação */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    <span className="text-foreground">Ranking de Pontuação</span>
                  </h3>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold text-foreground">{monthLabel} de {year}</div>
                    <div className="text-xs text-muted-foreground">Pontuação do mês selecionado</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[...affiliates]
                    .sort((a, b) => b.points - a.points)
                    .map((affiliate, index) => {
                      const { currentLevel, nextLevel, progress } = getLevelInfo(affiliate.points);
                      const isFirstPlace = index === 0;

                      return (
                        <div key={index} className={`glass-card-hover rounded-2xl p-4 border border-border/50 group relative overflow-hidden transition-all duration-500 ${isFirstPlace ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30' : ''}`}>
                          {/* Efeito de brilho para o primeiro lugar */}
                          {isFirstPlace && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          )}
                          
                          <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap relative z-10">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all duration-300 relative ${isFirstPlace ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500' : 'bg-primary/20 text-primary border-2 border-primary/40 group-hover:border-primary'}`}>
                              
                              {isFirstPlace && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                  <div className="relative">
                                    <Crown 
                                      className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] animate-bounce" 
                                      style={{ 
                                        animationDuration: '2s',
                                        filter: 'drop-shadow(0 0 5px rgba(234, 179, 8, 0.5))' 
                                      }} 
                                    />
                                    <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full animate-pulse" />
                                  </div>
                                </div>
                              )}
                              
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`font-semibold text-sm sm:text-base ${isFirstPlace ? 'text-yellow-500' : 'text-foreground'}`}>
                                  {affiliate.name}
                                </div>
                                {isFirstPlace && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 font-bold uppercase tracking-wider border border-yellow-500/30">Líder</span>}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1.5">{currentLevel.name}</div>
                              
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground whitespace-nowrap">XP: {affiliate.points}/{nextLevel.minXP}</div>
                                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${isFirstPlace ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-primary'}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center px-2 sm:px-4 border-l border-border/30 min-w-[90px]">
                              <div className="font-bold text-accent text-base sm:text-lg">{affiliate.posted || 0}</div>
                              <div className="flex gap-2 mt-0.5">
                                <span className="text-xs text-accent" title="Postou">✅{affiliate.posted || 0}</span>
                                <span className="text-xs text-destructive" title="Não Postou">❌{affiliate.notPosted || 0}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 hidden sm:block">Postagens</div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="text-right min-w-[80px]">
                                <div className={`font-bold text-lg sm:text-xl ${isFirstPlace ? 'text-yellow-500 drop-shadow-sm' : 'text-foreground'}`}>
                                  {affiliate.points} pts
                                </div>
                                <div className="text-xs text-muted-foreground">Total acumulado</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rodapé */}
      <footer className="glass-card text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground mt-8 sm:mt-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <Link to="/support" className="hover:text-primary transition-colors smooth-transition">Condições e suporte</Link>
            <span className="hidden sm:inline">|</span>
            <Link to="/privacy" className="hover:text-primary transition-colors smooth-transition">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
      </div>
      {isCalendarOpen && selectedAffiliate && (
        <AffiliateCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          affiliate={selectedAffiliate}
        />
      )}
    </DashboardLayout>
  );
}
