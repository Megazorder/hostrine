import React, { useEffect, useState } from 'react';
import { crmService, CrmLead } from '../services/crmService';
import { MessageCircle, ExternalLink, Phone, AlignLeft, Search, History } from 'lucide-react';

const COLUMNS = [
  { id: 'novo_lead', title: 'Novo Lead' },
  { id: 'contato_iniciado', title: 'Contato Iniciado' },
  { id: 'resposta_recebida', title: 'Resposta Recebida' },
  { id: 'visita_agendada', title: 'Visita Agendada' },
  { id: 'proposta', title: 'Proposta' },
  { id: 'fechado', title: 'Fechado' },
  { id: 'perdido', title: 'Perdido' }
];

export const CRM: React.FC = () => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await crmService.getLeads();
      setLeads(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    
    // Optimistic update
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.coluna !== colId) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, coluna: colId } : l));
      try {
        await crmService.updateLeadStatus(leadId, colId);
      } catch (err) {
        // revert on error
        fetchLeads();
        alert('Erro ao atualizar status');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleSaveNotes = async (id: string) => {
    if (!notesText.trim()) {
      setEditingNotes(null);
      return;
    }
    try {
      await crmService.addInteraction(id, notesText, 'observacao');
      // refresh to get new interacoes
      await fetchLeads();
      setEditingNotes(null);
      setNotesText('');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar observação');
    }
  };

  const filteredLeads = leads.filter(l => {
    const owner = l.proprietarios_detectados || {};
    return owner.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           owner.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const ScoreBadge = ({ score }: { score: string }) => {
    const s = score?.toLowerCase() || 'unscored';
    if (s === 'gold' || s === 'alta' || s === 'quente') {
       return <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Alta Prioridade</span>;
    }
    if (s === 'silver' || s === 'média' || s === 'médio' || s === 'morno') {
       return <span className="text-[10px] bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded font-bold">Média Prioridade</span>;
    }
    return <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Baixa Prioridade</span>;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando CRM...</div>;

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Captação</h1>
          <p className="text-gray-500 dark:text-gray-400">Arraste os cartões para avançar na prospecção.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar proprietário ou cidade..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max items-start">
          {COLUMNS.map(col => {
            const colLeads = filteredLeads.filter(l => (l.coluna || 'novo_lead') === col.id);
            return (
              <div 
                key={col.id} 
                className="w-[320px] bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col shrink-0 max-h-full"
                onDrop={e => handleDrop(e, col.id)}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm tracking-wide uppercase">{col.title}</h3>
                  <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm border border-gray-200 dark:border-gray-600">
                    {colLeads.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2 custom-scrollbar">
                  {colLeads.map(lead => {
                    const owner = lead.proprietarios_detectados || {};
                    const propertyTitle = owner.bairro ? `${owner.bairro} - ${owner.cidade}` : owner.cidade || 'Imóvel sem localização';
                    const interactions = lead.interacoes_proprietario || [];
                    const lastInteraction = interactions.length > 0 ? interactions[interactions.length - 1] : null;

                    return (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                         <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 leading-tight mb-0.5" title={owner.nome}>
                              {owner.nome || 'Sem Nome'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{propertyTitle}</p>
                         </div>
                      </div>

                      <div className="mb-3">
                         <ScoreBadge score={owner.score} />
                      </div>

                      <div className="flex gap-1.5 mb-3">
                         {owner.whatsapp && (
                           <button 
                             onClick={() => window.open(`https://wa.me/55${owner.whatsapp.replace(/\D/g, '')}`, '_blank')}
                             className="flex flex-1 items-center justify-center gap-1.5 p-1.5 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg transition-colors font-medium text-xs border border-green-200 dark:border-green-800"
                           >
                             <MessageCircle size={14} /> Msg
                           </button>
                         )}
                         {owner.telefone && !owner.whatsapp && (
                           <button 
                             className="flex flex-1 items-center justify-center gap-1.5 p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors font-medium text-xs border border-blue-200 dark:border-blue-800"
                           >
                             <Phone size={14} /> Ligar
                           </button>
                         )}
                         {owner.url_origem && (
                           <button 
                             onClick={() => window.open(owner.url_origem, '_blank')}
                             className="flex flex-1 items-center justify-center gap-1.5 p-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium text-xs border border-gray-200 dark:border-gray-600"
                           >
                             <ExternalLink size={14} /> Anúncio
                           </button>
                         )}
                      </div>

                      {editingNotes === lead.id ? (
                        <div className="mt-3 space-y-2">
                           <textarea 
                             className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                             rows={2}
                             placeholder="Ex: Ligação realizada, visita confirmada..."
                             value={notesText}
                             onChange={e => setNotesText(e.target.value)}
                             autoFocus
                           />
                           <div className="flex gap-2">
                              <button onClick={() => handleSaveNotes(lead.id)} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded font-medium">Salvar</button>
                              <button onClick={() => setEditingNotes(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs py-1.5 rounded font-medium">Cancelar</button>
                           </div>
                        </div>
                      ) : (
                        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <div className="flex items-center justify-between mb-1.5 cursor-pointer group" onClick={() => { setEditingNotes(lead.id); setNotesText(''); }}>
                               <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                                  <History size={10} /> Histórico ({interactions.length})
                               </span>
                               <span className="text-[10px] text-blue-500 hover:text-blue-600 font-medium">+ Add</span>
                            </div>
                            
                            {lastInteraction ? (
                               <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                                   <span className="font-medium text-gray-400 mr-1">{new Date(lastInteraction.created_at).toLocaleDateString()}:</span>
                                   {lastInteraction.descricao}
                               </p>
                            ) : (
                               <p className="text-xs text-gray-400 italic">Sem observações ainda.</p>
                            )}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
