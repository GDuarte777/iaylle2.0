import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type StatusClass = {
  key: string;
  label: string;
  description?: string;
  points: number;
  bgClass?: string;
  bg?: string;
  textColor?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  xp: number;
  classKeys: string[];
  streakDays?: number;
  icon?: string;
  scope?: "global" | "individual";
  countThreshold?: number;
  timeWindow?: "month" | "week" | "total";
  ignoreDays?: number[];
};

export interface Level {
  id: string;
  name: string;
  minXP: number;
  color: string;
  icon?: string;
};

type Store = {
  classes: StatusClass[];
  addClass: (c: StatusClass) => void;
  updateClass: (key: string, patch: Partial<StatusClass>) => void;
  removeClass: (key: string) => void;
  setPoints: (key: string, points: number) => void;
  initializeFromSupabase: () => Promise<void>;

  achievements: Achievement[];
  addAchievement: (a: Achievement) => void;
  updateAchievement: (id: string, patch: Partial<Achievement>) => void;
  removeAchievement: (id: string) => void;

  levels: Level[];
  addLevel: (l: Level) => void;
  updateLevel: (id: string, patch: Partial<Level>) => void;
  removeLevel: (id: string) => void;
};

export const useStatusConfig = create<Store>((set, get) => ({
  classes: [
    { key: "postou_vendas", label: "Postou Completo", description: "Postou sobre o dia + sobre o produto", points: 5, bgClass: "status-postou-vendas", bg: "#059669", textColor: "white" },
    { key: "postou", label: "Atenção", description: "Postou somente sobre o dia sem falar do produto / ou postou somente sobre o produto e não postou sobre o dia", points: 2, bgClass: "status-postou", bg: "#F59E0B", textColor: "white" },
    { key: "nao_postou", label: "Não Postou", description: "Não realizou postagem", points: 0, bgClass: "status-nao-postou", bg: "#EF4444", textColor: "white" },
    { key: "sem_analise", label: "Sem Análise", description: "Dia neutro", points: 0, bgClass: "status-sem-analise", bg: "#6B7280", textColor: "white" },
  ],
  addClass: async (c) => {
    await supabase.from('gamification_classes').upsert({
      key: c.key,
      label: c.label,
      description: c.description || null,
      points: c.points,
      bg_class: c.bgClass || null,
      bg: c.bg || null,
      text_color: c.textColor || null,
    }, { onConflict: 'key' });
    set((s) => ({ classes: [...s.classes.filter((x) => x.key !== c.key), c] }));
  },
  updateClass: async (key, patch) => {
    await supabase.from('gamification_classes').update({
      label: patch.label,
      description: patch.description,
      points: patch.points,
      bg_class: patch.bgClass,
      bg: patch.bg,
      text_color: patch.textColor,
    }).eq('key', key);
    set((s) => ({ classes: s.classes.map((c) => (c.key === key ? { ...c, ...patch } : c)) }));
  },
  removeClass: async (key) => {
    const { error } = await supabase.from('gamification_classes').delete().eq('key', key);
    if (error) {
      console.error('Erro ao remover classe:', error);
      toast.error('Erro ao remover classe');
      return;
    }
    set((s) => ({ classes: s.classes.filter((c) => c.key !== key) }));
    toast.success('Classe removida');
  },
  setPoints: async (key, points) => {
    await supabase.from('gamification_classes').update({ points }).eq('key', key);
    set((s) => ({ classes: s.classes.map((c) => (c.key === key ? { ...c, points } : c)) }));
  },
  initializeFromSupabase: async () => {
    const [clsRes, lvlRes, achRes] = await Promise.all([
      supabase.from('gamification_classes').select('*'),
      supabase.from('levels_catalog').select('*'),
      supabase.from('achievements_catalog').select('*'),
    ]);
    const classes = Array.isArray(clsRes.data) ? clsRes.data.map((r: any) => ({
      key: r.key,
      label: r.label,
      description: r.description || undefined,
      points: r.points || 0,
      bgClass: r.bg_class || undefined,
      bg: r.bg || undefined,
      textColor: r.text_color || undefined,
    })) : get().classes;
    const levels = Array.isArray(lvlRes.data) ? lvlRes.data.map((r: any) => ({
      id: r.id,
      name: r.name,
      minXP: r.min_xp,
      color: r.color,
      icon: r.icon || undefined,
    })) : get().levels;
    const achievements = Array.isArray(achRes.data) ? achRes.data.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      xp: r.xp,
      classKeys: Array.isArray(r.class_keys) ? r.class_keys : [],
      streakDays: r.streak_days || undefined,
      icon: r.icon || undefined,
      scope: r.scope || undefined,
      countThreshold: r.count_threshold || undefined,
      timeWindow: r.time_window || undefined,
      ignoreDays: Array.isArray(r.ignore_days) ? r.ignore_days : [],
    })) : get().achievements;
    set({ classes, levels, achievements });
  },

  achievements: [
    {
      id: "sequencia_5_dias",
      title: "Sequência de 5 dias",
      description: "Recebe pontos ao marcar classes por 5 dias seguidos.",
      xp: 50,
      classKeys: ["postou", "postou_vendas"],
      streakDays: 5,
      icon: "🔥",
      scope: "individual",
    },
    {
      id: "cem_postagens_mes",
      title: "100 postagens no mês",
      description: "Alcance 100 marcações válidas no mês corrente.",
      xp: 200,
      classKeys: ["postou", "postou_vendas"],
      countThreshold: 100,
      timeWindow: "month",
      icon: "💯",
      scope: "individual",
    },
  ],
  addAchievement: async (a) => {
    await supabase.from('achievements_catalog').upsert({
      id: a.id,
      title: a.title,
      description: a.description,
      xp: a.xp,
      class_keys: a.classKeys,
      streak_days: a.streakDays || null,
      icon: a.icon || null,
      scope: a.scope || null,
      count_threshold: a.countThreshold || null,
      time_window: a.timeWindow || null,
      ignore_days: a.ignoreDays || [],
    }, { onConflict: 'id' });
    set((s) => ({ achievements: [...s.achievements.filter((x) => x.id !== a.id), a] }));
  },
  updateAchievement: async (id, patch) => {
    await supabase.from('achievements_catalog').update({
      title: patch.title,
      description: patch.description,
      xp: patch.xp,
      class_keys: patch.classKeys,
      streak_days: patch.streakDays,
      icon: patch.icon,
      scope: patch.scope,
      count_threshold: patch.countThreshold,
      time_window: patch.timeWindow,
      ignore_days: patch.ignoreDays,
    }).eq('id', id);
    set((s) => ({ achievements: s.achievements.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },
  removeAchievement: async (id) => {
    const { error } = await supabase.from('achievements_catalog').delete().eq('id', id);
    if (error) {
      console.error('Erro ao remover conquista:', error);
      toast.error('Erro ao remover conquista');
      return;
    }
    set((s) => ({ achievements: s.achievements.filter((m) => m.id !== id) }));
    toast.success('Conquista removida');
  },

  levels: [
    { id: "iniciante", name: "Iniciante", minXP: 0, color: "from-gray-500 to-gray-600" },
    { id: "novato", name: "Novato", minXP: 300, color: "from-green-500 to-green-600" },
    { id: "intermediario", name: "Intermediário", minXP: 800, color: "from-blue-500 to-blue-600" },
    { id: "avancado", name: "Avançado", minXP: 1500, color: "from-purple-500 to-purple-600" },
    { id: "expert", name: "Expert", minXP: 2500, color: "from-orange-500 to-orange-600" },
    { id: "mestre", name: "Mestre", minXP: 4000, color: "from-red-500 to-red-600" },
    { id: "lenda", name: "Lenda", minXP: 6000, color: "from-yellow-400 to-yellow-500" },
  ],
  addLevel: async (l) => {
    await supabase.from('levels_catalog').upsert({
      id: l.id,
      name: l.name,
      min_xp: l.minXP,
      color: l.color,
      icon: l.icon || null,
    }, { onConflict: 'id' });
    set((s) => ({ levels: [...s.levels.filter((x) => x.id !== l.id), l] }));
  },
  updateLevel: async (id, patch) => {
    await supabase.from('levels_catalog').update({
      name: patch.name,
      min_xp: patch.minXP,
      color: patch.color,
      icon: patch.icon,
    }).eq('id', id);
    set((s) => ({ levels: s.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  },
  removeLevel: async (id) => {
    const { error } = await supabase.from('levels_catalog').delete().eq('id', id);
    if (error) {
      console.error('Erro ao remover nível:', error);
      toast.error('Erro ao remover nível');
      return;
    }
    set((s) => ({ levels: s.levels.filter((l) => l.id !== id) }));
    toast.success('Nível removido');
  },
}));
