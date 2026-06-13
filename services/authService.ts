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
    if (!password) {
      throw new Error('Senha é obrigatória');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Tentar inserir em 'profiles' conforme documentação do prompt
      const { error: profileError } = await fallbackInsertProfile(data.user.id, name, email);
      if (profileError) console.error('Erro ao criar perfil:', profileError);
    }
    
    return data;
  },

  async login(email: string, password?: string) {
    // Para simplificar a migração e garantir compatibilidade imediata, vamos assumir
    // que se a senha não for passada (caso do código antigo), não é um fluxo auth completo,
    // mas a fase 2 diz 'Implementar: Login por email e senha, Logout, Sessão persistente, Recuperação da sessão atual'.
    // Logo, mudaremos o componente Login.tsx na fase 2 para passar a senha!
    if (!password) {
      throw new Error('Senha é obrigatória');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
  
  onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
};
