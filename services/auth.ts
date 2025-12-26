import { supabase } from './supabase';

export const authService = {
  isAuthenticated: async (): Promise<boolean> => {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  login: async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return !error;
  },

  register: async (email: string, password: string, name: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name } // Save name in metadata
      }
    });

    if (!error && data.user) {
      // Initialize profile entry
      await supabase.from('profiles').insert([
        { 
          id: data.user.id, 
          name: name,
          creci: '',
          whatsapp: '',
          photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
          header_message: 'Olá, gostaria de saber mais sobre imóveis.'
        }
      ]);
      return true;
    }
    return false;
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  }
};