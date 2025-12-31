export enum PropertyStatus {
  AVAILABLE = 'Disponível',
  SOLD = 'Vendido',
  RESERVED = 'Reservado',
  LAST_UNITS = 'Últimas unidades',
  DRAFT = 'Rascunho'
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export type PriceVisibility = 'full' | 'masked' | 'hidden';

export interface Property {
  id: string;
  title: string;
  price: number;
  displayPrice: string; // Formatted string for display
  priceVisibility: PriceVisibility;
  enableLeadCapture?: boolean; // New field for Lead Capture
  city: string;
  neighborhood: string;
  lat: string;
  lng: string;
  status: PropertyStatus;
  type: string;
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
  belowMarketPrice?: boolean; 
  createdAt: number;
}

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  propertyId: string;
  propertyTitle: string;
  createdAt: number;
  status: 'new' | 'contacted' | 'archived';
}

export interface AdminProfile {
  name: string;
  creci: string;
  photoUrl: string;
  whatsapp: string;
  headerMessage: string;
  subdomain?: string; // New: Custom subdomain (e.g., myname.luxe.app)
  customDomain?: string; // New: Full custom domain (e.g., www.myrealestate.com)
}