import { create } from 'zustand';
import { supabase } from './CONFIG_supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  error: null,

  initAuth: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        set({ user: null, userProfile: null, loading: false });
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        set({ user, userProfile: profile || null, loading: false });
      }
    } catch (error) {
      console.error('Auth init error:', error);
      // On any error (network, bad keys, etc.) — don't stay loading forever.
      set({ user: null, userProfile: null, loading: false, error: error.message });
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              set({ user: session.user, userProfile: profile || null });
            } catch {
              set({ user: session.user, userProfile: null });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, userProfile: null });
          }
        }
      );
      set({ _authSubscription: subscription });
    } catch (error) {
      console.error('Auth listener error:', error);
    }
  },

  signInWithPhone: async (phone) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
    });
    if (error) throw error;
  },

  verifyOtp: async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      token,
      type: 'sms',
    });
    if (error) throw error;
    set({ user: data.user });
    return data.user;
  },

  createProfile: async (userData) => {
    const user = get().user;
    if (!user) throw new Error('No authenticated user');
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: user.id, ...userData }])
      .select()
      .single();
    if (error) throw error;
    set({ userProfile: data });
    return data;
  },

  updateProfile: async (userData) => {
    const user = get().user;
    if (!user) throw new Error('No authenticated user');
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    set({ userProfile: data });
    return data;
  },

  setUserProfile: (profile) => set({ userProfile: profile }),

  signOut: async () => {
    const { _authSubscription } = get();
    _authSubscription?.unsubscribe();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, userProfile: null, _authSubscription: null });
  },
}));
