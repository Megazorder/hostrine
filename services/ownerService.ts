import { supabase } from './supabase';

export const ownerService = {
  async getOwners() {
    const { data, error } = await supabase
      .from('property_owners')
      // Try to join with imoveis if there's a reference, otherwise we fetch it or it may not exist. 
      // Often, a property_owner might have a property_id. If not, maybe we just fetch what we can. 
      // The prompt says: "foto do imóvel, cidade, origem, URL do anúncio"
      .select('id, owner_name, phone, whatsapp, source_platform, lead_score, property_id, origin_url, imoveis(titulo, fotos, cidade)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property owners:', error);
      return [];
    }

    return data;
  }
};
