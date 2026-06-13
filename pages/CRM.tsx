import React, { useEffect, useState } from 'react';
import { crmService, CrmLead } from '../services/crmService';
import { MessageCircle, ExternalLink, Phone, AlignLeft, Search } from 'lucide-react';

const COLUMNS = [
  { id: 'novo', title: 'Novo' },
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
    if (lead && lead.status !== colId) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: colId } : l));
      try {
        await crmService.updateLeadStatus(leadId, colId);
      } catch (err) {
        // revert on error
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: lead.status } : l));
        alert('Erro ao atualizar status');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleSaveNotes = async (id: string) => {
    try {
      await crmService.updateLeadNotes(id, notesText);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: notesText } : l));
      setEditingNotes(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar observações');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.property_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ScoreBadge = ({ score }: { score: string }) => {
    const s = score?.toLowerCase() || 'unscored';
    if (s === 'gold' || s === 'alta' || s === 'quente') {
      return <div className="w-3 h-3 rounded-full bg-amber-500" title="Alta Prioridade"></div>;
    }
    if (s === 'silver' || s === 'média' || s === 'médio' || s === 'morno') {
      return <div className="w-3 h-3 rounded-full bg-gray-400" title="Média Prioridade"></div>;
    }
    return <div className="w-3 h-3 rounded-full bg-slate-300" title="Baixa Prioridade"></div>;
  };

  if (loading) return <div className="p-8 text-center">Carregando CRM...</div>;

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Captação</h1>
          <p className="text-gray-500 dark:text-gray-400">Acompanhe e gerencie as negociações de propriedades.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar leads..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const colLeads = filteredLeads.filter(l => (l.status || 'novo') === col.id);
            return (
              <div 
                key={col.id} 
                className="w-[320px] bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col shrink-0"
                onDrop={e => handleDrop(e, col.id)}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">{col.title}</h3>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full font-bold">
                    {colLeads.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                  {colLeads.map(lead => (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                         <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-1" title={lead.property_title}>
                              {lead.property_title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.owner_name}</p>
                         </div>
                         <ScoreBadge score={lead.score} />
                      </div>

                      <div className="flex gap-1 mb-3">
                         {lead.whatsapp && (
                           <button 
                             onClick={() => window.open(`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`, '_blank')}
                             className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded transition-colors"
                             title="WhatsApp"
                           >
                             <MessageCircle size={16} />
                           </button>
                         )}
                         {lead.phone && !lead.whatsapp && (
                           <button 
                             className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded transition-colors"
                             title="Telefone"
                           >
                             <Phone size={16} />
                           </button>
                         )}
                         {lead.original_url && (
                           <button 
                             onClick={() => window.open(lead.original_url, '_blank')}
                             className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                             title="Acessar anúncio"
                           >
                             <ExternalLink size={16} />
                           </button>
                         )}
                      </div>

                      {editingNotes === lead.id ? (
                        <div className="mt-2 space-y-2">
                           <textarea 
                             className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                             rows={3}
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
                        <div 
                          className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-start gap-2 cursor-pointer group"
                          onClick={() => { setEditingNotes(lead.id); setNotesText(lead.notes || ''); }}
                        >
                          <AlignLeft size={14} className="text-gray-400 mt-0.5 group-hover:text-blue-500" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {lead.notes || 'Adicionar observação...'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
