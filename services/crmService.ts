import { supabase } from './supabase';

export interface CrmLead {
  id: string;
  owner_id?: string;
  owner_name: string;
  property_title: string;
  property_image?: string;
  score: string;
  whatsapp: string;
  phone: string;
  status: string;
  notes: string;
  created_at?: string;
  original_url?: string;
}

export const crmService = {
  async getLeads() {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching CRM leads:', error);
      return [];
    }
    return data as CrmLead[];
  },

  async moveOwnerToCrm(owner: any) {
    const propertyTitle = owner.imoveis?.titulo || 'Imóvel sem título';
    const propertyImage = owner.imoveis?.fotos?.[0] || '';

    const newLead = {
      owner_id: owner.id,
      owner_name: owner.owner_name || 'Sem nome',
      property_title: propertyTitle,
      property_image: propertyImage,
      score: owner.lead_score || 'unscored',
      whatsapp: owner.whatsapp || owner.phone || '',
      phone: owner.phone || '',
      status: 'novo',
      notes: '',
      original_url: owner.origin_url || ''
    };

    const { data, error } = await supabase
      .from('crm_leads')
      .insert([newLead])
      .select()
      .single();

    if (error) {
      console.error('Error moving owner to CRM:', error);
      throw error;
    }

    return data as CrmLead;
  },

  async updateLeadStatus(id: string, status: string) {
    const { error } = await supabase
      .from('crm_leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating CRM lead status:', error);
      throw error;
    }
  },

  async updateLeadNotes(id: string, notes: string) {
    const { error } = await supabase
      .from('crm_leads')
      .update({ notes })
      .eq('id', id);

    if (error) {
      console.error('Error updating CRM lead notes:', error);
      throw error;
    }
  }
};
