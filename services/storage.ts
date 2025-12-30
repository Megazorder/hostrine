import { AdminProfile, Property, PropertyStatus } from '../types';

const KEYS = {
  PROFILE: 'luxe_admin_profile',
  PROPERTIES: 'luxe_admin_properties',
  AUTH: 'luxe_admin_auth'
};

const DEFAULT_PROFILE: AdminProfile = {
  name: 'Seu Nome',
  creci: '12345-F',
  photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  whatsapp: '5511999999999',
  headerMessage: 'Olá, gostaria de saber mais sobre imóveis de alto padrão.'
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Cobertura Duplex Jardins',
    price: 4500000,
    displayPrice: 'R$ 4.500.000',
    priceVisibility: 'full',
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
    createdAt: Date.now()
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