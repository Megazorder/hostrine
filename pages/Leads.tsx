import React, { useEffect, useState } from 'react';
import { Download, Trash2, Eye, EyeOff, Search, CheckCircle, Archive } from 'lucide-react';
import { storageService } from '../services/storage';
import { Lead } from '../types';

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'archived'>('all');

  useEffect(() => {
    setLeads(storageService.getLeads());
  }, []);

  const handleExport = () => {
    const headers = ['Nome', 'WhatsApp', 'Email', 'Imóvel', 'Data', 'Status'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name}"`,
        `"${lead.whatsapp}"`,
        `"${lead.email}"`,
        `"${lead.propertyTitle}"`,
        `"${new Date(lead.createdAt).toLocaleDateString()}"`,
        `"${lead.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leads_export.csv';
    link.click();
  };

  const handleStatusChange = (id: string, newStatus: 'new' | 'contacted' | 'archived') => {
    storageService.updateLeadStatus(id, newStatus);
    setLeads(storageService.getLeads());
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      storageService.deleteLead(id);
      setLeads(storageService.getLeads());
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Leads</h1>
          <p className="text-gray-500 dark:text-gray-400">Visualize e gerencie os contatos capturados.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou imóvel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'new', 'contacted', 'archived'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  statusFilter === status 
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'new' ? 'Novos' : status === 'contacted' ? 'Contatados' : 'Arquivados'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Contato</th>
                <th className="px-6 py-3">Imóvel de Interesse</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString()} <br/>
                    <span className="text-xs">{new Date(lead.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col">
                      <span>{lead.whatsapp}</span>
                      <span className="text-xs text-gray-500">{lead.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={lead.propertyTitle}>
                    {lead.propertyTitle}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                      ${lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                      ${lead.status === 'contacted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                      ${lead.status === 'archived' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' : ''}
                    `}>
                      {lead.status === 'new' ? 'Novo' : lead.status === 'contacted' ? 'Contatado' : 'Arquivado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lead.status !== 'contacted' && (
                        <button onClick={() => handleStatusChange(lead.id, 'contacted')} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Marcar como contatado">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {lead.status !== 'archived' && (
                         <button onClick={() => handleStatusChange(lead.id, 'archived')} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Arquivar">
                           <Archive size={18} />
                         </button>
                      )}
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};