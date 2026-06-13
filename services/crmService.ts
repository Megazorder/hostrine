import { supabase } from './supabase';

export interface CrmLead {
  id: string;
  proprietario_id?: string;
  coluna: string;
  created_at?: string;
  proprietarios_detectados?: any;
  interacoes_proprietario?: any[];
}

export const crmService = {
  async getLeads() {
    const { data, error } = await supabase
      .from('pipeline_cards')
      .select('*, proprietarios_detectados(*), interacoes_proprietario(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching CRM leads:', error);
      return [];
    }
    return data as CrmLead[];
  },

  async moveOwnerToCrm(ownerId: string) {
    const { data, error } = await supabase
      .from('pipeline_cards')
      .insert([{
        proprietario_id: ownerId,
        coluna: 'novo_lead'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error moving owner to CRM:', error);
      throw error;
    }

    return data;
  },

  async updateLeadStatus(id: string, status: string) {
    const { error } = await supabase
      .from('pipeline_cards')
      .update({ coluna: status })
      .eq('id', id);

    if (error) {
      console.error('Error updating CRM lead status:', error);
      throw error;
    }
  },

  async addInteraction(pipeline_card_id: string, descricao: string, tipo: string = 'observacao') {
    const { error } = await supabase
      .from('interacoes_proprietario')
      .insert([{ pipeline_card_id, descricao, tipo }]);

    if (error) {
       // Maybe it expects proprietario_id instead of pipeline_card_id?
       // Let's try both or just pipeline_card_id and proprietario_id
      console.error('Error adding interaction:', error);
      throw error;
    }
  }
};
