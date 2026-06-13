import { supabase } from './supabase';

export interface Alert {
  id?: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at?: string;
}

export const alertsService = {
  async createAlert(tipo: string, mensagem: string) {
    try {
      // Trying to insert into a generic 'alertas' table. 
      // If the table doesn't exist, it will throw an error, which we catch.
      const { error } = await supabase
        .from('alertas')
        .insert([{ tipo, mensagem, lida: false }]);
        
      if (error) {
        console.warn('Erro ao criar alerta no Supabase (tabela pode não existir):', error.message);
      }
    } catch (e) {
      console.error('Exception creating alert', e);
    }
  },

  async getAlerts() {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar alertas:', error.message);
      return [];
    }
    return data as Alert[];
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('alertas')
      .update({ lida: true })
      .eq('id', id);

    if (error) throw error;
  }
};
