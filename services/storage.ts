import { supabase } from './supabase';
import { AdminProfile, Property, PropertyStatus } from '../types';

const DEFAULT_PROFILE: AdminProfile = {
  name: 'Seu Nome',
  creci: '00000',
  photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  whatsapp: '5511999999999',
  headerMessage: 'Olá, gostaria de saber mais sobre imóveis de alto padrão.'
};

export const storageService = {
  getProfile: async (): Promise<AdminProfile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_PROFILE;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // PGRST116: No rows found (normal for new users)
      // PGRST205: Table not found (normal if SQL hasn't been run)
      if (error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.error('Error fetching profile:', JSON.stringify(error, null, 2));
      } else if (error.code === 'PGRST205') {
        console.warn('Aviso: Tabela "profiles" não encontrada no Supabase. O perfil padrão será usado.');
      }
      return { ...DEFAULT_PROFILE, name: user.user_metadata.name || 'Admin' };
    }

    if (!data) return { ...DEFAULT_PROFILE, name: user.user_metadata.name || 'Admin' };

    return {
      name: data.name || user.user_metadata.name || 'Admin',
      creci: data.creci || '',
      photoUrl: data.photo_url || DEFAULT_PROFILE.photoUrl,
      whatsapp: data.whatsapp || '',
      headerMessage: data.header_message || ''
    };
  },

  saveProfile: async (profile: AdminProfile): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: profile.name,
        creci: profile.creci,
        photo_url: profile.photoUrl,
        whatsapp: profile.whatsapp,
        header_message: profile.headerMessage
      });
      
    if (error) {
      if (error.code === 'PGRST205') {
        throw new Error('A tabela "profiles" não existe. Execute o script SQL no painel do Supabase.');
      }
      console.error('Error saving profile:', JSON.stringify(error, null, 2));
      throw new Error(`Erro ao salvar perfil: ${error.message}`);
    }
  },

  getProperties: async (): Promise<Property[]> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Aviso: Tabela "properties" não encontrada no Supabase. A lista estará vazia.');
        return [];
      }
      console.error('Error fetching properties:', JSON.stringify(error, null, 2));
      return [];
    }

    // Map DB snake_case to TS camelCase
    return data.map((p: any) => ({
      id: p.id,
      title: p.title || '',
      price: Number(p.price) || 0,
      displayPrice: p.display_price || '',
      city: p.city || '',
      neighborhood: p.neighborhood || '',
      lat: p.lat || '',
      lng: p.lng || '',
      status: (p.status as PropertyStatus) || PropertyStatus.AVAILABLE,
      type: p.type || 'Imóvel',
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features : [],
      bedrooms: Number(p.bedrooms) || 0,
      bathrooms: Number(p.bathrooms) || 0,
      suites: Number(p.suites) || 0,
      parking: Number(p.parking) || 0,
      area: Number(p.area) || 0,
      whatsappMessage: p.whatsapp_message || '',
      media: Array.isArray(p.media) ? p.media : [],
      simulador: !!p.simulador,
      viewersMin: Number(p.viewers_min) || 0,
      viewersMax: Number(p.viewers_max) || 0,
      createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now()
    }));
  },

  getPropertyById: async (id: string): Promise<Property | undefined> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
         console.warn('Aviso: Tabela "properties" não encontrada.');
         return undefined;
      }
      console.error('Error fetching property:', JSON.stringify(error, null, 2));
      return undefined;
    }
    if (!data) return undefined;

    return {
      id: data.id,
      title: data.title || '',
      price: Number(data.price) || 0,
      displayPrice: data.display_price || '',
      city: data.city || '',
      neighborhood: data.neighborhood || '',
      lat: data.lat || '',
      lng: data.lng || '',
      status: (data.status as PropertyStatus) || PropertyStatus.AVAILABLE,
      type: data.type || 'Imóvel',
      description: data.description || '',
      features: Array.isArray(data.features) ? data.features : [],
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      suites: Number(data.suites) || 0,
      parking: Number(data.parking) || 0,
      area: Number(data.area) || 0,
      whatsappMessage: data.whatsapp_message || '',
      media: Array.isArray(data.media) ? data.media : [],
      simulador: !!data.simulador,
      viewersMin: Number(data.viewers_min) || 0,
      viewersMax: Number(data.viewers_max) || 0,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
    };
  },

  saveProperty: async (property: Property): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload: any = {
      user_id: user?.id,
      title: property.title,
      price: property.price,
      display_price: property.displayPrice,
      city: property.city,
      neighborhood: property.neighborhood,
      lat: property.lat,
      lng: property.lng,
      status: property.status,
      type: property.type,
      description: property.description,
      features: property.features,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      suites: property.suites,
      parking: property.parking,
      area: property.area,
      whatsapp_message: property.whatsappMessage,
      media: property.media,
      simulador: property.simulador,
      viewers_min: property.viewersMin,
      viewers_max: property.viewersMax
    };

    let error;
    
    // Check if ID is a valid UUID (length 36 usually, but > 20 covers it)
    if (property.id && property.id.length > 20) { 
      const { error: err } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', property.id);
      error = err;
    } else {
       // Insert new
       const { error: err } = await supabase.from('properties').insert([payload]);
       error = err;
    }

    if (error) {
      if (error.code === 'PGRST205') {
        throw new Error('A tabela "properties" não existe. Execute o script SQL no painel do Supabase.');
      }
      console.error('Error saving property:', JSON.stringify(error, null, 2));
      throw new Error(`Erro ao salvar imóvel: ${error.message}`);
    }
  },

  deleteProperty: async (id: string): Promise<void> => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
       if (error.code === 'PGRST205') {
        throw new Error('A tabela "properties" não existe.');
      }
      console.error('Error deleting property:', JSON.stringify(error, null, 2));
      throw new Error(`Erro ao excluir imóvel: ${error.message}`);
    }
  }
};