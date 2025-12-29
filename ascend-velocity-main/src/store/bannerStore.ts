import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BannerConfig {
  title: string;
  description: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

interface BannerStore {
  config: BannerConfig;
  updateConfig: (newConfig: Partial<BannerConfig>) => void;
}

export const useBannerStore = create<BannerStore>()(
  persist(
    (set) => ({
      config: {
        title: "Painel de Gestão de Afiliados - Aylle Duarte",
        description: "Acompanhe o desempenho dos seus afiliados em tempo real",
        gradientFrom: "from-primary",
        gradientVia: "via-secondary",
        gradientTo: "to-accent",
      },
      updateConfig: (newConfig) => 
        set((state) => ({ config: { ...state.config, ...newConfig } })),
    }),
    {
      name: 'banner-storage',
    }
  )
);
