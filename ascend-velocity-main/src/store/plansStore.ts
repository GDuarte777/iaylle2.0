import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface PlanFeature {
  id?: string;
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
  gatewayId?: string; // Stripe/Asaas Product ID
  color?: string; // Cor de destaque para o card
}

interface PlansStore {
  plans: Plan[];
  loading: boolean;
  fetchPlans: () => Promise<void>;
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  getPlan: (id: string) => Plan | undefined;
}

export const usePlansStore = create<PlansStore>((set, get) => ({
  plans: [],
  loading: false,

  fetchPlans: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      set({ loading: false });
      return;
    }

    const formattedPlans: Plan[] = data.map((p) => {
      const rawFeatures = (p.features as any) ?? [];
      const featuresArray = Array.isArray(rawFeatures) ? rawFeatures : [];

      return {
        id: p.id,
        name: p.name,
        price: p.price_cents / 100,
        interval: p.interval as 'monthly' | 'yearly',
        description: p.description,
        features: featuresArray.map((f: any, index: number) => ({
          ...f,
          id: f.id || `feature-${index}`
        })),
        isPopular: p.is_popular,
        gatewayId: p.gateway_product_id,
        color: p.color
      };
    });

    set({ plans: formattedPlans, loading: false });
  },

  addPlan: async (plan) => {
    const { error } = await supabase.functions.invoke('admin-stripe-plan', {
      body: {
        action: 'create',
        plan: {
          name: plan.name,
          price: plan.price,
          interval: plan.interval,
          description: plan.description,
          features: plan.features,
          color: plan.color,
          isPopular: plan.isPopular,
        },
      },
    });

    if (error) {
      console.error('Error adding plan via Stripe:', error);
      throw error;
    }
    
    get().fetchPlans();
  },

  updatePlan: async (id, updates) => {
    const { error } = await supabase.functions.invoke('admin-stripe-plan', {
      body: {
        action: 'update',
        id,
        updates,
      },
    });

    if (error) {
      console.error('Error updating plan via Stripe:', error);
      throw error;
    }

    get().fetchPlans();
  },

  deletePlan: async (id) => {
    const { error } = await supabase.functions.invoke('admin-stripe-plan', {
      body: {
        action: 'delete',
        id,
      },
    });

    if (error) {
      console.error('Error deleting plan via Stripe:', error);
      throw error;
    }

    get().fetchPlans();
  },

  getPlan: (id) => get().plans.find((p) => p.id === id)
}));
