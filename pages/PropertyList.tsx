import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, MapPin, BedDouble, Bath, Square, Plus, ArrowUpDown, ArrowUp, ArrowDown, Eye, Globe, Settings, X, Check, Save, Ban, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storage';
import { profileService } from '../services/profileService';
import { propertyService } from '../services/propertyService';
import { Property, PropertyStatus, AdminProfile } from '../types';

type SortKey = 'createdAt' | 'price' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

export const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Domain Config Modal State
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainConfig, setDomainConfig] = useState({ subdomain: '', customDomain: '' });

  // Manage/Delete Modal State
  const [manageModal, setManageModal] = useState<{ isOpen: boolean; propertyId: string | null }>({
    isOpen: false,
    propertyId: null
  });

  useEffect(() => {
    propertyService.getProperties().then(data => {
      setProperties(data);
    }).catch(err => {
      console.error(err);
      // Fallback only if needed, but we shouldn't use mock. 
      // setProperties(storageService.getProperties());
    });

    const userProfileLocal = storageService.getProfile();
    setProfile(userProfileLocal);
    setDomainConfig({
      subdomain: userProfileLocal.subdomain || '',
      customDomain: userProfileLocal.customDomain || ''
    });

    profileService.getProfile().then(p => {
      if (p) {
        setProfile(p);
        setDomainConfig({
          subdomain: p.subdomain || '',
          customDomain: p.customDomain || ''
        });
      }
    }).catch(console.error);
  }, []);

  const handleOpenManageModal = (id: string) => {
    setManageModal({ isOpen: true, propertyId: id });
  };

  const handleCloseManageModal = () => {
    setManageModal({ isOpen: false, propertyId: null });
  };

  const handleUnpublish = async () => {
    if (manageModal.propertyId) {
      const property = properties.find(p => p.id === manageModal.propertyId);
      if (property) {
        const updated = { ...property, status: PropertyStatus.DRAFT };
        await propertyService.saveProperty(updated);
        const data = await propertyService.getProperties();
        setProperties(data);
      }
      handleCloseManageModal();
    }
  };

  const handleDelete = async () => {
    if (manageModal.propertyId) {
      await propertyService.deleteProperty(manageModal.propertyId);
      const data = await propertyService.getProperties();
      setProperties(data);
      handleCloseManageModal();
    }
  };

  const handlePublish = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const property = properties.find(p => p.id === id);
    if (property) {
      const updated = { ...property, status: PropertyStatus.AVAILABLE };
      await propertyService.saveProperty(updated);
      const data = await propertyService.getProperties();
      setProperties(data);
    }
  };

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      const updatedProfile = { ...profile, ...domainConfig };
      storageService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setShowDomainModal(false);
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortKey === 'price' || sortKey === 'createdAt') {
        // Numeric sort
        return (Number(a[sortKey]) - Number(b[sortKey])) * modifier;
      }
      
      // String sort
      const valA = String(a[sortKey]).toLowerCase();
      const valB = String(b[sortKey]).toLowerCase();
      return valA.localeCompare(valB) * modifier;
    });
  }, [properties, sortKey, sortDirection]);

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.AVAILABLE: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case PropertyStatus.SOLD: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case PropertyStatus.RESERVED: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case PropertyStatus.LAST_UNITS: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case PropertyStatus.DRAFT: return 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Imóveis</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seu catálogo imobiliário</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
             <Link 
              to="/showcase"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-200 dark:border-gray-700"
              title={profile?.customDomain || `https://${profile?.subdomain || 'seu-site'}.luxe.app`}
            >
              <Eye size={20} />
              Ver Minha Vitrine
            </Link>
            <button 
              onClick={() => setShowDomainModal(true)}
              className="px-3 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              title="Configurar Domínio"
            >
              <Settings size={20} />
            </button>
          </div>

          <Link 
            to="/properties/new" 
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
            Novo Imóvel
          </Link>
        </div>
      </div>

      {properties.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 flex items-center gap-2">
            <ArrowUpDown size={16} />
            Ordenar por:
          </span>
          
          <select 
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            <option value="createdAt">Data de Cadastro</option>
            <option value="price">Preço</option>
            <option value="status">Status</option>
            <option value="title">Título</option>
          </select>

          <button 
            onClick={toggleSortDirection}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Inverter ordem"
          >
            {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="hidden sm:inline">{sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}</span>
          </button>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-gray-400 dark:text-gray-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum imóvel cadastrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Comece adicionando o primeiro imóvel ao seu portfólio.</p>
          <Link 
            to="/properties/new" 
            className="text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300 underline"
          >
            Cadastrar agora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProperties.map((property) => (
            <div 
              key={property.id} 
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col group"
            >
              <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
                <img 
                  src={property.media[0]?.url || 'https://via.placeholder.com/400x300?text=Sem+Imagem'} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </div>

                {/* Quick Publish Button for Drafts */}
                {property.status === PropertyStatus.DRAFT && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-20">
                    <button 
                      onClick={(e) => handlePublish(e, property.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Globe size={18} />
                      Publicar
                    </button>
                  </div>
                )}

                {/* Price Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-bold text-lg">{property.displayPrice}</p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                   <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{property.type}</span>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 truncate" title={property.title}>{property.title}</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                     <MapPin size={14} />
                     {property.neighborhood}, {property.city}
                   </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-gray-100 dark:border-gray-700 mb-4">
                  <div className="flex flex-col items-center justify-center text-center">
                    <BedDouble size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.bedrooms} Quartos</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center border-l border-gray-100 dark:border-gray-700">
                    <Bath size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.bathrooms} Banheiros</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center border-l border-gray-100 dark:border-gray-700">
                    <Square size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.area}m²</span>
                  </div>
                </div>

                <div className="mt-auto flex gap-3">
                  <Link 
                    to={`/properties/${property.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors font-medium text-sm"
                  >
                    <Edit2 size={16} />
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleOpenManageModal(property.id)}
                    className="flex-none flex items-center justify-center px-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                    title="Gerenciar remoção"
                  >
                    <Ban size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Domain Config Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <Globe className="text-brand-600" size={24} />
                 Personalizar Vitrine
               </h3>
               <button onClick={() => setShowDomainModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSaveDomain} className="p-6 space-y-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subdomínio Gratuito</label>
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      value={domainConfig.subdomain}
                      onChange={(e) => setDomainConfig({...domainConfig, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="seu-nome"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                    />
                    <span className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg font-medium">.luxe.app</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">URL: https://{domainConfig.subdomain || 'seu-nome'}.luxe.app</p>
               </div>

               <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white dark:bg-gray-800 text-sm text-gray-500">OU</span>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domínio Personalizado</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={domainConfig.customDomain}
                        onChange={(e) => setDomainConfig({...domainConfig, customDomain: e.target.value})}
                        placeholder="www.suaimobiliaria.com.br"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                     />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
                    Requer configuração de DNS (CNAME)
                  </p>
               </div>

               <div className="pt-2 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowDomainModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-md flex items-center gap-2"
                  >
                    <Save size={18} />
                    Salvar Alterações
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage/Delete Modal */}
      {manageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <AlertTriangle className="text-yellow-500" size={24} />
                 Gerenciar Imóvel
               </h3>
               <button onClick={handleCloseManageModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                 <X size={24} />
               </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                O que você deseja fazer com este imóvel?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleUnpublish}
                  className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-xl border border-yellow-200 dark:border-yellow-800 transition-colors group"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Despublicar</span>
                    <span className="text-xs opacity-80">Mover para rascunho (ocultar da vitrine)</span>
                  </div>
                  <Ban size={20} className="text-yellow-600 dark:text-yellow-400" />
                </button>

                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-800 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 transition-colors group"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Excluir Permanentemente</span>
                    <span className="text-xs opacity-80">Esta ação não pode ser desfeita</span>
                  </div>
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button 
                  onClick={handleCloseManageModal}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};