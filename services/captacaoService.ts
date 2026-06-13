import { supabase } from './supabase';
import { alertsService } from './alertsService';

export interface OpportunityInput {
  nome: string;
  telefone: string;
  whatsapp: string;
  cidade: string;
  bairro: string;
  url_origem: string;
  observacoes: string;
}

export const captacaoService = {
  calculateScore(data: Partial<OpportunityInput>) {
    let score = 0;
    const motivos: string[] = [];

    if (data.telefone && data.telefone.trim().length > 0) {
      score += 20;
      motivos.push('+20 telefone disponível');
    }
    if (data.whatsapp && data.whatsapp.trim().length > 0) {
      score += 20;
      motivos.push('+20 whatsapp disponível');
    }
    // Simple heuristic for neighborhood
    if (data.bairro && data.bairro.length > 3) {
      score += 20;
      motivos.push('+20 bairro valorizado (estimado)');
    }
    if (data.url_origem && data.url_origem.length > 5) {
      score += 20;
      motivos.push('+20 anúncio recente/URL disponível');
    }
    if (data.observacoes && data.observacoes.length > 10) {
      score += 20;
      motivos.push('+20 descrição completa');
    }

    return {
      score: Math.min(score, 100),
      score_motivo: motivos.join(', ')
    };
  },

  async createOpportunity(data: OpportunityInput) {
    const { score, score_motivo } = this.calculateScore(data);

    const newOp = {
      nome: data.nome,
      telefone: data.telefone,
      whatsapp: data.whatsapp,
      cidade: data.cidade,
      bairro: data.bairro,
      url_origem: data.url_origem,
      descricao: data.observacoes, // Using the same field radar uses for notes
      score,
      score_motivo
    };

    const { data: result, error } = await supabase
      .from('proprietarios_detectados')
      .insert([newOp])
      .select()
      .single();

    if (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }

    // Alertas
    if (score > 80) {
      await alertsService.createAlert('nova_oportunidade_quente', `Nova oportunidade quente identificada em ${data.bairro || data.cidade}! Score: ${score}`);
    } else {
      await alertsService.createAlert('nova_oportunidade', `Nova oportunidade identificada: ${data.nome || 'Sem Nome'}.`);
    }

    return result;
  },

  async getOpportunities() {
    const { data, error } = await supabase
      .from('proprietarios_detectados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
       console.error('Error fetching opportunities:', error);
       return [];
    }
    return data;
  },

  async moveToCRM(ownerId: string) {
    const { data, error } = await supabase
      .from('pipeline_cards')
      .insert([{
        proprietario_id: ownerId,
        coluna: 'novo_lead'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error moving to CRM:', error);
      throw error;
    }
    
    await alertsService.createAlert('crm', `Oportunidade movida para o CRM.`);
    return data;
  },

  async favoriteOpportunity(proprietario_id: string, isCurrentlyFavorite: boolean) {
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
      
      await alertsService.createAlert('favorito', `Oportunidade adicionada aos favoritos.`);
    }
  },

  /**
   * EDGE FUNCTIONS - Arquitetura de ingestão em lote
   * Prepara a estrutura para chamadas de scraping/importação massiva
   */
  async triggerIngestionEdgeFunction(sourceUrl: string) {
    // Exemplo de como chamaremos a edge function no futuro
    /*
    const { data, error } = await supabase.functions.invoke('ingest-opportunities', {
      body: { url: sourceUrl }
    });
    if (error) throw error;
    return data;
    */
    console.log(`[EDGE FUNCTION PLACEHOLDER] Ingestion triggered for URL: ${sourceUrl}`);
    return { status: 'queued', message: 'Função de ingestão em lote simulada.' };
  }
};
