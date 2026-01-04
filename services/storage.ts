import { AdminProfile, Property, PropertyStatus, Lead, LeadColumn } from '../types';

const KEYS = {
  PROFILE: 'luxe_admin_profile',
  PROPERTIES: 'luxe_admin_properties',
  AUTH: 'luxe_admin_auth',
  LEADS: 'luxe_admin_leads',
  LEAD_COLUMNS: 'luxe_admin_lead_columns'
};

const DEFAULT_PROFILE: AdminProfile = {
  name: 'Seu Nome',
  creci: '12345-F',
  photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  whatsapp: '5511999999999',
  headerMessage: 'Olá, gostaria de saber mais sobre imóveis de alto padrão.',
  subdomain: 'seu-imovel'
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Cobertura Duplex Jardins',
    price: 4500000,
    displayPrice: 'R$ 4.500.000',
    city: 'São Paulo',
    neighborhood: 'Jardins',
    lat: '-23.567',
    lng: '-46.667',
    status: PropertyStatus.AVAILABLE,
    type: 'Cobertura',
    description: 'Espetacular cobertura com vista panorâmica, acabamento em mármore importado e piscina privativa.',
    features: ['Piscina', 'Academia', 'Portaria 24h', 'Vista Panorâmica', 'Automação'],
    bedrooms: 4,
    bathrooms: 5,
    suites: 4,
    parking: 6,
    area: 450,
    whatsappMessage: 'Olá, tenho interesse na Cobertura Duplex nos Jardins.',
    media: [
      { id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
      { id: 'm2', type: 'image', url: 'https://images.unsplash.com/photo-1600596542815-27838eb2db69?auto=format&fit=crop&w=1200&q=80' }
    ],
    simulador: true,
    viewersMin: 12,
    viewersMax: 45,
    belowMarketPrice: true,
    enableLeadCapture: true,
    createdAt: Date.now(),
    faq: [
      { question: 'Aceita permuta?', answer: 'Estudamos permuta por imóveis de menor valor na região.' },
      { question: 'O condomínio permite obras?', answer: 'Sim, permitidas de segunda a sexta em horário comercial.' }
    ]
  }
];

const DEFAULT_COLUMNS: LeadColumn[] = [
  { id: 'new', title: 'Novos Clientes', color: '#3b82f6', order: 0 },
  { id: 'negotiating', title: 'Em Negociação', color: '#eab308', order: 1 },
  { id: 'contacted', title: 'Contatados / Visita', color: '#8b5cf6', order: 2 },
  { id: 'sold', title: 'Vendido / Fechado', color: '#22c55e', order: 3 },
  { id: 'archived', title: 'Arquivado', color: '#64748b', order: 4 },
];

const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Roberto Silva',
    whatsapp: '11999998888',
    email: 'roberto@email.com',
    propertyId: '1',
    propertyTitle: 'Cobertura Duplex Jardins',
    createdAt: Date.now() - 86400000,
    status: 'new',
    income: 35000,
    downPayment: 500000,
    fgts: 100000,
    score: 'silver',
    documents: []
  }
];

export const storageService = {
  getProfile: (): AdminProfile => {
    const stored = localStorage.getItem(KEYS.PROFILE);
    return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
  },

  saveProfile: (profile: AdminProfile): void => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getProperties: (): Property[] => {
    const stored = localStorage.getItem(KEYS.PROPERTIES);
    return stored ? JSON.parse(stored) : MOCK_PROPERTIES;
  },

  getPropertyById: (id: string): Property | undefined => {
    const properties = storageService.getProperties();
    return properties.find(p => p.id === id);
  },

  saveProperty: (property: Property): void => {
    const properties = storageService.getProperties();
    const index = properties.findIndex(p => p.id === property.id);
    
    if (index >= 0) {
      properties[index] = property;
    } else {
      properties.unshift(property);
    }
    
    localStorage.setItem(KEYS.PROPERTIES, JSON.stringify(properties));
  },

  deleteProperty: (id: string): void => {
    const properties = storageService.getProperties();
    const filtered = properties.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PROPERTIES, JSON.stringify(filtered));
  },

  // Leads
  getLeads: (): Lead[] => {
    const stored = localStorage.getItem(KEYS.LEADS);
    return stored ? JSON.parse(stored) : MOCK_LEADS;
  },

  saveLead: (lead: Lead): void => {
    const leads = storageService.getLeads();
    leads.unshift(lead);
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  },
  
  updateLead: (updatedLead: Lead): void => {
    const leads = storageService.getLeads();
    const index = leads.findIndex(l => l.id === updatedLead.id);
    if (index >= 0) {
      leads[index] = updatedLead;
      localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
    }
  },

  updateLeadStatus: (id: string, status: string): void => {
    const leads = storageService.getLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index >= 0) {
      leads[index].status = status;
      localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
    }
  },

  deleteLead: (id: string): void => {
    const leads = storageService.getLeads();
    const filtered = leads.filter(l => l.id !== id);
    localStorage.setItem(KEYS.LEADS, JSON.stringify(filtered));
  },

  // Columns (Kanban)
  getLeadColumns: (): LeadColumn[] => {
    const stored = localStorage.getItem(KEYS.LEAD_COLUMNS);
    return stored ? JSON.parse(stored) : DEFAULT_COLUMNS;
  },

  saveLeadColumns: (columns: LeadColumn[]): void => {
    localStorage.setItem(KEYS.LEAD_COLUMNS, JSON.stringify(columns));
  },

  // Simple Auth Simulation
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(KEYS.AUTH);
  },

  login: (email: string): void => {
    localStorage.setItem(KEYS.AUTH, JSON.stringify({ email, timestamp: Date.now() }));
  },

  logout: (): void => {
    localStorage.removeItem(KEYS.AUTH);
  }
};