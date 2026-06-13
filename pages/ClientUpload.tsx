import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { storageService } from '../services/storage';
import { Lead, ChecklistItemState, IncomeType } from '../types';
import { UploadCloud, CheckCircle2, Camera, ChevronRight, Check, AlertCircle, FileText, Loader2 } from 'lucide-react';

export const ClientUpload: React.FC = () => {
  const { id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [profile, setProfile] = useState(storageService.getProfile());
  const [loading, setLoading] = useState(true);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      const leads = storageService.getLeads();
      const found = leads.find(l => l.id === id);
      if (found) {
        setLead(found);
      }
      setLoading(false);
    }
  }, [id]);

  // Compress Image Logic (Client Side)
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Resize to max 1024px width
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compress to JPEG 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && lead && uploadingItem) {
      const file = e.target.files[0];
      
      // Basic compression/reading
      let fileDataUrl = '';
      if (file.type.startsWith('image/')) {
        fileDataUrl = await compressImage(file);
      } else {
        // PDF or others, raw base64 (not recommended for huge files in localStorage, but ok for demo)
        const reader = new FileReader();
        fileDataUrl = await new Promise((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newItemState: ChecklistItemState = {
        checked: true,
        fileUrl: fileDataUrl,
        fileName: file.name,
        uploadedAt: Date.now()
      };

      const updatedLead = {
        ...lead,
        checklist: {
          ...lead.checklist,
          [uploadingItem]: newItemState
        },
        hasNewUploads: true // Notify broker
      };

      storageService.updateLead(updatedLead);
      setLead(updatedLead);
      setUploadingItem(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (itemId: string) => {
    setUploadingItem(itemId);
    fileInputRef.current?.click();
  };

  // Reusing Logic from Leads.tsx (Simplified)
  const getIncomeItems = (type?: IncomeType) => {
    switch (type) {
      case 'CLT': return [{ id: 'doc_inc_holerites', label: '3 Últimos Holerites' }];
      case 'Empresario': return [{ id: 'doc_inc_social', label: 'Contrato Social / MEI' }, { id: 'doc_inc_bank_pj', label: 'Extratos Bancários PJ' }, { id: 'doc_inc_bank_pf', label: 'Extratos Bancários PF' }];
      case 'Autonomo': return [{ id: 'doc_inc_bank_pf', label: 'Extratos Bancários (6 meses)' }, { id: 'doc_inc_decore', label: 'DECORE' }];
      default: return [];
    }
  };

  const checklistGroups = useMemo(() => {
    if (!lead) return [];
    return [
      {
        title: 'Documentos Pessoais',
        items: [
          { id: 'doc_personal_id', label: 'RG/CPF ou CNH' },
          { id: 'doc_personal_status', label: 'Certidão Nascimento/Casamento' },
          { id: 'doc_personal_address', label: 'Comprovante Residência' },
          { id: 'doc_personal_ir', label: 'Imposto de Renda + Recibo' },
        ]
      },
      {
        title: 'Renda',
        items: getIncomeItems(lead.incomeType)
      },
      {
        title: 'FGTS (Opcional)',
        items: [
            { id: 'doc_fgts_extract', label: 'Extrato do FGTS' },
            { id: 'doc_fgts_ctps', label: 'Carteira de Trabalho (CTPS)' },
        ]
      }
    ].filter(g => g.items.length > 0);
  }, [lead]);

  const progress = useMemo(() => {
    if (!lead) return 0;
    const allItems = checklistGroups.flatMap(g => g.items);
    if (allItems.length === 0) return 0;
    const checked = allItems.filter(i => lead.checklist?.[i.id]?.checked).length;
    return Math.round((checked / allItems.length) * 100);
  }, [lead, checklistGroups]);

  const handleFinish = () => {
    setSuccessMsg(true);
    // Simulate notification logic
    setTimeout(() => {
       alert("Obrigado! O corretor foi notificado.");
    }, 500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-600" /></div>;
  
  if (!lead) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
       <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
       <h1 className="text-xl font-bold text-gray-800">Link Inválido ou Expirado</h1>
       <p className="text-gray-500 mt-2">Entre em contato com seu corretor.</p>
    </div>
  );

  if (successMsg) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6 text-center animate-fadeIn">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
             <CheckCircle2 className="text-green-600 w-10 h-10" />
         </div>
         <h1 className="text-2xl font-bold text-green-800 mb-2">Envio Concluído!</h1>
         <p className="text-green-700">Seus documentos foram enviados com segurança para {profile.name}.</p>
         <p className="text-sm text-green-600 mt-8">Você pode fechar esta página.</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
           <img src={profile?.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'} className="w-12 h-12 rounded-full object-cover border-2 border-brand-100" alt="Corretor" />
           <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Envio Seguro Para</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{profile.name}</h1>
           </div>
        </div>
        <div className="bg-gray-100 rounded-full h-2 w-full overflow-hidden">
           <div className="bg-green-500 h-full transition-all duration-500" style={{width: `${progress}%`}}></div>
        </div>
        <p className="text-right text-xs font-bold text-gray-500 mt-1">{progress}% Concluído</p>
      </header>

      <main className="p-6 space-y-8">
         <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
               <p className="text-sm text-blue-800 font-medium">Olá, {lead.name.split(' ')[0]}!</p>
               <p className="text-xs text-blue-700 mt-1">Por favor, envie fotos legíveis ou PDFs dos documentos abaixo para agilizar sua análise de crédito.</p>
            </div>
         </div>

         {/* Hidden File Input */}
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,.pdf"
            capture="environment" // Opens camera on mobile
         />

         <div className="space-y-6">
            {checklistGroups.map((group, idx) => (
               <div key={idx}>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">{group.title}</h3>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                     {group.items.map(item => {
                        const status = lead.checklist?.[item.id] || { checked: false };
                        return (
                           <div 
                              key={item.id} 
                              onClick={() => triggerUpload(item.id)}
                              className={`p-4 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer ${status.checked ? 'bg-green-50/50' : ''}`}
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status.checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {status.checked ? <Check size={20} /> : <Camera size={20} />}
                                 </div>
                                 <div>
                                    <p className={`font-medium ${status.checked ? 'text-green-800' : 'text-gray-900'}`}>{item.label}</p>
                                    {status.checked && <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><FileText size={10} /> {status.fileName || 'Enviado'}</p>}
                                    {!status.checked && <p className="text-xs text-gray-400 mt-0.5">Toque para enviar</p>}
                                 </div>
                              </div>
                              <ChevronRight size={20} className="text-gray-300" />
                           </div>
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
         <button 
           onClick={handleFinish}
           disabled={progress === 0}
           className="w-full bg-brand-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
         >
            {progress === 100 ? 'Concluir Tudo' : 'Enviar Documentos'}
         </button>
      </div>
    </div>
  );
};