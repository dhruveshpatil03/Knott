// Zustand store for authentication state
import { create } from 'zustand';
import { supabase } from './CONFIG_supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  error: null,

  // Initialize auth on app load
  initAuth: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch full user profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        set({ user, userProfile: profile, loading: false });
      } else {
        set({ user: null, userProfile: null, loading: false });
      }
    } catch (error) {
      console.error('Auth init error:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Phone login (OTP)
  signInWithPhone: async (phone) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
      });
      
      if (error) throw error;
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Verify OTP
  verifyOtp: async (phone, token) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        token,
        type: 'sms',
      });
      
      if (error) throw error;
      
      const user = data.user;
      set({ user, loading: false });
      return user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create user profile
  createProfile: async (userData) => {
    try {
      set({ loading: true, error: null });
      const user = get().user;
      
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          name: userData.name,
          phone: userData.phone,
          city: userData.city || 'Pune',
          upi_id: userData.upi_id || null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      set({ userProfile: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      set({ loading: true, error: null });
      const user = get().user;
      
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ userProfile: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({ user: null, userProfile: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
