import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, MapPin, BedDouble, Bath, Square, Plus, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { storageService } from '../services/storage';
import { Property, PropertyStatus } from '../types';

type SortKey = 'createdAt' | 'price' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

export const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    setProperties(storageService.getProperties());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      storageService.deleteProperty(id);
      setProperties(storageService.getProperties());
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
          <Link 
            to="/showcase"
            target="_blank"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Eye size={20} />
            Ver Minha Vitrine
          </Link>
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
            <div key={property.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group">
              <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
                <img 
                  src={property.media[0]?.url || 'https://via.placeholder.com/400x300?text=Sem+Imagem'} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </div>
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
                    onClick={() => handleDelete(property.id)}
                    className="flex-none flex items-center justify-center px-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};