import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { radarService, RadarFilter } from '../services/radarService';
import { crmService } from '../services/crmService';
import { 
  MapPin, 
  Search, 
  Filter, 
  Star, 
  ArrowRight, 
  MessageCircle, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix leaflet icon issue
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map centering
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const Radar: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<RadarFilter>({
    page: 1,
    pageSize: 12,
    sortBy: 'recent'
  });
  
  // Single selected item for Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]); // default SP

  useEffect(() => {
    fetchRadarData();
  }, [filters]);

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const { data, count } = await radarService.getRadarItems(filters);
      setItems(data);
      setTotalCount(count);
      
      // If we have items with lat/lng, center map on first one
      if (data.length > 0) {
        const firstWithCoords = data.find(i => i.latitude && i.longitude);
        if (firstWithCoords) {
           setMapCenter([parseFloat(firstWithCoords.latitude), parseFloat(firstWithCoords.longitude)]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof RadarFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const toggleFavorite = async (item: any) => {
    try {
      await radarService.toggleFavorite(item.id, item.isFavorite);
      fetchRadarData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToCrm = async (item: any) => {
    try {
      await crmService.moveOwnerToCrm(item.id);
      alert('Movido para o CRM com sucesso!');
      setSelectedItem(null);
      fetchRadarData(); // refresh list
    } catch (e) {
      console.error(e);
      alert('Erro ao mover para CRM.');
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const getScoreBadge = (score: number) => {
    if (!score) return { text: '🧊 Fria', class: 'bg-slate-100 text-slate-700' };
    if (score >= 80) return { text: '🔥 Quente', class: 'bg-red-100 text-red-700' };
    if (score >= 50) return { text: '⚡ Média', class: 'bg-amber-100 text-amber-700' };
    return { text: '🧊 Fria', class: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
      {/* MAP SECTION */}
      <div className="w-full md:w-1/2 lg:w-3/5 h-[40vh] md:h-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative z-0">
        <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater center={mapCenter} />
          
          {items.map(item => {
            if (!item.latitude || !item.longitude) return null;
            return (
              <Marker 
                key={`marker-${item.id}`} 
                position={[parseFloat(item.latitude), parseFloat(item.longitude)]}
                icon={customIcon}
                eventHandlers={{
                  click: () => setSelectedItem(item)
                }}
              >
                <Popup>
                  <div className="text-sm font-bold">{item.bairro}</div>
                  <div className="text-xs text-gray-500">Score: {item.score || 0}</div>
                  <button 
                    onClick={() => setSelectedItem(item)}
                    className="text-blue-500 text-xs mt-1 underline"
                  >
                    Ver detalhes
                  </button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* LIST SECTION */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative z-10">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin size={20} className="text-blue-500" />
              Radar ImobHunter
            </h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
              {totalCount} Oportunidades
            </span>
          </div>
          
          <div className="flex gap-2 text-sm overflow-x-auto pb-1 custom-scrollbar">
            <input 
              type="text" 
              placeholder="Cidade"
              value={filters.city || ''}
              onChange={e => handleFilterChange('city', e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
            />
            <input 
              type="text" 
              placeholder="Bairro"
              value={filters.neighborhood || ''}
              onChange={e => handleFilterChange('neighborhood', e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
            />
            <select 
              value={filters.sortBy}
              onChange={e => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="recent">Mais recentes</option>
              <option value="score_high">Maior score</option>
              <option value="oldest">Mais antigos</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              Atualizando radar...
            </div>
          ) : items.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              Nenhuma oportunidade encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {items.map(item => {
                const badgeInfo = getScoreBadge(item.score);
                const isHot = item.score && item.score >= 80;
                
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${item.inCrm ? 'opacity-60 border-gray-200 dark:border-gray-700' : isHot ? 'border-amber-300 dark:border-amber-700/50' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex">
                       <div className="w-1/3 relative">
                          <img 
                            src={'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'} 
                            alt="Imóvel" 
                            className="w-full h-full object-cover min-h-[120px]" 
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${badgeInfo.class}`}>
                               {badgeInfo.text}
                             </span>
                             {/* Novo badge if created in last 2 days */}
                             {(new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24) < 2 && (
                               <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm">Novo</span>
                             )}
                          </div>
                       </div>
                       <div className="w-2/3 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                                {item.bairro}
                              </h4>
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                                className={`p-1 rounded-full transition-colors ${item.isFavorite ? 'text-red-500' : 'text-gray-300 hover:text-gray-500'}`}
                              >
                                <Star size={16} fill={item.isFavorite ? "currentColor" : "none"} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{item.cidade}</p>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                              Origem: {item.origem || 'Desconhecido'}
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                             <span>{new Date(item.created_at).toLocaleDateString()}</span>
                             {item.inCrm && (
                               <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 px-1.5 py-0.5 rounded">No CRM</span>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Pagination */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <button 
            disabled={filters.page === 1}
            onClick={() => handlePageChange((filters.page || 1) - 1)}
            className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-xs text-gray-500 font-medium">
            Página {filters.page}
          </span>
          
          <button 
            disabled={(filters.page || 1) * (filters.pageSize || 12) >= totalCount}
            onClick={() => handlePageChange((filters.page || 1) + 1)}
            className="p-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ITEM MODAL PREVIEW */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 pt-16">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="relative h-48 bg-gray-200 shrink-0">
               <img 
                 src={'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'} 
                 alt="Preview" 
                 className="w-full h-full object-cover" 
               />
               <button 
                 onClick={() => setSelectedItem(null)}
                 className="absolute top-4 right-4 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 transition"
               >
                 <X size={20} />
               </button>
               
               <div className="absolute bottom-4 left-4 flex gap-2">
                 <span className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${getScoreBadge(selectedItem.score).class}`}>
                   {getScoreBadge(selectedItem.score).text} (Score: {selectedItem.score || 0})
                 </span>
               </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                     {selectedItem.bairro}
                   </h2>
                   <p className="text-sm text-gray-500 flex items-center gap-1">
                     <MapPin size={14} /> {selectedItem.cidade}
                   </p>
                 </div>
                 
                 <button 
                    onClick={() => {
                        toggleFavorite(selectedItem);
                        setSelectedItem({...selectedItem, isFavorite: !selectedItem.isFavorite});
                    }}
                    className={`p-2 rounded-full border transition-colors ${selectedItem.isFavorite ? 'bg-red-50 text-red-500 border-red-200' : 'text-gray-400 hover:bg-gray-50 border-gray-200'}`}
                  >
                    <Star size={20} fill={selectedItem.isFavorite ? "currentColor" : "none"} />
                  </button>
               </div>

               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-3 mb-6 border border-gray-100 dark:border-gray-700">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                     <User size={20} />
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium">Proprietário</p>
                     <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedItem.nome || 'Não identificado'}</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">Telefone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedItem.telefone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">WhatsApp</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedItem.whatsapp || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Origem</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedItem.origem || 'Desconhecida'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Data de Captura</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                    </div>
                 </div>
               </div>

               {/* Ações */}
               <div className="space-y-3">
                 <div className="flex gap-2">
                   <button 
                     onClick={() => handleWhatsApp(selectedItem.whatsapp || selectedItem.telefone)}
                     disabled={!selectedItem.whatsapp && !selectedItem.telefone}
                     className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                   >
                     <MessageCircle size={18} /> Chamar no App
                   </button>
                   
                   {selectedItem.url_origem && (
                     <button 
                       onClick={() => window.open(selectedItem.url_origem, '_blank')}
                       className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-xl text-sm font-bold transition-colors border border-gray-200 dark:border-gray-600"
                       title="Ver anúncio original"
                     >
                       <ExternalLink size={20} />
                     </button>
                   )}
                 </div>

                 <button 
                   onClick={() => handleMoveToCrm(selectedItem)}
                   disabled={selectedItem.inCrm}
                   className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                     selectedItem.inCrm 
                       ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700' 
                       : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                   }`}
                 >
                   {selectedItem.inCrm ? (
                     'Já está no CRM'
                   ) : (
                     <>Mover para CRM <ArrowRight size={18} /></>
                   )}
                 </button>
               </div>
               
               {/* Observações da captura */}
               {selectedItem.descricao && (
                 <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-bold mb-2">Observações da Captura</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                      {selectedItem.descricao}
                    </p>
                 </div>
               )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
