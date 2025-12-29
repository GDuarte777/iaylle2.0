import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'waitlist' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  google_spreadsheet_id?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  waitlistMode: boolean;
  users: User[];
  initialize: () => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  toggleWaitlistMode: () => Promise<void>;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  getWaitlistUsers: () => User[];
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  waitlistMode: false,
  users: [],

  initialize: async () => {
    try {
      set({ isLoading: true });
      if (!isSupabaseConfigured) { set({ user: null, isAuthenticated: false, isLoading: false }); return; }
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        const dbRole = profile?.role as UserRole;
        const metaRole = session.user.app_metadata?.role as UserRole;
        const finalRole = dbRole || metaRole || 'member';

        const userData: User = {
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata.full_name || 'Usuário',
          email: session.user.email || '',
          role: finalRole,
          status: (profile?.status as UserStatus) || 'active',
          avatar: profile?.avatar_url || session.user.user_metadata.avatar_url,
          createdAt: session.user.created_at,
          google_spreadsheet_id: profile?.google_spreadsheet_id
        };

        set({ user: userData, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }

      const { data: waitlist } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, created_at, role, status, google_spreadsheet_id')
        .eq('status', 'waitlist');

      if (waitlist) {
        const mapped = waitlist.map((p: { id: string; full_name?: string; email?: string; avatar_url?: string; created_at: string; role?: string; status?: string; google_spreadsheet_id?: string }) => ({
          id: p.id,
          name: p.full_name || 'Usuário',
          email: p.email || '',
          role: (p.role as UserRole) || 'member',
          status: (p.status as UserStatus) || 'waitlist',
          avatar: p.avatar_url || undefined,
          createdAt: p.created_at,
          google_spreadsheet_id: p.google_spreadsheet_id
        }));
        set({ users: mapped });
      }

      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'waitlist_mode')
        .maybeSingle();

      if (settingsData && (settingsData as any).value && typeof (settingsData as any).value.enabled === 'boolean') {
        const value = (settingsData as any).value as { enabled?: boolean };
        if (typeof value.enabled === 'boolean') {
          set({ waitlistMode: value.enabled });
        }
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          // Force refresh if token is stale regarding role?
          // We just fetch profile again.
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) console.error('AuthStateChange profile error:', error);

          const dbRole = profile?.role as UserRole;
          const metaRole = session.user.app_metadata?.role as UserRole;
          const finalRole = dbRole || metaRole || 'member';

          const userData: User = {
            id: session.user.id,
            name: profile?.full_name || session.user.user_metadata.full_name || 'Usuário',
            email: session.user.email || '',
            role: finalRole,
            status: (profile?.status as UserStatus) || 'active',
            avatar: profile?.avatar_url || session.user.user_metadata.avatar_url,
            createdAt: session.user.created_at,
            google_spreadsheet_id: profile?.google_spreadsheet_id
          };
          set({ user: userData, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    try {
      if (!isSupabaseConfigured) return { success: false, error: 'config_missing' };
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      if (!isSupabaseConfigured) return { success: false, error: 'config_missing' };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  },

  signupWithEmail: async (name, email, password) => {
    try {
      if (!isSupabaseConfigured) return { success: false, error: 'config_missing' };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      const { waitlistMode } = get();
      const newUser = data?.user;
      if (waitlistMode && newUser?.id) {
        await supabase
          .from('profiles')
          .update({ status: 'waitlist' })
          .eq('id', newUser.id);
      }
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  toggleWaitlistMode: async () => {
    const { waitlistMode } = get();
    const next = !waitlistMode;
    await supabase
      .from('app_settings')
      .upsert({ key: 'waitlist_mode', value: { enabled: next } }, { onConflict: 'key' });
    set({ waitlistMode: next });
  },

  approveUser: (userId) => {
    (async () => {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
      set((state) => ({
        users: state.users.map((u) => u.id === userId ? { ...u, status: 'active' } : u)
      }));
    })();
  },

  rejectUser: (userId) => {
    (async () => {
      await supabase.from('profiles').update({ status: 'blocked' }).eq('id', userId);
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId)
      }));
    })();
  },

  getWaitlistUsers: () => {
    return get().users.filter((u) => u.status === 'waitlist');
  }
}));
