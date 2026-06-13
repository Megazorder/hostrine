import React, { useState } from 'react';
import { Target, Link as LinkIcon, FileSpreadsheet, Plus, UploadCloud, AlertCircle } from 'lucide-react';
import { captacaoService, OpportunityInput } from '../services/captacaoService';
import { useNavigate } from 'react-router-dom';

export const Captacao: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'url' | 'csv'>('manual');
  
  const [formData, setFormData] = useState<OpportunityInput>({
    nome: '',
    telefone: '',
    whatsapp: '',
    cidade: '',
    bairro: '',
    url_origem: '',
    observacoes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await captacaoService.createOpportunity(formData);
      alert('Oportunidade importada com sucesso!');
      setFormData({ nome: '', telefone: '', whatsapp: '', cidade: '', bairro: '', url_origem: '', observacoes: '' });
      navigate('/radar');
    } catch (e) {
      console.error(e);
      alert('Erro ao importar oportunidade.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    
    setLoading(true);
    try {
      const res = await captacaoService.triggerIngestionEdgeFunction(urlInput);
      alert(res.message);
      setUrlInput('');
    } catch (e) {
      console.error(e);
      alert('Erro ao disparar ingestão por URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
           <Target size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Motor de Captação</h1>
          <p className="text-gray-500">Importe e gerencie novas oportunidades de negócio no Radar.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
           <button 
             onClick={() => setActiveTab('manual')}
             className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${activeTab === 'manual' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
           >
              <Plus size={18} /> Importação Manual
           </button>
           <button 
             onClick={() => setActiveTab('url')}
             className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${activeTab === 'url' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
           >
              <LinkIcon size={18} /> Ingestão via URL
           </button>
           <button 
             onClick={() => setActiveTab('csv')}
             className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${activeTab === 'csv' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
           >
              <FileSpreadsheet size={18} /> Lote / CSV
           </button>
        </div>

        <div className="p-6 md:p-8">
           
           {activeTab === 'manual' && (
             <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Proprietário</label>
                    <input 
                      type="text" 
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone (Fixo/Outros)</label>
                    <input 
                      type="text" 
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="whatsapp"
                      required
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                    <input 
                      type="text" 
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                    <input 
                      type="text" 
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Original do Anúncio</label>
                    <input 
                      type="url" 
                      name="url_origem"
                      placeholder="https://olx.com.br/..."
                      value={formData.url_origem}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações / Detalhes de Captura</label>
                  <textarea 
                    name="observacoes"
                    rows={4}
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Descrição extraída, contexto da captação etc."
                  />
                </div>

                <div className="flex justify-end">
                   <button 
                     type="submit" 
                     disabled={loading}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow flex items-center gap-2 disabled:opacity-50"
                   >
                     {loading ? 'Processando...' : 'Adicionar ao Radar'}
                   </button>
                </div>
             </form>
           )}

           {activeTab === 'url' && (
             <div className="space-y-6 max-w-xl">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex gap-3 text-blue-700 dark:text-blue-300">
                  <AlertCircle className="shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Nosso motor de ingestão fará o parsing da URL (OLX, Zap, VivaReal), 
                    extrairá os dados relevantes (telefone, nome, endereço) e salvará automaticamente
                    uma oportunidade pontuada no seu Radar. 
                  </p>
               </div>
               
               <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL do Anúncio</label>
                    <input 
                      type="url" 
                      required
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="Cole o link aqui..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button 
                     type="submit" 
                     disabled={loading}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow flex items-center gap-2 disabled:opacity-50"
                   >
                     {loading ? 'Disparando Scraper...' : 'Importar Oportunidade'}
                   </button>
               </form>
             </div>
           )}

           {activeTab === 'csv' && (
             <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <UploadCloud size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Importar em Lote (CSV)</h3>
                <p className="text-gray-500 text-center text-sm max-w-md mb-6">
                  Faça o upload de uma planilha contendo Leads / Proprietários que você comprou ou listou. 
                  O motor de captação dará score para todos eles em lote.
                </p>
                <button 
                  className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
                  onClick={() => alert('Integração de CSV ainda não ativa para essa demo.')}
                >
                  Selecionar Arquivo .CSV
                </button>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};
