import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, X, Image as ImageIcon, Loader2, UploadCloud, CheckCircle2, Trash2, Tag, Eye, EyeOff, FileText, Lock, MessageCircleQuestion, Plus } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { Property, PropertyStatus, MediaItem, PropertyFAQ } from '../types';

const EMPTY_PROPERTY: Omit<Property, 'id' | 'createdAt'> = {
  title: '',
  price: 0,
  displayPrice: '',
  city: '',
  neighborhood: '',
  lat: '',
  lng: '',
  status: PropertyStatus.DRAFT,
  type: 'Apartamento',
  description: '',
  features: [],
  bedrooms: 0,
  bathrooms: 0,
  suites: 0,
  parking: 0,
  area: 0,
  whatsappMessage: '',
  media: [],
  simulador: false,
  viewersMin: 113,
  viewersMax: 284,
  belowMarketPrice: false,
  enableLeadCapture: false,
  faq: []
};

export const PropertyEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Property | any>(EMPTY_PROPERTY);
  const [newFeature, setNewFeature] = useState('');
  
  // Media Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      propertyService.getProperty(id).then(existing => {
        if (existing) {
          setFormData({ ...EMPTY_PROPERTY, ...existing });
        } else {
          navigate('/');
        }
      });
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = parseFloat(value) || 0;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;

    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseFloat(e.target.value) || 0;
    // Format without decimals
    const formatted = numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    setFormData((prev: any) => ({ ...prev, price: numeric, displayPrice: formatted }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev: any) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev: any) => ({ ...prev, features: prev.features.filter((_: any, i: number) => i !== index) }));
  };

  // FAQ Management
  const addFaq = () => {
    setFormData((prev: any) => ({
      ...prev,
      faq: [...(prev.faq || []), { question: '', answer: '' }]
    }));
  };

  const updateFaq = (index: number, field: keyof PropertyFAQ, value: string) => {
    setFormData((prev: any) => {
      const newFaq = [...(prev.faq || [])];
      newFaq[index] = { ...newFaq[index], [field]: value };
      return { ...prev, faq: newFaq };
    });
  };

  const removeFaq = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      faq: prev.faq.filter((_: any, i: number) => i !== index)
    }));
  };

  const addMedia = (url: string) => {
    if (url.trim()) {
      const item: MediaItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        url: url.trim()
      };
      setFormData((prev: any) => ({ ...prev, media: [...prev.media, item] }));
    }
  };

  const removeMedia = (mediaId: string) => {
    setFormData((prev: any) => ({ ...prev, media: prev.media.filter((m: MediaItem) => m.id !== mediaId) }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files: File[] = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Filter only images
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert("Apenas imagens e GIFs são permitidos.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let processed = 0;
    const total = imageFiles.length;

    for (const file of imageFiles) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            addMedia(event.target.result as string);
          }
          processed++;
          setUploadProgress(Math.round((processed / total) * 100));
          setTimeout(resolve, 200);
        };
        reader.readAsDataURL(file);
      });
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setLoading(true);
    
    const payload: Property = {
      ...formData,
      status: publish ? PropertyStatus.AVAILABLE : formData.status || PropertyStatus.DRAFT
    };
    if (id) {
        payload.id = id;
    } else {
        // Remove random string ID so propertyService triggers Supabase Insert
        payload.id = ''; 
    }
    
    const saved = await propertyService.saveProperty(payload);
    setLoading(false);
    
    if (!saved) {
       alert("Erro ao salvar imóvel. Verifique o console e a estrutura da tabela 'imoveis' no Supabase.");
       return;
    }
    
    navigate('/');
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const cardClass = "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors";
  const sectionTitleClass = "text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2";

  return (
    <div className="max-w-5xl mx-auto pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{id ? 'Editar Imóvel' : 'Novo Imóvel'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Preencha as informações abaixo para publicar no site.</p>
        </div>
      </div>

      <form className="space-y-8">
        {/* Basic Info */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Título do Anúncio</label>
              <input required name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Ex: Apartamento de Alto Padrão no Jardins" />
            </div>
            
            <div>
              <label className={labelClass}>Preço Numérico (Para ordenação)</label>
              <input required type="number" name="price" value={formData.price} onChange={handlePriceChange} className={inputClass} />
            </div>

            <div>
               <label className={labelClass}>Preço Exibição</label>
               <input disabled name="displayPrice" value={formData.displayPrice} className={`${inputClass} bg-gray-50 dark:bg-gray-900 text-gray-500`} />
            </div>

            <div>
              <label className={labelClass}>Tipo de Imóvel</label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Cobertura">Cobertura</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
                <option value="Flat">Flat</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Status Atual</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                {Object.values(PropertyStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3">
              <input type="checkbox" id="simulador" name="simulador" checked={formData.simulador} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
              <label htmlFor="simulador" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Habilitar Simulador Financeiro</label>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="checkbox" id="enableLeadCapture" name="enableLeadCapture" checked={formData.enableLeadCapture || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
              <div className="flex items-center gap-2">
                 <label htmlFor="enableLeadCapture" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Exigir formulário para ver Simulador</label>
                 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={10} /> Lead Magnet</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="belowMarketPrice" name="belowMarketPrice" checked={formData.belowMarketPrice || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
              <div className="flex items-center gap-2">
                 <label htmlFor="belowMarketPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Destacar "Preço abaixo do mercado"</label>
                 <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Tag size={10} /> Destaque</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Localização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Cidade</label>
              <input required name="city" value={formData.city} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bairro</label>
              <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Latitude</label>
              <input name="lat" value={formData.lat} onChange={handleChange} className={inputClass} placeholder="-23.550520" />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input name="lng" value={formData.lng} onChange={handleChange} className={inputClass} placeholder="-46.633308" />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Detalhes e Comodidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div><label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Quartos</label><input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={inputClass} /></div>
            <div><label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Suítes</label><input type="number" name="suites" value={formData.suites} onChange={handleChange} className={inputClass} /></div>
            <div><label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Banheiros</label><input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className={inputClass} /></div>
            <div><label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Vagas</label><input type="number" name="parking" value={formData.parking} onChange={handleChange} className={inputClass} /></div>
            <div><label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Área (m²)</label><input type="number" name="area" value={formData.area} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="mb-6">
             <label className={labelClass}>Descrição Completa</label>
             <textarea rows={5} name="description" value={formData.description} onChange={handleChange} className={inputClass}></textarea>
          </div>

          <div>
             <label className={labelClass}>Características (Tags)</label>
             <div className="flex gap-2 mb-3">
               <input 
                 value={newFeature} 
                 onChange={(e) => setNewFeature(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                 className={inputClass}
                 placeholder="Ex: Piscina Aquecida" 
               />
               <button type="button" onClick={addFeature} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 rounded-lg font-medium text-gray-700 dark:text-gray-200">Adicionar</button>
             </div>
             <div className="flex flex-wrap gap-2">
               {formData.features.map((feat: string, idx: number) => (
                 <span key={idx} className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-brand-100 dark:border-brand-800">
                   {feat}
                   <button type="button" onClick={() => removeFeature(idx)} className="hover:text-brand-900 dark:hover:text-brand-100"><X size={14} /></button>
                 </span>
               ))}
             </div>
          </div>
        </div>

        {/* Media */}
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Galeria de Imagens</h2>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Apenas Imagens/GIFs</span>
          </div>
          
          {/* Drag and Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative mb-6 border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer group
              ${isDragging 
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                : uploadSuccess 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50'
              }
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              className="hidden" 
              accept="image/png, image/jpeg, image/gif, image/webp" 
              multiple 
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 size={40} className="text-brand-600 animate-spin mb-3" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">Processando imagens...</p>
                <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-green-700 dark:text-green-400 font-bold text-lg mb-1">Upload Concluído!</h3>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-1">Toque ou arraste fotos aqui</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">JPG, PNG, GIF</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {formData.media.map((item: MediaItem) => (
               <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                 <img src={item.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'} alt="Media" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => removeMedia(item.id)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircleQuestion size={20} />
              Perguntas Frequentes (FAQ)
            </h2>
            <button 
              type="button" 
              onClick={addFaq}
              className="text-sm flex items-center gap-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
            >
              <Plus size={16} /> Adicionar Pergunta
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 leading-relaxed">
            <span className="font-bold text-gray-700 dark:text-gray-300">Opcional.</span> Adicione perguntas frequentes para antecipar dúvidas dos clientes. Elas serão exibidas ao final da página do imóvel.
          </p>
          
          <div className="space-y-4">
            {(!formData.faq || formData.faq.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">Nenhuma pergunta frequente cadastrada.</p>
            )}
            
            {formData.faq && formData.faq.map((item: PropertyFAQ, idx: number) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 relative group">
                <button 
                  type="button"
                  onClick={() => removeFaq(idx)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Pergunta</label>
                    <input 
                      type="text" 
                      value={item.question} 
                      onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                      placeholder="Ex: Aceita permuta?"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-gray-500 dark:text-gray-400 font-bold mb-1 block">Resposta</label>
                    <textarea 
                      rows={2}
                      value={item.answer} 
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                      placeholder="Ex: Sim, estudamos permuta..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Marketing</h2>
          <div className="mb-4">
            <label className={labelClass}>Mensagem do WhatsApp</label>
            <input name="whatsappMessage" value={formData.whatsappMessage} onChange={handleChange} className={inputClass} placeholder="Olá, gostaria de saber mais sobre..." />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className={labelClass}>Visitantes (Min)</label><input type="number" name="viewersMin" value={formData.viewersMin} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Visitantes (Max)</label><input type="number" name="viewersMax" value={formData.viewersMax} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>

        {/* Actions Bottom Bar */}
        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 transition-colors">
           <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
               <button 
                 type="button" 
                 onClick={() => navigate('/')} 
                 className="px-4 py-2.5 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
               >
                 <X size={18} />
                 <span className="hidden sm:inline">Cancelar</span>
               </button>

               <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={loading || isUploading}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <Save size={18} />
                    Salvar
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={loading || isUploading}
                    className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 flex items-center gap-2 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    <span className="hidden sm:inline">Salvar e</span> Publicar
                  </button>
               </div>
           </div>
        </div>
      </form>
    </div>
  );
};