import { supabase } from './supabase';

export const leadService = {
  async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('id, owner_name, phone, lead_score, status, source_platform, imoveis(titulo)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.owner_name || 'Sem nome',
      whatsapp: item.phone || '',
      email: '',
      propertyId: '',
      propertyTitle: item.imoveis?.titulo || 'Desconhecido',
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
      status: item.status || 'new',
      score: item.lead_score || 'unscored',
      income: 0,
      downPayment: 0,
      fgts: 0,
      documents: [],
      incomeType: 'CLT',
      checklist: {}
    }));
  }
};
