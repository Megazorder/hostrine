import { supabase } from './supabase';

async function fallbackInsertProfile(id: string, name: string, email: string) {
  // Para cobrir as possibilidades do banco, inserimos em 'profiles' e/ou 'perfis'
  let res = await supabase.from('profiles').insert([{ id, full_name: name, email }]);
  if (res.error) {
    // try perfis
    res = await supabase.from('perfis').insert([{ id, nome: name }]);
  }
  return res;
}

export const authService = {
  async register(name: string, email: string, password?: string) {
    console.log('[AuthService] Attempting registration for:', email);
    if (!password) {
      console.error('[AuthService] Registration failed: Password is required');
      throw new Error('Senha é obrigatória');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('[AuthService] Registration failed:', error.message);
      throw error;
    }
    
    if (data.user) {
      console.log('[AuthService] Registration successful, user ID:', data.user.id);
      // Tentar inserir em 'profiles' conforme documentação do prompt
      const { error: profileError } = await fallbackInsertProfile(data.user.id, name, email);
      if (profileError) console.error('[AuthService] Erro ao criar perfil:', profileError);
    }
    
    return data;
  },

  async login(email: string, password?: string) {
    console.log('[AuthService] Attempting login for:', email);
    if (!password) {
      console.error('[AuthService] Login failed: Password is required');
      throw new Error('Senha é obrigatória');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[AuthService] Login failed:', error.message);
      throw error;
    }
    
    console.log('[AuthService] Login successful, user ID:', data.user?.id);
    return data;
  },

  async logout() {
    console.log('[AuthService] Attempting logout...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthService] Logout failed:', error.message);
      throw error;
    }
    console.log('[AuthService] Logout successful');
  },

  async getCurrentSession() {
    console.log("AUTH_CHECK");
    console.log('[AuthService] Fetching current session...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[AuthService] Failed to get current session:', error.message);
      throw error;
    }
    console.log('[AuthService] Current session retrieved:', !!data.session);
    return data.session;
  },

  async getCurrentUser() {
    console.log('[AuthService] Fetching current user...');
    const { data, error } = await supabase.auth.getUser();
    if (error) {
       console.error('[AuthService] Failed to get current user:', error.message);
       throw error;
    }
    return data.user;
  },
  
  onAuthStateChange(callback: (session: any) => void) {
    console.log('[AuthService] Setting up auth state change listener...');
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthService] Auth state changed:', event);
      callback(session);
    });
  }
};
