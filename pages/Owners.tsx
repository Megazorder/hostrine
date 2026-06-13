import React, { useEffect, useState } from 'react';
import { User, Phone, MessageCircle, ExternalLink, ArrowRight, MapPin, Search, Plus } from 'lucide-react';
import { ownerService } from '../services/ownerService';
import { crmService } from '../services/crmService';
import { useNavigate } from 'react-router-dom';

export const Owners: React.FC = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getOwners();
      setOwners(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ScoreBadge = ({ score }: { score: string }) => {
    const s = score?.toLowerCase() || 'unscored';
    if (s === 'gold' || s === 'alta' || s === 'quente') {
      return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">Alta Prioridade</span>;
    }
    if (s === 'silver' || s === 'média' || s === 'médio' || s === 'morno') {
      return <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Média Prioridade</span>;
    }
    return <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">Baixa Prioridade</span>;
  };

  const handleMoveToCrm = async (owner: any) => {
    try {
      setMovingId(owner.id);
      await crmService.moveOwnerToCrm(owner);
      alert('Movido para o CRM com sucesso!');
      navigate('/crm');
    } catch (e) {
      console.error(e);
      alert('Erro ao mover para CRM. Verifique se a tabela foi configurada no banco.');
    } finally {
      setMovingId(null);
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  if (loading) {
    return <div className="text-center p-8">Carregando proprietários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proprietários Captados</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie contatos de propriedades captadas e mova para prospecção.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {owners.map(owner => {
          const propertyTitle = `${owner.bairro ? owner.bairro + ' - ' : ''}${owner.cidade || 'Imóvel'}`;
          const coverImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9';
          const city = owner.cidade || 'Sem cidade';

          return (
            <div key={owner.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden relative">
                <img src={coverImage} alt={propertyTitle} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <ScoreBadge score={owner.score} />
                  <button 
                    onClick={() => ownerService.toggleFavorite(owner.id, owner.isFavorite).then(() => fetchOwners())}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${owner.isFavorite ? 'bg-red-500/90 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'} shadow-sm`}
                  >
                    <svg className="w-4 h-4" fill={owner.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-1 select-none rounded text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  <MapPin size={12} /> {city}
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate" title={propertyTitle}>
                    {propertyTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-300">
                    <User size={16} />
                    <span className="font-medium truncate">{owner.nome || 'Nome Indisponível'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                     <span className="text-gray-500">Origem: <span className="font-medium text-gray-700 dark:text-gray-200">{owner.origem || 'Desconhecida'}</span></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleWhatsApp(owner.whatsapp || owner.telefone)}
                    disabled={!owner.whatsapp && !owner.telefone}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                  {owner.url_origem && (
                    <button 
                      onClick={() => window.open(owner.url_origem, '_blank')}
                      className="px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                      title="Ver Anúncio Original"
                    >
                      <ExternalLink size={18} />
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => handleMoveToCrm(owner.id)}
                  disabled={movingId === owner.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-wait"
                >
                  {movingId === owner.id ? 'Movendo...' : (
                    <>
                      Mover para CRM <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {owners.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Nenhum proprietário encontrado.
          </div>
        )}
      </div>
    </div>
  );
};
