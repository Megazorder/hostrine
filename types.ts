export enum PropertyStatus {
  AVAILABLE = 'Disponível',
  SOLD = 'Vendido',
  RESERVED = 'Reservado',
  LAST_UNITS = 'Últimas unidades'
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  displayPrice: string; // Formatted string for display
  city: string;
  neighborhood: string;
  lat: string;
  lng: string;
  status: PropertyStatus;
  type: string; // e.g., Apartamento, Casa
  description: string;
  features: string[];
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parking: number;
  area: number;
  whatsappMessage: string;
  media: MediaItem[];
  simulador: boolean;
  viewersMin: number;
  viewersMax: number;
  createdAt: number;
}

export interface AdminProfile {
  name: string;
  creci: string;
  photoUrl: string;
  whatsapp: string;
  headerMessage: string;
}