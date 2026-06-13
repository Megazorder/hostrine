import { supabase } from './supabase';

export const ownerService = {
  async getOwners() {
    const { data, error } = await supabase
      .from('proprietarios_detectados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property owners:', error);
      return [];
    }
    
    // Also fetch favorites
    const { data: favData } = await supabase
      .from('favoritos_proprietarios')
      .select('proprietario_id');
      
    const favIds = new Set(favData?.map(f => f.proprietario_id) || []);
    
    return data.map(owner => ({ ...owner, isFavorite: favIds.has(owner.id) }));
  },

  async toggleFavorite(proprietario_id: string, isCurrentlyFavorite: boolean) {
    if (isCurrentlyFavorite) {
      const { error } = await supabase
        .from('favoritos_proprietarios')
        .delete()
        .eq('proprietario_id', proprietario_id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('favoritos_proprietarios')
        .insert([{ proprietario_id }]);
      if (error) throw error;
    }
  }
};
