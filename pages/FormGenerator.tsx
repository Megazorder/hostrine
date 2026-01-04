import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storage';
import { Lead, IncomeType } from '../types';
import { 
  User, Building2, Briefcase, Check, Send, Search, Clock, 
  CheckCircle2, History, RotateCw, Wallet, HelpCircle, 
  ChevronRight, AlertCircle, MessageCircle, FileText 
} from 'lucide-react';

// --- Components ---

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1">
    <HelpCircle size={14} className="text-gray-400 hover:text-brand-500 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center shadow-xl">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const StepNumber = ({ number, active, completed }: { number: number, active: boolean, completed: boolean }) => {
  let bgClass = "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  if (completed) bgClass = "bg-green-500 text-white";
  else if (active) bgClass = "bg-brand-600 text-white shadow-lg shadow-brand-500/30 ring-4 ring-brand-100 dark:ring-brand-900/20";

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 flex-shrink-0 ${bgClass}`}>
      {completed ? <Check size={20} /> : number}
    </div>
  );
};

export const FormGenerator: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [incomeType, setIncomeType] = useState<IncomeType>('CLT');
  const [useFgts, setUseFgts] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    setLeads(storageService.getLeads());
  }, []);

  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId), [leads, selectedLeadId]);
  const profile = storageService.getProfile();

  // --- Logic Helpers ---

  const getIncomeItems = (type?: IncomeType) => {
    switch (type) {
      case 'CLT': return ['doc_inc_holerites'];
      case 'Empresario': return ['doc_inc_social', 'doc_inc_bank_pj', 'doc_inc_bank_pf'];
      case 'Autonomo': return ['doc_inc_bank_pf', 'doc_inc_decore'];
      default: return [];
    }
  };

  const calculateProgress = (lead: Lead) => {
    let requiredItems = [
      'doc_personal_id', 
      'doc_personal_status', 
      'doc_personal_address', 
      'doc_personal_ir',
      'doc_prop_matricula',
      'doc_prop_iptu'
    ];
    
    requiredItems = [...requiredItems, ...getIncomeItems(lead.incomeType)];

    const hasFgtsActivity = lead.checklist?.['doc_fgts_extract'] || lead.checklist?.['doc_fgts_ctps'];
    if (hasFgtsActivity) {
       requiredItems.push('doc_fgts_extract', 'doc_fgts_ctps');
    }

    if (requiredItems.length === 0) return 0;

    const checkedCount = requiredItems.reduce((acc, itemId) => {
       const item = lead.checklist?.[itemId];
       return acc + (item?.checked ? 1 : 0);
    }, 0);

    return Math.round((checkedCount / requiredItems.length) * 100);
  };

  const checklistPreview = useMemo(() => {
    const baseItems = [
      'RG/CPF ou CNH',
      'Certidão de Nascimento/Casamento',
      'Comprovante de Residência',
      'Declaração de IR Completa'
    ];

    let incomeItems: string[] = [];
    switch (incomeType) {
      case 'CLT':
        incomeItems = ['3 Últimos Holerites'];
        break;
      case 'Empresario':
        incomeItems = ['Contrato Social / MEI', 'Extratos Bancários PJ (6 meses)', 'Extratos Bancários PF (6 meses)'];
        break;
      case 'Autonomo':
        incomeItems = ['Extratos Bancários PF (6 meses)', 'DECORE'];
        break;
    }

    const fgtsItems = useFgts ? ['Extrato FGTS', 'Carteira de Trabalho (CTPS)'] : [];

    return {
      personal: baseItems,
      income: incomeItems,
      fgts: fgtsItems
    };
  }, [incomeType, useFgts]);

  // --- Actions ---

  const handleGenerateAndSend = () => {
    if (!selectedLead) return;

    const updatedLead: Lead = {
      ...selectedLead,
      incomeType,
      lastRequestDate: Date.now(),
    };
    storageService.updateLead(updatedLead);
    setLeads(storageService.getLeads());

    const url = new URL(window.location.href);
    const baseUrl = `${url.origin}${url.pathname}`;
    const docLink = `${baseUrl}#/upload/${selectedLead.id}`;

    const firstName = selectedLead.name.split(' ')[0];
    const checklistSummary = [
        ...checklistPreview.personal, 
        ...checklistPreview.income, 
        ...checklistPreview.fgts
    ].map(i => `✅ ${i}`).join('\n');

    const message = `Olá ${firstName}! 👋\n\n` +
      `Para darmos andamento no seu processo de financiamento do imóvel *${selectedLead.propertyTitle}*, criei uma pasta segura para você.\n\n` +
      `Você pode tirar foto dos documentos direto pelo celular, sem burocracia.\n\n` +
      `*Acesse aqui sua pasta:* ${docLink}\n\n` +
      `*Itens necessários agora:*\n${checklistSummary}`;

    window.open(`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleResend = (lead: Lead) => {
      setSelectedLeadId(lead.id);
      setIncomeType(lead.incomeType || 'CLT');
      // Infer FGTS usage from checklist or previous flag
      const hasFgtsDocs = !!(lead.checklist?.['doc_fgts_extract'] || lead.checklist?.['doc_fgts_ctps']);
      setUseFgts(hasFgtsDocs);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGeneratePdf = (lead: Lead) => {
    alert(`Gerando PDF de checklist para ${lead.name}...`);
  };

  const handleSendReminder = (lead: Lead) => {
    const url = new URL(window.location.href);
    const baseUrl = `${url.origin}${url.pathname}`;
    const docLink = `${baseUrl}#/upload/${lead.id}`;
    const firstName = lead.name.split(' ')[0];
    const brokerName = profile.name.split(' ')[0];

    const message = `Oi ${firstName}, tudo bem? Aqui é ${brokerName}.\n\n` +
      `Vi que faltam alguns documentos na sua pasta para conseguirmos aprovar o crédito.\n\n` +
      `Consegue enviar ainda hoje? Se tiver dúvida em algum item, me avisa!\n\n` +
      `Link da pasta: ${docLink}`;

    window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const activeRequests = useMemo(() => {
      const requests = leads
        .filter(l => l.lastRequestDate)
        .sort((a, b) => (b.lastRequestDate || 0) - (a.lastRequestDate || 0));
      
      if (filterStatus === 'all') return requests;
      
      return requests.filter(lead => {
          const progress = calculateProgress(lead);
          if (filterStatus === 'completed') return progress === 100;
          if (filterStatus === 'pending') return progress < 100;
          return true;
      });
  }, [leads, filterStatus]);

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '-';
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Há poucos minutos';
    if (hours < 24) return `Há ${hours} horas`;
    const days = Math.floor(hours / 24);
    return `Há ${days} dias`;
  };

  const getInteractionText = (lead: Lead) => {
    if (lead.hasNewUploads) return <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Cliente enviou arquivos</span>;
    if (calculateProgress(lead) > 0) return <span className="text-blue-600 font-medium">Envio em andamento</span>;
    return <span className="text-gray-400">Nenhum documento ainda</span>;
  };

  const getProgressColor = (percent: number) => {
      if (percent === 100) return 'bg-green-500';
      if (percent > 70) return 'bg-blue-500';
      if (percent > 30) return 'bg-orange-500';
      return 'bg-red-500';
  };

  // --- Render ---

  return (
    <div className="space-y-8 pb-20 animate-fadeIn font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Solicitar Documentos</h1>
        <p className="text-gray-500 dark:text-gray-400">Envie um link para o cliente fazer upload dos documentos via WhatsApp.</p>
      </div>

      {/* --- STEPPER CONTAINER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STEP 1: SELECT CLIENT */}
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col ${selectedLeadId ? 'border-brand-500 dark:border-brand-600 shadow-md' : 'border-gray-200 dark:border-gray-700'}`}>
           <div className="flex items-center gap-3 mb-6">
              <StepNumber number={1} active={!selectedLeadId} completed={!!selectedLeadId} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Selecione o Cliente</h3>
           </div>

           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white appearance-none cursor-pointer font-medium"
              >
                  <option value="">Buscar na lista...</option>
                  {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                          {lead.name}
                      </option>
                  ))}
              </select>
           </div>

           {selectedLead && (
             <div className="mt-auto bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800/50 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full bg-brand-200 dark:bg-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs">
                      {selectedLead.name.substring(0,2).toUpperCase()}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{selectedLead.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">WhatsApp: {selectedLead.whatsapp}</p>
                   </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 pt-2 border-t border-brand-200 dark:border-brand-800/50">
                   <Building2 size={12} />
                   Imóvel: <strong>{selectedLead.propertyTitle}</strong>
                </div>
             </div>
           )}
        </div>

        {/* STEP 2: PROFILE */}
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col ${!selectedLeadId ? 'border-gray-200 dark:border-gray-700 opacity-50' : 'border-gray-200 dark:border-gray-700'}`}>
           <div className={`absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 backdrop-blur-[1px] rounded-2xl transition-opacity duration-300 flex items-center justify-center ${selectedLeadId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <span className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">Aguardando Passo 1</span>
           </div>
           
           <div className="flex items-center gap-3 mb-6">
              <StepNumber number={2} active={!!selectedLeadId} completed={false} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Escolha o Perfil</h3>
           </div>

           <div className="space-y-3 flex-1">
              <button 
                onClick={() => setIncomeType('CLT')}
                className={`w-full flex items-center p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${incomeType === 'CLT' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-brand-200'}`}
              >
                 <div className={`p-2 rounded-full mr-3 ${incomeType === 'CLT' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}><User size={20} /></div>
                 <div>
                    <span className={`block font-bold text-sm ${incomeType === 'CLT' ? 'text-brand-900 dark:text-brand-100' : 'text-gray-700 dark:text-gray-300'}`}>CLT / Assalariado</span>
                    <span className="text-xs text-gray-500">Carteira assinada e Holerites</span>
                 </div>
              </button>

              <button 
                onClick={() => setIncomeType('Empresario')}
                className={`w-full flex items-center p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${incomeType === 'Empresario' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-brand-200'}`}
              >
                 <div className={`p-2 rounded-full mr-3 ${incomeType === 'Empresario' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}><Building2 size={20} /></div>
                 <div>
                    <span className={`block font-bold text-sm ${incomeType === 'Empresario' ? 'text-brand-900 dark:text-brand-100' : 'text-gray-700 dark:text-gray-300'}`}>Empresário / MEI</span>
                    <span className="text-xs text-gray-500">Donos de empresa com CNPJ</span>
                 </div>
              </button>

              <button 
                onClick={() => setIncomeType('Autonomo')}
                className={`w-full flex items-center p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${incomeType === 'Autonomo' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-brand-200'}`}
              >
                 <div className={`p-2 rounded-full mr-3 ${incomeType === 'Autonomo' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}><Briefcase size={20} /></div>
                 <div>
                    <span className={`block font-bold text-sm ${incomeType === 'Autonomo' ? 'text-brand-900 dark:text-brand-100' : 'text-gray-700 dark:text-gray-300'}`}>Autônomo / Liberal</span>
                    <span className="text-xs text-gray-500">Profissional sem vínculo CLT</span>
                    <span className="ml-1 inline-block"><InfoTooltip text="Necessário apresentar DECORE ou Extratos Bancários para comprovar a movimentação." /></span>
                 </div>
              </button>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                       Usa FGTS? 
                       <InfoTooltip text="Se ativado, pedirá extrato analítico do FGTS e cópia da carteira de trabalho." />
                    </span>
                    <button 
                        onClick={() => setUseFgts(!useFgts)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${useFgts ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${useFgts ? 'translate-x-5' : ''}`}></div>
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* STEP 3: SEND */}
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col ${selectedLeadId ? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700 opacity-50'}`}>
           <div className={`absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 backdrop-blur-[1px] rounded-2xl transition-opacity duration-300 flex items-center justify-center ${selectedLeadId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <span className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">Aguardando Passo 1</span>
           </div>

           <div className="flex items-center gap-3 mb-6">
              <StepNumber number={3} active={!!selectedLeadId} completed={false} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Envie o Link</h3>
           </div>

           <div className="flex-1 flex flex-col justify-between">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resumo do Pedido</h4>
                 <ul className="space-y-2">
                    <li className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><Check size={12} className="text-green-500"/> Documentos Pessoais</li>
                    <li className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><Check size={12} className="text-green-500"/> Comprovante de Renda ({incomeType})</li>
                    <li className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                       <Check size={12} className={useFgts ? "text-green-500" : "text-gray-300"}/> 
                       <span className={useFgts ? "" : "text-gray-400 line-through"}>Documentação FGTS</span>
                    </li>
                    <li className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><Check size={12} className="text-green-500"/> Matrícula do Imóvel <InfoTooltip text="Certidão atualizada do cartório que comprova a propriedade." /></li>
                 </ul>
              </div>

              <div>
                 <button
                    onClick={handleGenerateAndSend}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-xl shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
                 >
                    <Send size={20} />
                    Gerar Link e Enviar WhatsApp
                 </button>
                 <p className="text-xs text-gray-500 text-center leading-relaxed px-2">
                    O cliente receberá um portal exclusivo para tirar fotos dos documentos. Você será avisado assim que ele enviar.
                 </p>
              </div>
           </div>
        </div>

      </div>

      {/* --- TRACKING TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gray-50 dark:bg-gray-900/30">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History size={20} className="text-brand-600" />
                  Acompanhamento de Envios
              </h2>

              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                  <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500'}`}>Todos</button>
                  <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}>Pendentes</button>
                  <button onClick={() => setFilterStatus('completed')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === 'completed' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>Concluídos</button>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Progresso da Pasta</th>
                          <th className="px-6 py-4">Última Interação</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {activeRequests.length === 0 ? (
                          <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                  <div className="flex flex-col items-center gap-2">
                                      <Search size={24} className="opacity-20" />
                                      <p>Nenhuma solicitação encontrada.</p>
                                  </div>
                              </td>
                          </tr>
                      ) : (
                          activeRequests.map(lead => {
                              const progress = calculateProgress(lead);
                              const isComplete = progress === 100;
                              const progressColor = getProgressColor(progress);

                              return (
                                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs">
                                                  {lead.name.substring(0,2).toUpperCase()}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-gray-900 dark:text-white text-sm">{lead.name}</p>
                                                  <p className="text-xs text-gray-500">{lead.propertyTitle}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 w-1/4">
                                          <div className="flex justify-between mb-1">
                                              <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                                                  {isComplete ? 'Pasta Completa' : `${progress}% Recebido`}
                                              </span>
                                              {isComplete && <CheckCircle2 size={14} className="text-green-500" />}
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                              <div className={`h-2 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }}></div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-sm">
                                          <div className="flex flex-col">
                                              {getInteractionText(lead)}
                                              <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                  <Clock size={10} /> Link enviado {getTimeAgo(lead.lastRequestDate)}
                                              </span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center justify-end gap-2">
                                              {!isComplete && (
                                                <button 
                                                    onClick={() => handleSendReminder(lead)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-medium transition-colors"
                                                    title="Enviar lembrete amigável no WhatsApp"
                                                >
                                                    <MessageCircle size={14} /> Lembrete
                                                </button>
                                              )}
                                              
                                              {isComplete ? (
                                                  <button 
                                                      onClick={() => handleGeneratePdf(lead)}
                                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold transition-colors"
                                                  >
                                                      <FileText size={14} /> Gerar PDF
                                                  </button>
                                              ) : (
                                                  <button 
                                                      onClick={() => handleResend(lead)}
                                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg text-xs transition-colors"
                                                      title="Carregar dados para reenvio"
                                                  >
                                                      <RotateCw size={14} />
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};