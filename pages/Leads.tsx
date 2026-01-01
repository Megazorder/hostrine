import React, { useEffect, useState, useMemo } from 'react';
import { Download, Trash2, Search, Plus, MoreHorizontal, Phone, Mail, Calendar, MapPin, X, Banknote, Wallet, Home, Clock, Info } from 'lucide-react';
import { storageService } from '../services/storage';
import { Lead, LeadColumn, LeadScore, Property } from '../types';

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<LeadColumn[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  
  // Column Management
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    setLeads(storageService.getLeads());
    setColumns(storageService.getLeadColumns());
    setProperties(storageService.getProperties());
  }, []);

  // Helper to get property price
  const getPropertyPrice = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.price : 0;
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    
    if (draggedLeadId) {
      storageService.updateLeadStatus(draggedLeadId, colId);
      setLeads(storageService.getLeads());
      setDraggedLeadId(null);
    }
  };

  const handleAddColumnClick = () => {
    setShowAddColumnModal(true);
    setNewColumnTitle('');
  };

  const confirmAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim()) {
      const newCol: LeadColumn = {
        id: Math.random().toString(36).substr(2, 9),
        title: newColumnTitle.trim(),
        color: '#64748b',
        order: columns.length
      };
      const updated = [...columns, newCol];
      storageService.saveLeadColumns(updated);
      setColumns(updated);
      setShowAddColumnModal(false);
      setNewColumnTitle('');
    }
  };

  const handleDeleteColumn = (colId: string) => {
    const hasLeads = leads.some(l => l.status === colId);
    if (hasLeads) {
      alert("Não é possível excluir uma coluna que contém leads. Mova-os primeiro.");
      return;
    }
    
    if (window.confirm("Excluir esta coluna?")) {
      const updated = columns.filter(c => c.id !== colId);
      storageService.saveLeadColumns(updated);
      setColumns(updated);
    }
  };

  const handleRenameColumn = (colId: string, currentTitle: string) => {
    const newTitle = prompt("Novo nome da coluna:", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      const updated = columns.map(c => c.id === colId ? { ...c, title: newTitle } : c);
      storageService.saveLeadColumns(updated);
      setColumns(updated);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm('Excluir este lead permanentemente?')) {
      storageService.deleteLead(id);
      setLeads(storageService.getLeads());
    }
  };

  const getColumnLeads = (colId: string) => {
    return leads
      .filter(l => l.status === colId)
      .filter(l => 
         l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         l.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
         l.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  const handleExport = () => {
     const headers = ['Nome', 'WhatsApp', 'Email', 'Imóvel', 'Data', 'Fase', 'Score', 'Renda', 'Entrada'];
     const csvContent = [
       headers.join(','),
       ...leads.map(lead => {
         const colName = columns.find(c => c.id === lead.status)?.title || 'Desconhecido';
         return [
           `"${lead.name}"`,
           `"${lead.whatsapp}"`,
           `"${lead.email}"`,
           `"${lead.propertyTitle}"`,
           `"${new Date(lead.createdAt).toLocaleDateString()}"`,
           `"${colName}"`,
           `"${lead.score || 'unscored'}"`,
           `"${lead.income || 0}"`,
           `"${lead.downPayment || 0}"`
         ].join(',');
       })
     ].join('\n');
 
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = 'leads_crm_export.csv';
     link.click();
   };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Há ${minutes} min`;
    return 'Agora';
  };

  const LeadBadge = ({ score }: { score?: LeadScore }) => {
    if (!score || score === 'unscored') return null;
    
    // Style mapping to reference (Qualified = Blueish, Disqualified = Redish)
    // Gold/Silver -> Qualified style
    // Curious -> Disqualified style
    
    let styleClass = '';
    let label = '';
    
    if (score === 'gold') {
      // Blue/Sky style from reference
      styleClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      label = 'OURO';
    } else if (score === 'silver') {
      // Using a slightly different shade but same "qualified" vibe or maybe Teal
      styleClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
      label = 'PRATA';
    } else if (score === 'curious') {
      // Red style from reference
      styleClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      label = 'CURIOSO';
    } else {
      return null;
    }

    return (
      <div className={`text-[11px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider flex items-center gap-1.5 ${styleClass}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {label}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fadeIn relative font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM & Análise de Crédito</h1>
            <p className="text-gray-500 dark:text-gray-400">Pipeline de vendas com qualificação financeira automática dos leads.</p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            <button 
              onClick={handleExport}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Exportar CSV"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={handleAddColumnClick}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Nova Fase
            </button>
          </div>
        </div>

        {/* Data Origin Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 flex items-start gap-3">
          <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-snug">
            <strong>Origem dos Dados:</strong> As informações financeiras (Renda, Entrada, FGTS) exibidas nos cards foram preenchidas diretamente pelo cliente no formulário de desbloqueio de preço na vitrine. A classificação (Ouro/Prata/Curioso) é calculada automaticamente pelo sistema.
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max px-2">
          {columns.map((column) => {
            const colLeads = getColumnLeads(column.id);
            
            return (
              <div 
                key={column.id}
                className={`
                   w-[320px] sm:w-[380px] flex flex-col rounded-2xl transition-all duration-200 border-2 h-full
                   ${dragOverColumnId === column.id 
                     ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-500/50' 
                     : 'bg-gray-100/50 dark:bg-gray-900/20 border-transparent'}
                `}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="p-4 flex justify-between items-center mb-2">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: column.color }}></div>
                      <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide cursor-pointer hover:text-brand-500" onClick={() => handleRenameColumn(column.id, column.title)}>
                        {column.title}
                      </h3>
                      <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {colLeads.length}
                      </span>
                   </div>
                   <div className="group relative">
                      <MoreHorizontal size={20} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200" />
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 hidden group-hover:block z-20 overflow-hidden">
                         <button onClick={() => handleRenameColumn(column.id, column.title)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Renomear</button>
                         <button onClick={() => handleDeleteColumn(column.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">Excluir</button>
                      </div>
                   </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5 custom-scrollbar">
                   {colLeads.map((lead) => (
                     <div 
                       key={lead.id}
                       draggable
                       onDragStart={(e) => handleDragStart(e, lead.id)}
                       className={`
                         bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 
                         cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-all duration-200 group relative
                         flex flex-col gap-5
                         ${draggedLeadId === lead.id ? 'opacity-40' : 'opacity-100'}
                       `}
                     >
                        {/* Header: Badge & Actions Trigger */}
                        <div className="flex justify-between items-start">
                           <LeadBadge score={lead.score} />
                           
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                             className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        
                        {/* Lead Info */}
                        <div className="flex items-center gap-3.5">
                           <div className="w-[52px] h-[52px] bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-xl border border-slate-200 dark:border-slate-600">
                             {getInitials(lead.name)}
                           </div>
                           <div>
                             <h4 className="font-bold text-xl text-gray-900 dark:text-slate-50 leading-tight">{lead.name}</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: #{lead.id.substring(0,4)}</p>
                           </div>
                        </div>

                        {/* Financial Section (Dark Box) */}
                        <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-5 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
                           {/* Row 1: Income */}
                           <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 border border-green-200/50 dark:border-green-500/20 text-green-500 shadow-sm">
                                <Banknote size={24} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 tracking-wide">Renda Mensal</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(lead.income)}</span>
                              </div>
                           </div>

                           {/* Row 2: Entry */}
                           <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 border border-yellow-200/50 dark:border-yellow-500/20 text-yellow-500 shadow-sm">
                                <Wallet size={24} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 tracking-wide">Entrada Disponível</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency((lead.downPayment || 0) + (lead.fgts || 0))}</span>
                              </div>
                           </div>

                           {/* Row 3: Property Value */}
                           <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 border border-purple-200/50 dark:border-purple-500/20 text-purple-500 shadow-sm">
                                <Home size={24} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 tracking-wide">Valor do Imóvel</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(getPropertyPrice(lead.propertyId))}</span>
                              </div>
                           </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-1">
                           <a 
                             href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} 
                             target="_blank" 
                             rel="noreferrer"
                             onMouseDown={(e) => e.stopPropagation()}
                             className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-semibold text-sm border border-green-500/20 transition-colors shadow-sm"
                           >
                             <Phone size={18} />
                             WhatsApp
                           </a>
                           <a 
                             href={`mailto:${lead.email}`}
                             onMouseDown={(e) => e.stopPropagation()}
                             className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-200 font-semibold text-sm border border-slate-600 transition-colors shadow-sm"
                           >
                             <Mail size={18} />
                             E-mail
                           </a>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs">
                           <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold max-w-[65%]">
                              <MapPin size={14} />
                              <span className="truncate" title={lead.propertyTitle}>{lead.propertyTitle}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
                              <Clock size={14} />
                              <span>{getTimeAgo(lead.createdAt)}</span>
                           </div>
                        </div>

                     </div>
                   ))}
                   
                   {colLeads.length === 0 && (
                     <div className="h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2">
                       <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                          <Search size={20} className="opacity-50" />
                       </div>
                       <span className="text-sm font-medium">Vazio</span>
                     </div>
                   )}
                </div>
              </div>
            );
          })}
          
          {/* Add Column Button (End of Scroll) */}
          <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center mt-2">
             <button 
               onClick={handleAddColumnClick}
               className="w-full h-full bg-white dark:bg-slate-800 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 flex items-center justify-center transition-all shadow-md border border-gray-200 dark:border-slate-700"
               title="Nova Fase"
             >
               <Plus size={24} />
             </button>
          </div>
        </div>
      </div>
      
      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 animate-fadeIn">
               <div className="flex justify-between items-center mb-5">
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">Nova Fase</h3>
                 <button onClick={() => setShowAddColumnModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={20} /></button>
               </div>
               <form onSubmit={confirmAddColumn}>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Ex: Em Negociação"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-5 transition-colors"
                  />
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setShowAddColumnModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                     <button type="submit" disabled={!newColumnTitle.trim()} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 shadow-md transition-colors">Adicionar</button>
                  </div>
               </form>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};