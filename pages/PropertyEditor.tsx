import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, X, Image as ImageIcon, Video, Loader2, UploadCloud, Wand2, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storage';
import { Property, PropertyStatus, MediaItem } from '../types';

const EMPTY_PROPERTY: Omit<Property, 'id' | 'createdAt'> = {
  title: '',
  price: 0,
  displayPrice: '',
  city: '',
  neighborhood: '',
  lat: '',
  lng: '',
  status: PropertyStatus.AVAILABLE,
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
  viewersMin: 15,
  viewersMax: 40
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-27838eb2db69?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
];

export const PropertyEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Property | any>(EMPTY_PROPERTY);
  const [newFeature, setNewFeature] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Media Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      if (id) {
        try {
          const existing = await storageService.getPropertyById(id);
          if (existing) {
            setFormData(existing);
          } else {
            navigate('/');
          }
        } catch (err) {
          setError('Erro ao carregar imóvel.');
        }
      }
    };
    loadProperty();
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
    const formatted = numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

  const addMedia = (url: string, type: 'image' | 'video' = 'image') => {
    if (url.trim()) {
      const item: MediaItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: type,
        url: url.trim()
      };
      setFormData((prev: any) => ({ ...prev, media: [...prev.media, item] }));
    }
  };

  const handleManualAddMedia = () => {
    if (newMediaUrl.trim()) {
      addMedia(newMediaUrl, newMediaType);
      setNewMediaUrl('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
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

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    let processed = 0;
    const total = files.length;

    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              const type = file.type.startsWith('video/') ? 'video' : 'image';
              addMedia(event.target.result as string, type);
            }
            processed++;
            setUploadProgress(Math.round((processed / total) * 100));
            setTimeout(resolve, 300);
          };
          reader.readAsDataURL(file);
        });
      }
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    }, 500);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files: File[] = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      await processFiles(files);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generatePlaceholders = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    let step = 0;
    const interval = setInterval(() => {
      step += 25;
      setUploadProgress(step);
      if (step >= 100) {
        clearInterval(interval);
        // Add 3 random images
        const shuffled = [...PLACEHOLDER_IMAGES].sort(() => 0.5 - Math.random());
        shuffled.slice(0, 3).forEach(url => addMedia(url, 'image'));
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);
      }
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const payload: Property = {
      ...formData,
      // If we have an ID, keep it, otherwise let Supabase generate (or handle empty ID in service)
      id: id || formData.id, 
      createdAt: formData.createdAt || Date.now()
    };
    
    try {
      await storageService.saveProperty(payload);
      setLoading(false);
      navigate('/');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Ocorreu um erro ao salvar o imóvel.');
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const cardClass = "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors";
  const sectionTitleClass = "text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2";

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{id ? 'Editar Imóvel' : 'Novo Imóvel'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Preencha as informações abaixo para publicar no site.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
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
              <label className={labelClass}>Preço Exibição (Automático)</label>
              <input disabled name="displayPrice" value={formData.displayPrice} className={`${inputClass} bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500`} />
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
              <label className={labelClass}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                {Object.values(PropertyStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

             <div className="flex items-center gap-3 py-4">
              <input type="checkbox" id="simulador" name="simulador" checked={formData.simulador} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
              <label htmlFor="simulador" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Habilitar Simulador Financeiro neste imóvel?</label>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mídia (Fotos e Vídeos)</h2>
            <button 
              type="button" 
              onClick={generatePlaceholders} 
              disabled={isUploading}
              className="text-sm flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50"
            >
              <Wand2 size={16} />
              Gerar via IA
            </button>
          </div>
          
          {/* Enhanced Drag and Drop Zone / Mobile Click Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative mb-6 border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer group select-none
              ${isDragging 
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                : uploadSuccess 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50'
              }
            `}
          >
            <input 
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 size={40} className="text-brand-600 animate-spin mb-3" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">Processando arquivos...</p>
                <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{uploadProgress}% concluído</p>
              </div>
            ) : uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-green-700 dark:text-green-400 font-bold text-lg mb-1">Sucesso!</h3>
                <p className="text-green-600 dark:text-green-500 text-sm">Mídia adicionada corretamente.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-1">Toque para selecionar ou arraste arquivos</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Suporta imagens (JPG, PNG) e vídeos (MP4)</p>
                
                <button 
                  type="button" 
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 md:hidden pointer-events-none"
                >
                  Selecionar da Galeria
                </button>
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 hidden md:block">ou cole URL abaixo</p>
              </div>
            )}
            
            {!isUploading && !uploadSuccess && (
              <div className="mt-4 flex flex-col md:flex-row gap-2 max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
                <select 
                  value={newMediaType} 
                  onChange={(e) => setNewMediaType(e.target.value as any)} 
                  className="px-3 py-2 border dark:border-gray-600 rounded-md outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="image">Imagem (URL)</option>
                  <option value="video">Vídeo (URL)</option>
                </select>
                <input 
                  value={newMediaUrl} 
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-md outline-none focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  placeholder={newMediaType === 'image' ? "https://..." : "https://..."} 
                />
                <button type="button" onClick={handleManualAddMedia} className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-600">
                  Adicionar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {formData.media.map((item: MediaItem) => (
               <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                 {item.type === 'image' ? (
                   <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                 ) : (
                   <video src={item.url} className="w-full h-full object-cover" />
                 )}
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {item.type === 'video' ? <Video className="text-white" /> : <ImageIcon className="text-white" />}
                    <button type="button" onClick={() => removeMedia(item.id)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
             ))}
             {formData.media.length === 0 && !isUploading && (
                <div className="col-span-full py-8 text-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  Nenhuma mídia adicionada
                </div>
             )}
          </div>
        </div>

        {/* Marketing */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Marketing e Prova Social</h2>
          
          <div className="mb-4">
            <label className={labelClass}>Mensagem do WhatsApp (Pré-definida)</label>
            <input name="whatsappMessage" value={formData.whatsappMessage} onChange={handleChange} className={inputClass} placeholder="Olá, gostaria de saber mais sobre..." />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Visitantes Simultâneos (Min)</label>
              <input type="number" name="viewersMin" value={formData.viewersMin} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Visitantes Simultâneos (Max)</label>
              <input type="number" name="viewersMax" value={formData.viewersMax} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-4 z-40 transition-colors">
           <button type="button" onClick={() => navigate('/')} className="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
           <button 
             type="submit" 
             disabled={loading || isUploading}
             className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
             {id ? 'Salvar Alterações' : 'Publicar Imóvel'}
           </button>
        </div>
      </form>
    </div>
  );
};