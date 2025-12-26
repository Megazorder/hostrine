import React, { useEffect, useState, useRef } from 'react';
import { Save, User, Smartphone, BadgeCheck, MessageSquare, Loader2, Upload, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storage';
import { AdminProfile } from '../types';

export const ProfileEditor: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
        try {
            const data = await storageService.getProfile();
            setProfile(data);
        } catch (err) {
            setError('Erro ao carregar perfil.');
        }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfile({ ...profile, photoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      try {
        await storageService.saveProfile(profile);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || 'Erro ao salvar perfil.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!profile) return null;

  const inputClass = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";
  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie as informações que aparecem no topo do site.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-6 transition-colors">
        
        {/* Photo Preview */}
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
           <div className="relative group cursor-pointer" onClick={triggerFileInput}>
             <img 
               src={profile.photoUrl || 'https://via.placeholder.com/150'} 
               alt="Preview" 
               className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md mb-4 transition-transform group-hover:scale-105"
             />
             <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity mb-4">
               <Upload className="text-white" size={24} />
             </div>
           </div>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept="image/*" 
             className="hidden" 
           />

           <button 
             type="button"
             onClick={triggerFileInput}
             className="mb-4 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
           >
             Alterar foto de perfil
           </button>

           <div className="w-full">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">Ou cole a URL da imagem</label>
             <input 
                name="photoUrl" 
                value={profile.photoUrl} 
                onChange={handleChange} 
                className={`${inputClass} text-center text-sm`}
                placeholder="https://..."
              />
           </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              <User size={16} /> Nome Completo
            </label>
            <input required name="name" value={profile.name} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              <BadgeCheck size={16} /> CRECI
            </label>
            <input required name="creci" value={profile.creci} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              <Smartphone size={16} /> WhatsApp (Apenas números, com DDD)
            </label>
            <input required name="whatsapp" value={profile.whatsapp} onChange={handleChange} className={inputClass} placeholder="5511999999999" />
          </div>

          <div>
            <label className={labelClass}>
              <MessageSquare size={16} /> Mensagem Padrão (Cabeçalho)
            </label>
            <textarea name="headerMessage" value={profile.headerMessage} onChange={handleChange} rows={3} className={inputClass} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Essa mensagem será preenchida automaticamente quando o cliente clicar no WhatsApp do topo do site.</p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
           {success && <span className="text-green-600 dark:text-green-400 font-medium text-sm animate-pulse">Perfil atualizado com sucesso!</span>}
           {!success && <span></span>}
           <button 
             type="submit" 
             disabled={loading}
             className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
           >
             {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
             Salvar Perfil
           </button>
        </div>

      </form>
    </div>
  );
};