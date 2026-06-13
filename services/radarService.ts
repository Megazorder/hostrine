import { supabase } from './supabase';

export interface RadarFilter {
  city?: string;
  neighborhood?: string;
  minScore?: number;
  source?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'recent' | 'score_high' | 'oldest';
}

export const radarService = {
  async getRadarItems(filters: RadarFilter = {}) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('proprietarios_detectados')
      .select('*, favoritos_proprietarios(proprietario_id), pipeline_cards(coluna)', { count: 'exact' });

    if (filters.city) query = query.ilike('cidade', `%${filters.city}%`);
    if (filters.neighborhood) query = query.ilike('bairro', `%${filters.neighborhood}%`);
    if (filters.source) query = query.eq('origem', filters.source);
    // score string mapping to numbers? Or assuming score is a number. Based on requirement "> 80", it might be numeric now.
    // If it's a string, we might need to filter differently, but let's try numeric/casting if possible.
    if (filters.minScore) query = query.gte('score', filters.minScore);

    if (filters.sortBy === 'score_high') {
      query = query.order('score', { ascending: false });
    } else if (filters.sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      // default: recent
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching radar items:', error);
      return { data: [], count: 0 };
    }

    const processedData = data.map(item => ({
      ...item,
      isFavorite: item.favoritos_proprietarios && item.favoritos_proprietarios.length > 0,
      inCrm: item.pipeline_cards && item.pipeline_cards.length > 0,
      crmColumn: item.pipeline_cards?.[0]?.coluna || null
    }));

    return { data: processedData, count: count || 0 };
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
  },

  async getRadarStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: foundToday } = await supabase
      .from('proprietarios_detectados')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: hotOpportunities } = await supabase
      .from('proprietarios_detectados')
      .select('id', { count: 'exact', head: true })
      .gte('score', 80); // Assuming scores are numeric now, or mapping

    const { count: favorites } = await supabase
      .from('favoritos_proprietarios')
      .select('proprietario_id', { count: 'exact', head: true });

    const { count: movedToCrm } = await supabase
      .from('pipeline_cards')
      .select('id', { count: 'exact', head: true });

    return {
      foundToday: foundToday || 0,
      hotOpportunities: hotOpportunities || 0,
      favorites: favorites || 0,
      movedToCrm: movedToCrm || 0
    };
  }
};
