import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Trophy, Award, Zap, Plus, Check, X, SquarePen, Trash2, Users, Lock, FileText } from "lucide-react";
import { IconSelector } from "@/components/IconSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useStatusConfig } from "@/store/statusConfig";
import { useAffiliateGamification } from "@/hooks/useAffiliateGamification";
import type { Achievement, Level, StatusClass } from "@/store/statusConfig";
import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export default function Gamification() {
  const { user } = useAuthStore();
  const { classes, achievements, levels, addClass, updateClass, removeClass, setPoints, addAchievement, updateAchievement, removeAchievement, addLevel, updateLevel, removeLevel, initializeFromSupabase } = useStatusConfig();
  const [form, setForm] = useState({ label: "", description: "", points: 0, bg: "#ffffff" });
  const [achievementForm, setAchievementForm] = useState({ title: "", description: "", xp: 0, classKeys: [] as string[], streakDays: 0, countThreshold: 0, timeWindow: "month" as "month" | "week" | "total", icon: "" });
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editingClass, setEditingClass] = useState<StatusClass | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  
  const [affiliates, setAffiliates] = useState<{id: string, name: string}[]>([]);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>("");
  
  useEffect(() => {
    void initializeFromSupabase();
  }, [initializeFromSupabase]);

  useEffect(() => {
    if (!user) return;
    async function loadAffiliates() {
      const { data } = await supabase
        .from('affiliates')
        .select('id, name')
        .order('name');
      
      if (data) {
        setAffiliates(data);
        if (data.length > 0 && !selectedAffiliateId) {
          setSelectedAffiliateId(data[0].id);
        }
      }
    }
    loadAffiliates();
  }, [user]);

  const { currentLevel, nextLevel, totalXP, progressPercent, xpInCurrentLevel, xpForNextLevel, calendarStatuses, awardedAchievements } = useAffiliateGamification(selectedAffiliateId);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  /* const levels = [
    { name: "Iniciante", xpRequired: 0, color: "from-gray-500 to-gray-600" },
    { name: "Novato", xpRequired: 300, color: "from-green-500 to-green-600" },
    { name: "Intermediário", xpRequired: 800, color: "from-blue-500 to-blue-600" },
    { name: "Avançado", xpRequired: 1500, color: "from-purple-500 to-purple-600" },
    { name: "Expert", xpRequired: 2500, color: "from-orange-500 to-orange-600" },
    { name: "Mestre", xpRequired: 4000, color: "from-red-500 to-red-600" },
    { name: "Lenda", xpRequired: 6000, color: "from-yellow-400 to-yellow-500" },
  ]; */

  const toggleClassInAchievementForm = (key: string) => {
    setAchievementForm((prev) => {
      const exists = prev.classKeys.includes(key);
      return { ...prev, classKeys: exists ? prev.classKeys.filter((k) => k !== key) : [...prev.classKeys, key] };
    });
  };

  const getProgressFor = (a: Achievement) => {
    if (!selectedAffiliateId) return { current: 0, required: 0, percent: 0, awarded: false };
    
    const entries = Object.entries(calendarStatuses || {}).filter(([k]) => k.startsWith(`${selectedAffiliateId}:`));
    const valid = new Set(a.classKeys || []);
    const dates = entries
      .filter(([, v]) => valid.has(v))
      .map(([k]) => new Date(k.split(":")[1]))
      .sort((d1, d2) => d1.getTime() - d2.getTime());
    let current = 0;
    const required = (a.streakDays || a.countThreshold || 0) as number;
    if ((a.streakDays || 0) > 0) {
      let run = 0;
      let prev: Date | null = null;
      for (const d of dates) {
        if (prev) {
          const diff = (d.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        prev = d;
        if (run > current) current = run;
      }
    } else if ((a.countThreshold || 0) > 0) {
      const ym = `${currentYear}-${String((currentMonth || 0) + 1).padStart(2, "0")}`;
      if (a.timeWindow === "month") {
        current = entries.filter(([k, v]) => k.includes(`:${ym}-`) && valid.has(v)).length;
      } else if (a.timeWindow === "total") {
        current = entries.filter(([, v]) => valid.has(v)).length;
      } else {
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        current = dates.filter((d) => d >= monday && d <= sunday).length;
      }
    }
    const ym = `${currentYear}-${String((currentMonth || 0) + 1).padStart(2, "0")}`;
    const awardKey = a.timeWindow === "month" ? `${a.id}@${ym}` : a.id;
    const awarded = !!(awardedAchievements && awardedAchievements[awardKey]);
    const percent = required ? Math.min(100, Math.round((current / required) * 100)) : 0;
    return { current, required, percent, awarded };
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 flex items-center gap-2 md:gap-3">
            <Trophy className="w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 text-primary animate-glow" />
            Gamificação
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure níveis e conquistas da sua equipe
          </p>
        </div>

        {/* Affiliate Progress Section */}
        <div className="mb-8">
          {selectedAffiliateId && (
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Level Badge */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br ${currentLevel?.color || "from-gray-500 to-gray-600"} shadow-lg shadow-primary/20 shrink-0`}>
                  <span className="text-3xl font-bold text-white">{currentLevel?.name?.[0] || "?"}</span>
                </div>

                {/* Stats */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        {currentLevel?.name || "Sem Nível"}
                      </h3>
                      <p className="text-muted-foreground">
                        Total XP: <span className="text-foreground font-mono font-bold">{totalXP}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-sm text-muted-foreground mb-1">Próximo Nível: {nextLevel?.name || "Máximo"}</div>
                      <div className="text-xs font-mono">
                        {xpInCurrentLevel} / {nextLevel ? (nextLevel.minXP - (currentLevel?.minXP || 0)) : "-"} XP
                      </div>
                    </div>
                  </div>

                  <Progress value={progressPercent} className="h-3 bg-muted/20" indicatorClassName={`bg-gradient-to-r ${currentLevel?.color || "from-gray-500 to-gray-600"}`} />

                  {nextLevel && (
                    <p className="text-xs text-center mt-3 text-muted-foreground">
                      Faltam <span className="text-foreground font-bold">{xpForNextLevel} XP</span> para alcançar o nível {nextLevel.name}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Levels Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Níveis
            </h2>
            <NeonButton 
              variant="glass" 
              className="flex items-center gap-2 text-sm md:text-base"
              onClick={() => setEditingLevel({ id: "", name: "", minXP: 0, color: "from-gray-500 to-gray-600" })}
            >
              <Plus className="w-4 h-4" />
              Adicionar Nível
            </NeonButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {levels.map((level) => (
              <GlassCard key={level.id} hover className="p-4 md:p-5 lg:p-6 group relative flex flex-col">
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${level.color} mb-3 md:mb-4`} />
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg overflow-hidden shrink-0`}>
                      {level.icon?.startsWith("http") ? (
                        <img src={level.icon} alt="" className="w-full h-full object-cover" />
                      ) : level.icon ? (
                        <span className="text-2xl leading-none">{level.icon}</span>
                      ) : (
                        <span className="text-xl font-bold text-white">{level.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold mb-0.5">{level.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {level.minXP} XP necessário
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" 
                      title="Editar" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLevel({ ...level });
                      }}
                    >
                      <SquarePen className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button 
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" 
                      title="Remover" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Confirmar remoção do nível?')) {
                          removeLevel(level.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Status Classes Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold">Classes de Pontuação</h2>
            <NeonButton 
              variant="glass" 
              className="flex items-center gap-2 text-sm md:text-base"
              onClick={() => setIsAddingClass(true)}
            >
              <Plus className="w-4 h-4" />
              Adicionar Classe
            </NeonButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {classes.map((c) => (
              <GlassCard key={c.key} hover className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{c.label}</h3>
                        <div className="text-xs text-muted-foreground mt-1">{c.key}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingClass(c)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Editar">
                        <SquarePen className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button onClick={() => { if (confirm('Confirmar remoção da classe?')) removeClass(c.key); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Remover">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="text-sm">Pontos:</div>
                  <span className="font-mono text-neon-cyan">{c.points}</span>
                  <div className="text-sm">Cor:</div>
                  <div className="w-6 h-6 rounded-lg border border-white/20" style={{ background: c.bg || "#000000" }} />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-neon-violet" />
              Conquistas
            </h2>
            <NeonButton variant="glass" className="flex items-center gap-2" onClick={() => setEditingAchievement({ 
              id: "", 
              title: "", 
              description: "", 
              xp: 0, 
              classKeys: [], 
              streakDays: 0, 
              icon: "🏆", 
              scope: "individual", 
              countThreshold: 0, 
              timeWindow: "month",
              ignoreDays: [] 
            })}>
              <Plus className="w-4 h-4" />
              Nova Conquista
            </NeonButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((a) => (
              <GlassCard key={a.id} className="p-4 relative group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-violet/20 to-neon-pink/20 flex items-center justify-center text-2xl border border-border">
                    {a.icon || "🏆"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate pr-8">{a.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{a.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                        +{a.xp} XP
                      </span>
                      {a.streakDays ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-muted/20 border border-border flex items-center gap-1">
                          🔥 {a.streakDays} dias
                        </span>
                      ) : null}
                      {a.timeWindow ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-muted/20 border border-border capitalize">
                          📅 {a.timeWindow === 'month' ? 'Mensal' : a.timeWindow === 'week' ? 'Semanal' : 'Total'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingAchievement(a)} 
                      className="p-1.5 rounded-lg bg-background/80 hover:bg-muted transition-colors"
                      title="Editar"
                    >
                      <SquarePen className="w-4 h-4 text-foreground" />
                    </button>
                    <button 
                      onClick={() => { if (confirm('Confirmar remoção da conquista?')) removeAchievement(a.id); }} 
                      className="p-1.5 rounded-lg bg-background/80 hover:bg-red-500/20 transition-colors" 
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <Dialog open={!!editingAchievement} onOpenChange={(open) => !open && setEditingAchievement(null)}>
            <DialogContent className="max-w-2xl bg-popover/80 backdrop-blur-xl border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>Editar Conquista</DialogTitle>
              </DialogHeader>
              
              {editingAchievement && (
                <div className="grid gap-4 py-4">
                  <div className="flex gap-4 mb-2">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Ícone</label>
                      <IconSelector value={editingAchievement.icon || "🏆"} onChange={(v) => setEditingAchievement({ ...editingAchievement, icon: v })} />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Título</label>
                        <input
                          value={editingAchievement.title}
                          onChange={(e) => setEditingAchievement({ ...editingAchievement, title: e.target.value })}
                          className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">XP</label>
                        <input
                          type="number"
                          value={editingAchievement.xp}
                          onChange={(e) => setEditingAchievement({ ...editingAchievement, xp: Number(e.target.value) })}
                          className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                    <textarea
                      value={editingAchievement.description}
                      onChange={(e) => setEditingAchievement({ ...editingAchievement, description: e.target.value })}
                      className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Dias Seguidos</label>
                      <input
                        type="number"
                        value={editingAchievement.streakDays || 0}
                        onChange={(e) => setEditingAchievement({ ...editingAchievement, streakDays: Number(e.target.value) })}
                        className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Resetar a Conquista em:</label>
                      <Select
                        value={editingAchievement.timeWindow || "month"}
                        onValueChange={(v) => setEditingAchievement({ ...editingAchievement, timeWindow: v as "month" | "week" | "total" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Mensalmente</SelectItem>
                          <SelectItem value="week">Semanalmente</SelectItem>
                          <SelectItem value="total">Não Resetar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm mb-2 text-muted-foreground">Dias Inválidos (não quebram sequência)</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Dias que não interrompem a contagem da sequência. Exemplo: Se 'Sábado' e 'Domingo' forem marcados, uma postagem na Sexta e outra na Segunda serão consideradas consecutivas.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { day: 0, label: "Domingo" },
                        { day: 1, label: "Segunda" },
                        { day: 2, label: "Terça" },
                        { day: 3, label: "Quarta" },
                        { day: 4, label: "Quinta" },
                        { day: 5, label: "Sexta" },
                        { day: 6, label: "Sábado" },
                      ].map(({ day, label }) => {
                        const checked = (editingAchievement.ignoreDays || []).includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const current = editingAchievement.ignoreDays || [];
                              const next = checked ? current.filter((d) => d !== day) : [...current, day];
                              setEditingAchievement({ ...editingAchievement, ignoreDays: next });
                            }}
                            className={`px-3 py-1 rounded-xl border text-sm flex items-center gap-2 transition-colors ${checked ? "bg-accent/20 border-accent text-accent-foreground" : "glass-card hover:bg-white/5"}`}
                          >
                            {label}
                            {checked ? <Check className="w-3 h-3" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm mb-2 text-muted-foreground">Classes válidas</div>
                    <div className="flex flex-wrap gap-2">
                      {classes.map((c) => {
                        const checked = (editingAchievement.classKeys || []).includes(c.key);
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => {
                              const currentKeys = editingAchievement.classKeys || [];
                              const next = checked ? currentKeys.filter((k) => k !== c.key) : [...currentKeys, c.key];
                              setEditingAchievement({ ...editingAchievement, classKeys: next });
                            }}
                            className={`px-3 py-1 rounded-xl border text-sm flex items-center gap-2 transition-colors ${checked ? "bg-primary/20 border-primary text-primary-foreground" : "glass-card hover:bg-white/5"}`}
                          >
                            <span className={`w-3 h-3 rounded-full ${c.bgClass || ""}`} style={{ background: c.bgClass ? undefined : c.bg }} />
                            {c.label}
                            {checked ? <Check className="w-3 h-3" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <NeonButton variant="glass" onClick={() => setEditingAchievement(null)}>Cancelar</NeonButton>
                <NeonButton 
                  variant="glass" 
                  onClick={() => {
                    if (editingAchievement) {
                      updateAchievement(editingAchievement.id, editingAchievement);
                      setEditingAchievement(null);
                    }
                  }}
                >
                  Salvar Alterações
                </NeonButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
            <DialogContent className="max-w-md bg-popover/80 backdrop-blur-xl border-border text-popover-foreground">
              <DialogHeader>
                <DialogTitle>{editingLevel?.id ? "Editar Nível" : "Novo Nível"}</DialogTitle>
              </DialogHeader>
              {editingLevel && (
                <div className="grid gap-4 py-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Nome do Nível</label>
                    <input
                      value={editingLevel.name}
                      onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                      placeholder="Ex: Iniciante"
                      className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">XP Necessário</label>
                    <input
                      type="number"
                      value={editingLevel.minXP}
                      onChange={(e) => setEditingLevel({ ...editingLevel, minXP: Number(e.target.value) })}
                      placeholder="Ex: 0"
                      className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Ícone</label>
                    <IconSelector value={editingLevel.icon || ""} onChange={(v) => setEditingLevel({ ...editingLevel, icon: v })} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Cor (Gradiente)</label>
                    <Select
                      value={editingLevel.color}
                      onValueChange={(v) => setEditingLevel({ ...editingLevel, color: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="from-gray-500 to-gray-600">Cinza (Iniciante)</SelectItem>
                        <SelectItem value="from-green-500 to-green-600">Verde (Novato)</SelectItem>
                        <SelectItem value="from-blue-500 to-blue-600">Azul (Intermediário)</SelectItem>
                        <SelectItem value="from-purple-500 to-purple-600">Roxo (Avançado)</SelectItem>
                        <SelectItem value="from-orange-500 to-orange-600">Laranja (Expert)</SelectItem>
                        <SelectItem value="from-red-500 to-red-600">Vermelho (Mestre)</SelectItem>
                        <SelectItem value="from-yellow-400 to-yellow-500">Dourado (Lenda)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <NeonButton variant="glass" onClick={() => setEditingLevel(null)}>Cancelar</NeonButton>
                <NeonButton 
                  variant="glass" 
                  onClick={() => {
                    if (editingLevel) {
                      if (editingLevel.id) {
                        updateLevel(editingLevel.id, editingLevel);
                      } else {
                        const id = editingLevel.name.toLowerCase().trim().replace(/\s+/g, "_");
                        if (!id || !editingLevel.name) return;
                        addLevel({ ...editingLevel, id });
                      }
                      setEditingLevel(null);
                    }
                  }}
                >
                  Salvar
                </NeonButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
            <DialogContent className="w-[95vw] sm:w-full max-w-md bg-popover/80 backdrop-blur-xl border-border text-popover-foreground p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>Nova Classe</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nome</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="Nome da classe"
                    className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                  />
                </div>
                <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descrição curta"
                      className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Pontos</label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                    placeholder="0"
                    className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-input w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Cor</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.bg}
                      onChange={(e) => setForm({ ...form, bg: e.target.value })}
                      className="bg-transparent p-1 rounded-xl border h-10 w-20 cursor-pointer"
                    />
                    <span className="text-sm font-mono opacity-70">{form.bg}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <NeonButton variant="glass" onClick={() => setIsAddingClass(false)}>Cancelar</NeonButton>
                <NeonButton 
                  variant="glass" 
                  onClick={() => {
                    const key = form.label.toLowerCase().trim().replace(/\s+/g, "_");
                    if (!form.label) return;
                    addClass({ key, label: form.label, description: form.description, points: form.points, bg: form.bg });
                    setForm({ label: "", description: "", points: 0, bg: "#ffffff" });
                    setIsAddingClass(false);
                  }}
                >
                  Adicionar
                </NeonButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
            <DialogContent className="w-[95vw] sm:w-full max-w-lg bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px]" />
                <div className="absolute bottom-6 left-8">
                  <h2 className="text-2xl font-bold text-foreground">Editar Classe</h2>
                  <p className="text-sm text-muted-foreground">Personalize os atributos da classe</p>
                </div>
              </div>

              {editingClass && (
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da Classe</label>
                      <div className="relative group">
                        <input
                          value={editingClass.label}
                          onChange={(e) => setEditingClass({ ...editingClass, label: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                          placeholder="Ex: Postou Vendas"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
                      <div className="relative group">
                        <input
                          value={editingClass.description || ""}
                          onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                          placeholder="Ex: Ganha pontos ao realizar vendas..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pontuação</label>
                        <div className="relative group">
                          <input
                            type="number"
                            value={editingClass.points}
                            onChange={(e) => setEditingClass({ ...editingClass, points: Number(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-mono font-bold text-lg"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                            <span className="text-xs font-bold">PTS</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor do Badge</label>
                        <div className="flex items-center gap-3 p-1.5 bg-muted/50 dark:bg-muted/20 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm">
                            <input
                              type="color"
                              value={editingClass.bg || "#000000"}
                              onChange={(e) => setEditingClass({ ...editingClass, bg: e.target.value, bgClass: undefined })}
                              className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-none p-0 m-0"
                            />
                          </div>
                          <span className="font-mono text-xs font-medium opacity-70 uppercase truncate">
                            {editingClass.bg || "#000000"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    <button 
                      onClick={() => setEditingClass(null)}
                      className="flex-1 px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-300"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        if (editingClass) {
                          updateClass(editingClass.key, editingClass);
                          setEditingClass(null);
                        }
                      }}
                      className="flex-[2] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        
      </div>
    </DashboardLayout>
  );
}
