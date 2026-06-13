import { supabase } from './supabase';
import { Property, PropertyStatus } from '../types';

const mapProperty = (item: any): Property => ({
  id: item.id,
  title: item.titulo,
  description: item.descricao || '',
  price: item.preco || 0,
  displayPrice: (item.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  status: item.status as PropertyStatus || PropertyStatus.AVAILABLE,
  type: item.tipo || 'Imóvel',
  bedrooms: item.quartos || 0,
  bathrooms: item.banheiros || 0,
  suites: 0, 
  parking: 0, 
  area: item.area_m2 || 0,
  city: item.cidade || '',
  neighborhood: item.bairro || '',
  lat: item.latitude || '',
  lng: item.longitude || '',
  whatsappMessage: item.whatsapp_contato || '',
  media: item.fotos ? item.fotos.map((url: string, index: number) => ({ id: `${index}`, type: 'image', url })) : [],
  simulador: true,
  viewersMin: 110,
  viewersMax: 290,
  belowMarketPrice: item.destaque || false,
  enableLeadCapture: true,
  createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  features: [],
  faq: []
});

const mapPropertyToDb = (p: Property) => ({
  titulo: p.title,
  descricao: p.description,
  preco: p.price,
  status: p.status,
  tipo: p.type,
  quartos: p.bedrooms,
  banheiros: p.bathrooms,
  area_m2: p.area,
  cidade: p.city,
  bairro: p.neighborhood,
  latitude: p.lat,
  longitude: p.lng,
  fotos: p.media.map(m => m.url),
  whatsapp_contato: p.whatsappMessage,
  destaque: p.belowMarketPrice
});

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
    return data.map(mapProperty);
  },

  async getActiveProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active properties:', error);
      return [];
    }
    return data.map(mapProperty);
  },

  async getProperty(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }
    return mapProperty(data);
  },

  async saveProperty(property: Property): Promise<Property | null> {
    // Check if ID is random string from client or a UUID
    const isNew = !property.id || property.id.length < 30; // Supabase UUID is 36 chars
    const dbData = mapPropertyToDb(property);

    let result;
    if (isNew) {
      result = await supabase
        .from('imoveis')
        .insert(dbData)
        .select()
        .single();
    } else {
      result = await supabase
        .from('imoveis')
        .update(dbData)
        .eq('id', property.id)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving property:', result.error);
      return null;
    }

    return mapProperty(result.data);
  },

  async deleteProperty(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('imoveis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      return false;
    }
    return true;
  }
};
