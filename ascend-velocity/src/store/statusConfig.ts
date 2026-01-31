import { create } from "zustand";
import { getAuthedUserId, supabase, userCanWrite } from "../lib/supabase.ts";
import { toast } from "sonner";

export type StatusClass = {
  key: string;
  label: string;
  description?: string;
  points: number;
  bgClass?: string;
  bg?: string;
  textColor?: string;
  type?: 'positive' | 'negative' | 'neutral';
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

type UserGamificationConfig = {
  classes: StatusClass[];
  achievements: Achievement[];
  levels: Level[];
};

 

async function loadUserGamificationConfig(userId: string) {
  const { data, error } = await supabase
    .from("user_gamification_config")
    .select("config")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { config: null as UserGamificationConfig | null, error };
  const config = (data as any)?.config as UserGamificationConfig | undefined;
  return { config: config || null, error: null };
}

async function upsertUserGamificationConfig(userId: string, config: UserGamificationConfig) {
  const canWrite = await userCanWrite(userId);
  if (!canWrite) {
    toast.error("Esta funcionalidade não está disponível no seu plano atual.");
    return { data: null, error: { message: "forbidden" } } as any;
  }

  return supabase.from("user_gamification_config").upsert(
    {
      user_id: userId,
      config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

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
    { key: "postou_vendas", label: "Postou Completo", description: "Postou sobre o dia + sobre o produto", points: 5, bgClass: "status-postou-vendas", bg: "#059669", textColor: "white", type: "positive" },
    { key: "postou", label: "Atenção", description: "Postou somente sobre o dia sem falar do produto / ou postou somente sobre o produto e não postou sobre o dia", points: 2, bgClass: "status-postou", bg: "#F59E0B", textColor: "white", type: "positive" },
    { key: "nao_postou", label: "Não Postou", description: "Não realizou postagem", points: 0, bgClass: "status-nao-postou", bg: "#EF4444", textColor: "white", type: "negative" },
    { key: "sem_analise", label: "Sem Análise", description: "Dia neutro", points: 0, bgClass: "status-sem-analise", bg: "#6B7280", textColor: "white", type: "neutral" },
  ],
  addClass: async (c) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const classes = [...prev.classes.filter((x) => x.key !== c.key), c];
    set({ classes });
    await upsertUserGamificationConfig(userId, { classes, achievements: prev.achievements, levels: prev.levels });
  },
  updateClass: async (key, patch) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const classes = prev.classes.map((c) => (c.key === key ? { ...c, ...patch } : c));
    set({ classes });
    await upsertUserGamificationConfig(userId, { classes, achievements: prev.achievements, levels: prev.levels });
  },
  removeClass: async (key) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const classes = prev.classes.filter((c) => c.key !== key);
    set({ classes });
    const { error } = await upsertUserGamificationConfig(userId, { classes, achievements: prev.achievements, levels: prev.levels });
    if (error) {
      console.error('Erro ao remover classe:', error);
      toast.error('Erro ao remover classe');
      return;
    }
    toast.success('Classe removida');
  },
  setPoints: async (key, points) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const classes = prev.classes.map((c) => (c.key === key ? { ...c, points } : c));
    set({ classes });
    await upsertUserGamificationConfig(userId, { classes, achievements: prev.achievements, levels: prev.levels });
  },
  initializeFromSupabase: async () => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const { config, error } = await loadUserGamificationConfig(userId);

    if (error) {
      return;
    }

    if (!config) {
      const prev = get();
      const seed: UserGamificationConfig = {
        classes: prev.classes,
        achievements: prev.achievements,
        levels: prev.levels,
      };
      await upsertUserGamificationConfig(userId, seed);
      set(seed);
      return;
    }

    const classes = Array.isArray((config as any)?.classes) ? (config as any).classes : get().classes;
    const achievements = Array.isArray((config as any)?.achievements) ? (config as any).achievements : get().achievements;
    const levels = Array.isArray((config as any)?.levels)
      ? (config as any).levels.slice().sort((a: any, b: any) => (a?.minXP || 0) - (b?.minXP || 0))
      : get().levels;

    set({ classes, achievements, levels });
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
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const achievements = [...prev.achievements.filter((x) => x.id !== a.id), a];
    set({ achievements });
    await upsertUserGamificationConfig(userId, { classes: prev.classes, achievements, levels: prev.levels });
  },
  updateAchievement: async (id, patch) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const achievements = prev.achievements.map((m) => (m.id === id ? { ...m, ...patch } : m));
    set({ achievements });
    await upsertUserGamificationConfig(userId, { classes: prev.classes, achievements, levels: prev.levels });
  },
  removeAchievement: async (id) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const achievements = prev.achievements.filter((m) => m.id !== id);
    set({ achievements });
    const { error } = await upsertUserGamificationConfig(userId, { classes: prev.classes, achievements, levels: prev.levels });
    if (error) {
      console.error('Erro ao remover conquista:', error);
      toast.error('Erro ao remover conquista');
      return;
    }
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
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const levels = [...prev.levels.filter((x) => x.id !== l.id), l].sort((a, b) => a.minXP - b.minXP);
    set({ levels });
    await upsertUserGamificationConfig(userId, { classes: prev.classes, achievements: prev.achievements, levels });
  },
  updateLevel: async (id, patch) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const levels = prev.levels
      .map((l) => (l.id === id ? { ...l, ...patch } : l))
      .sort((a, b) => a.minXP - b.minXP);
    set({ levels });
    await upsertUserGamificationConfig(userId, { classes: prev.classes, achievements: prev.achievements, levels });
  },
  removeLevel: async (id) => {
    const userId = await getAuthedUserId();
    if (!userId) return;

    const prev = get();
    const levels = prev.levels.filter((l) => l.id !== id);
    set({ levels });
    const { error } = await upsertUserGamificationConfig(userId, { classes: prev.classes, achievements: prev.achievements, levels });
    if (error) {
      console.error('Erro ao remover nível:', error);
      toast.error('Erro ao remover nível');
      return;
    }
    toast.success('Nível removido');
  },
}));
