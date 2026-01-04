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

export interface PropertyFAQ {
  question: string;
  answer: string;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  displayPrice: string; // Formatted string for display
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
  faq?: PropertyFAQ[];
}

export interface LeadColumn {
  id: string;
  title: string;
  color: string; // Hex or Tailwind class reference
  order: number;
}

export type LeadScore = 'gold' | 'silver' | 'curious' | 'unscored';

export interface LeadDocument {
  id: string;
  name: string;
  url: string; // Base64 or URL
  type: 'pdf' | 'image' | 'other';
  uploadedAt: number;
}

export interface ChecklistItemState {
  checked: boolean;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: number;
}

export type IncomeType = 'CLT' | 'Empresario' | 'Autonomo';

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  propertyId: string;
  propertyTitle: string;
  createdAt: number;
  status: string;
  // Financial Data
  income?: number;
  downPayment?: number;
  fgts?: number;
  score?: LeadScore;
  
  // Extended Profile Data
  address?: string;
  cpf?: string;
  rg?: string;
  profession?: string;
  maritalStatus?: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viuvo' | 'UniaoEstavel';
  spouseName?: string;
  spouseCpf?: string;
  
  // Documents & Checklist
  incomeType?: IncomeType;
  checklist?: Record<string, ChecklistItemState>; // Keyed by item ID (e.g., 'doc_rg': { checked: true, fileUrl: '...' })
  documents?: LeadDocument[]; // Legacy / General docs
  hasNewUploads?: boolean; // Notification flag for broker
  lastRequestDate?: number; // Timestamp of last document request link sent
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