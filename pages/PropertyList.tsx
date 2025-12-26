import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, MapPin, BedDouble, Bath, Square, Plus, ArrowUpDown, ArrowUp, ArrowDown, Globe } from 'lucide-react';
import { storageService } from '../services/storage';
import { Property, PropertyStatus } from '../types';

type SortKey = 'createdAt' | 'price' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

export const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    const data = await storageService.getProperties();
    setProperties(data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      await storageService.deleteProperty(id);
      loadProperties();
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    const currentProfile = await storageService.getProfile();
    const rawProperties = await storageService.getProperties();

    // Serialize data for injection into the generated HTML
    const profileJson = JSON.stringify(currentProfile);
    const propertiesJson = JSON.stringify(rawProperties);

    const htmlContent = `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  
  <title>Luxe Estate | ${currentProfile.name}</title>
  <meta name="description" content="Imóveis de alto padrão.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Luxe Estate" id="og-title">
  <meta property="og:description" content="Curadoria exclusiva de imóveis." id="og-desc">
  <meta property="og:image" content="" id="og-image">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet">
  
  <style>
    body { font-family: 'Space Grotesk', sans-serif; background: #0f172a; color: white; overflow-x: hidden; }
    .hide-scroll::-webkit-scrollbar { display: none; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    .property-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .property-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .badge { backdrop-filter: blur(8px); background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); }
    .top-bar-glass { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); }
    .slider-arrow { opacity: 0; transition: opacity 0.3s; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
    .property-card:hover .slider-arrow { opacity: 1; }
    .page-transition { animation: fadeIn 0.4s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .slide-in-bottom { animation: slideInBottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
    @keyframes slideInBottom { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  </style>
</head>
<body class="pt-16">

  <nav class="fixed top-0 left-0 w-full z-50 top-bar-glass px-4 py-3 flex justify-between items-center">
    <div class="flex items-center gap-3 cursor-pointer" onclick="closeProperty()">
        <div class="w-10 h-10 rounded-full p-[1px] bg-gradient-to-tr from-blue-500 to-cyan-400 relative">
            <img id="topbar-img" src="https://via.placeholder.com/150?text=..." 
                 class="w-full h-full rounded-full object-cover border border-[#0f172a]" alt="Perfil">
        </div>
        <div>
            <div class="flex items-center gap-1">
                <h1 id="topbar-name" class="text-sm font-bold text-white leading-tight">Carregando...</h1>
                <svg class="w-3 h-3 text-blue-400 fill-current" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.114-1.32.314C14.733 2.47 13.48 1.5 12 1.5c-1.48 0-2.733.97-3.452 2.316-.4-.2-.85-.314-1.32-.314-2.108 0-3.818 1.788-3.818 3.998 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.998 3.818 3.998.47 0 .92-.114 1.32-.314.72 1.347 1.973 2.316 3.452 2.316 1.48 0 2.733-.97 3.452-2.316.4.2.85.314 1.32.314 2.108 0 3.818-1.788 3.818-3.998 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zM13 17l-5-5 1.41-1.41L13 14.17l7.59-7.59L22 8l-9 9z"/></svg>
            </div>
            <p id="topbar-creci" class="text-[10px] text-blue-400 font-bold tracking-wider">...</p>
        </div>
    </div>
    
    <a id="topbar-wa" href="#" target="_blank" 
       class="bg-white hover:bg-gray-100 text-green-700 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg">
        <svg class="w-4 h-4 fill-green-700" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        <span class="hidden sm:inline">WhatsApp</span>
    </a>
  </nav>

  <div id="home-view">
      <header class="relative min-h-[60vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        <div class="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80" onerror="this.src='https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80'" class="w-full h-full object-cover opacity-30">
          <div class="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
        </div>
        
        <div class="relative z-10 max-w-3xl mx-auto pt-4">
           <div class="relative w-32 h-32 mx-auto mb-6">
               <div class="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-2xl">
                   <img id="hero-img" src="https://via.placeholder.com/150?text=..." 
                        class="w-full h-full rounded-full object-cover border-4 border-[#0f172a]" alt="Foto Corretor">
               </div>
               <div class="absolute bottom-1 right-1 bg-[#0f172a] rounded-full p-1">
                   <svg class="w-6 h-6 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.114-1.32.314C14.733 2.47 13.48 1.5 12 1.5c-1.48 0-2.733.97-3.452 2.316-.4-.2-.85-.314-1.32-.314-2.108 0-3.818 1.788-3.818 3.998 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.998 3.818 3.998.47 0 .92-.114 1.32-.314.72 1.347 1.973 2.316 3.452 2.316 1.48 0 2.733-.97 3.452-2.316.4.2.85.314 1.32.314 2.108 0 3.818-1.788 3.818-3.998 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zM13 17l-5-5 1.41-1.41L13 14.17l7.59-7.59L22 8l-9 9z"/></svg>
               </div>
           </div>
           
           <h1 id="hero-name" class="text-4xl md:text-6xl font-bold mb-2 tracking-tight text-white">...</h1>
           <p id="hero-creci" class="text-sm uppercase tracking-[0.2em] text-blue-400 font-bold mb-6">...</p>
           <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">Curadoria exclusiva de imóveis.</p>
        </div>
      </header>

      <main id="catalogo" class="py-10 pb-24 max-w-[1400px] mx-auto">
        <div id="dynamicContainer"></div>
      </main>
  </div>

  <div id="property-view" class="hidden min-h-screen bg-[#0f172a] page-transition pb-20 relative">
      
      <div id="viewer-notification" class="hidden fixed bottom-6 left-6 z-40 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-[80vw]">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
          <p class="text-xs text-white tracking-wide" id="viewer-text"></p>
      </div>

      <div class="max-w-6xl mx-auto px-4 py-6">
          <button onclick="closeProperty()" class="text-gray-400 hover:text-white flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest">
              ← Voltar para Imóveis
          </button>

          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-gray-800 pb-8">
              <div>
                  <div class="flex items-center gap-3 mb-3">
                     <span id="detail-bairro" class="bg-blue-600/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">BAIRRO</span>
                     <span id="detail-status"></span>
                  </div>
                  <h1 id="detail-title" class="text-3xl md:text-5xl font-bold text-white mb-2">Título</h1>
                  <p class="text-gray-400 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span id="detail-location">Localização</span>
                  </p>
              </div>
              <div class="flex flex-col items-end gap-3">
                  <div class="text-right">
                      <p class="text-gray-400 text-xs uppercase tracking-widest mb-1">Valor de Investimento</p>
                      <p id="detail-price" class="text-4xl font-bold text-white">R$ 0,00</p>
                  </div>
              </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="lg:col-span-2 space-y-8">
                  <div class="bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative group">
                       <div id="detail-main-media" class="w-full h-[300px] md:h-[500px] flex items-center justify-center bg-gray-900"></div>
                       <button onclick="prevDetailSlide()" class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-sm transition">‹</button>
                       <button onclick="nextDetailSlide()" class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-sm transition">›</button>
                       <div id="detail-counter" class="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm">1 / 1</div>
                  </div>
                  <div id="detail-thumbs" class="flex gap-3 overflow-x-auto pb-2 hide-scroll"></div>

                  <div class="bg-slate-800/50 p-8 rounded-2xl border border-white/5">
                      <h3 class="text-xl font-bold mb-6">Sobre o Imóvel</h3>
                      <p id="detail-desc" class="text-gray-300 leading-relaxed text-lg mb-8">Descrição...</p>
                      <h4 class="text-sm font-bold uppercase text-gray-500 tracking-widest mb-4">Características</h4>
                      <div id="detail-features" class="grid grid-cols-2 md:grid-cols-3 gap-4"></div>
                  </div>
                  
                  <div class="bg-slate-800/50 p-8 rounded-2xl border border-white/5">
                      <h3 class="text-xl font-bold mb-6">Localização Aproximada</h3>
                      <div class="w-full h-64 bg-slate-700 rounded-xl overflow-hidden relative">
                          <iframe id="map-frame" width="100%" height="100%" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                          <div class="absolute bottom-0 left-0 w-full h-5 backdrop-blur-[3px] z-10 border-t border-white/5 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
                      </div>
                  </div>
              </div>

              <div class="lg:col-span-1">
                  <div class="sticky top-24 space-y-6">
                      
                      <div class="bg-slate-800 p-6 rounded-2xl border border-white/10">
                          <h3 class="text-sm font-bold uppercase text-gray-400 mb-4">Resumo</h3>
                          <div class="grid grid-cols-2 gap-4">
                              <div class="bg-slate-900 p-3 rounded-lg text-center"><span id="detail-beds" class="block text-2xl font-bold text-white">0</span><span class="text-xs text-gray-500 uppercase">Quartos</span></div>
                              <div class="bg-slate-900 p-3 rounded-lg text-center"><span id="detail-suites" class="block text-2xl font-bold text-white">0</span><span class="text-xs text-gray-500 uppercase">Suítes</span></div>
                              <div class="bg-slate-900 p-3 rounded-lg text-center"><span id="detail-baths" class="block text-2xl font-bold text-white">0</span><span class="text-xs text-gray-500 uppercase">Banheiros</span></div>
                              <div class="bg-slate-900 p-3 rounded-lg text-center"><span id="detail-cars" class="block text-2xl font-bold text-white">0</span><span class="text-xs text-gray-500 uppercase">Vagas</span></div>
                              <div class="bg-slate-900 p-3 rounded-lg text-center col-span-2"><span id="detail-area" class="block text-xl font-bold text-white">0m²</span><span class="text-xs text-gray-500 uppercase">Área Total</span></div>
                          </div>
                      </div>

                      <div class="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-2xl border border-blue-500/30 shadow-lg space-y-3">
                          <h3 class="text-lg font-bold text-white mb-2">Interessou?</h3>
                          
                          <a id="detail-whatsapp-btn" href="#" target="_blank" 
                             class="block w-full bg-white text-blue-900 font-bold py-4 rounded-xl text-center hover:bg-gray-100 transition shadow-lg">
                              Chamar no WhatsApp
                          </a>
                          
                          <button id="btn-simulador" onclick="openCalcModal()" class="hidden w-full border border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/5 transition text-sm flex items-center justify-center gap-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                              Simular Financiamento
                          </button>

                          <button onclick="shareProperty()" class="block w-full border border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/5 transition text-sm flex items-center justify-center gap-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                              Compartilhar Imóvel
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>

  <div id="calc-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/10 relative">
          <button onclick="closeCalcModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
          <h3 class="text-xl font-bold text-white mb-4">Simulador SAC</h3>
          <div class="space-y-4">
              <div><label class="text-xs text-gray-400 uppercase">Valor</label><input type="number" id="calc-valor" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" readonly></div>
              <div><label class="text-xs text-gray-400 uppercase">Entrada (R$)</label><input type="number" id="calc-entrada" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"></div>
              <div class="grid grid-cols-2 gap-4">
                  <div><label class="text-xs text-gray-400 uppercase">Prazo</label><select id="calc-anos" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"><option value="35">35 anos</option><option value="30">30 anos</option></select></div>
                  <div><label class="text-xs text-gray-400 uppercase">Juros %</label><input type="number" id="calc-taxa" value="10.5" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"></div>
              </div>
              <button onclick="calculateSAC()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition">Calcular</button>
              <div id="calc-result" class="hidden mt-4 space-y-3 p-4 bg-slate-900 rounded-lg border border-green-500/30">
                  <div><p class="text-gray-400 text-xs uppercase">1ª Parcela (Estimada)</p><p class="text-3xl font-bold text-green-400" id="res-parcela">R$ 0,00</p></div>
                  <div class="bg-blue-900/30 p-2 rounded border border-blue-500/30"><p class="text-blue-200 text-[10px] uppercase">Renda Familiar Sugerida (30%)</p><p class="text-white font-bold text-sm" id="res-renda">R$ 0,00</p></div>
                  <a id="link-aprovar" href="#" target="_blank" class="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-center text-xs mt-2">🏠 Aprovar Crédito</a>
              </div>
          </div>
      </div>
  </div>

  <script>
    // INJECTED DATA FROM ADMIN PANEL
    const injectedProfile = ${profileJson};
    const injectedProperties = ${propertiesJson};

    const container = document.getElementById('dynamicContainer');
    const homeView = document.getElementById('home-view');
    const propertyView = document.getElementById('property-view');
    
    // Globals
    let properties = [];
    let currentDetailMedia = [];
    let currentDetailIndex = 0;
    let currentDetailId = null;
    let viewerInterval = null;
    let notificationTimeout = null;
    
    let globalName = injectedProfile.name || "Corretor";
    let globalWhatsApp = injectedProfile.whatsapp ? injectedProfile.whatsapp.replace(/\\D/g,'') : "5579999999999"; 
    let headerMessage = injectedProfile.headerMessage || "";

    function init() {
        const waUrl = headerMessage ? \`https://wa.me/\${globalWhatsApp}?text=\${encodeURIComponent(headerMessage)}\` : \`https://wa.me/\${globalWhatsApp}\`;
        
        // Update Profile DOM
        document.title = \`Luxe Estate | \${globalName}\`;
        document.getElementById('topbar-name').innerText = globalName;
        document.getElementById('hero-name').innerText = globalName;
        document.getElementById('topbar-creci').innerText = injectedProfile.creci;
        document.getElementById('hero-creci').innerText = \`\${injectedProfile.creci} • Especialista em Alto Padrão\`;
        if(injectedProfile.photoUrl) {
           document.getElementById('topbar-img').src = injectedProfile.photoUrl;
           document.getElementById('hero-img').src = injectedProfile.photoUrl;
        }
        document.getElementById('topbar-wa').href = waUrl;
        
        loadProperties();
    }

    function loadProperties() {
        // Map Admin Properties to View Format
        properties = injectedProperties.map(p => {
            return {
                id: p.id,
                title: p.title || "Sem Título",
                bairro: p.neighborhood || "Outros",
                city: p.city || "Aracaju, SE",
                lat: p.lat,
                lng: p.lng,
                price: p.displayPrice || "Sob Consulta",
                numericPrice: p.price || 0,
                type: p.type || "Imóvel",
                beds: p.bedrooms || 0,
                suites: p.suites || 0,
                baths: p.bathrooms || 0,
                cars: p.parking || 0,
                area: p.area ? \`\${p.area}m²\` : "-",
                desc: p.description || "Entre em contato.",
                features: p.features || [],
                media: p.media, 
                status: p.status,
                simulador: p.simulador === true, 
                viewerMin: p.viewersMin || 113, 
                viewerMax: p.viewersMax || 284,
                shareImage: p.media[0]?.url || '',
                customMsg: p.whatsappMessage
            };
        });
        renderByNeighborhood();
    }

    function openCalcModal() {
        const imovel = properties.find(p => String(p.id) === String(currentDetailId));
        if(imovel && imovel.numericPrice > 0) {
            document.getElementById('calc-valor').value = imovel.numericPrice;
            document.getElementById('calc-entrada').value = imovel.numericPrice * 0.2; 
        }
        document.getElementById('calc-modal').classList.remove('hidden');
    }
    
    function closeCalcModal() { 
        document.getElementById('calc-modal').classList.add('hidden'); 
        document.getElementById('calc-result').classList.add('hidden'); 
    }

    function calculateSAC() {
        const valor = parseFloat(document.getElementById('calc-valor').value);
        const entrada = parseFloat(document.getElementById('calc-entrada').value);
        const anos = parseInt(document.getElementById('calc-anos').value);
        const taxaAnual = parseFloat(document.getElementById('calc-taxa').value) / 100;
        if(!valor || !anos) return;
        const financiado = valor - entrada;
        const primeiraParcela = (financiado / (anos * 12)) + (financiado * (taxaAnual / 12));
        document.getElementById('res-parcela').innerText = primeiraParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('res-renda').innerText = (primeiraParcela / 0.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('link-aprovar').href = \`https://wa.me/\${globalWhatsApp}?text=Olá \${globalName}, quero aprovar o crédito para o imóvel de R$\${valor}.\`;
        document.getElementById('calc-result').classList.remove('hidden');
    }

    function shareProperty() {
        const imovel = properties.find(p => String(p.id) === String(currentDetailId));
        if (navigator.share) {
            navigator.share({ title: imovel.title, text: \`Olha esse imóvel: \${imovel.title}\`, url: window.location.href });
        } else { alert("Link copiado!"); }
    }

    function startViewerSimulation(min, max) {
        const el = document.getElementById('viewer-notification');
        const text = document.getElementById('viewer-text');
        
        el.classList.add('hidden');
        el.classList.remove('slide-in-bottom');
        if(viewerInterval) clearInterval(viewerInterval);
        if(notificationTimeout) clearTimeout(notificationTimeout);

        const update = () => {
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            text.innerHTML = \`<span class="font-bold font-mono text-base">\${count} pessoas</span> estão vendo este imóvel agora\`;
            
            el.classList.remove('hidden');
            void el.offsetWidth; 
            el.classList.add('slide-in-bottom');
            
            notificationTimeout = setTimeout(() => { el.classList.add('hidden'); }, 5000);
        };

        setTimeout(update, 1500); 
        viewerInterval = setInterval(update, 58000); 
    }

    function renderByNeighborhood() {
      container.innerHTML = '';
      const activeProperties = properties.filter(p => p.status !== 'Vendido' && p.status !== 'VENDIDO'); 
      const neighborhoods = [...new Set(activeProperties.map(p => p.bairro))];

      if(neighborhoods.length === 0) { container.innerHTML = '<div class="text-center text-white py-10">Nenhum imóvel disponível.</div>'; return; }

      neighborhoods.forEach(bairro => {
        const items = activeProperties.filter(p => p.bairro === bairro);
        const sectionHTML = \`
          <div class="mb-12 pl-4 md:pl-8">
            <div class="flex items-center gap-3 mb-5 border-b border-gray-800 pb-2 mr-4 md:mr-8">
               <h2 class="text-2xl md:text-3xl font-bold text-white border-l-4 border-blue-600 pl-3">\${bairro}</h2>
               <span class="text-xs text-gray-500 font-mono">\${items.length} imóveis</span>
            </div>
            <div class="flex overflow-x-auto gap-6 pb-8 hide-scroll snap-x snap-mandatory pr-4">
              \${items.map(imovel => createCard(imovel)).join('')}
            </div>
          </div>
        \`;
        container.innerHTML += sectionHTML;
      });
    }

    function createCard(imovel) {
        const slidesHTML = imovel.media.map((m) => m.type === 'video' ? \`<div class="w-full h-full flex-shrink-0 bg-black flex items-center justify-center"><video src="\${m.url}" autoplay muted loop playsinline class="w-full h-full object-cover"></video></div>\` : \`<img src="\${m.url}" class="w-full h-full object-cover flex-shrink-0">\`).join('');
        const hasMultiple = imovel.media.length > 1;

        const waText = imovel.customMsg ? encodeURIComponent(imovel.customMsg) : \`Tenho%20interesse%20no%20imóvel%20\${encodeURIComponent(imovel.title)}\`;
        const waLink = \`https://wa.me/\${globalWhatsApp}?text=\${waText}\`;

        return \`
          <div class="property-card min-w-[300px] md:min-w-[360px] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative snap-center group">
            <div onclick="openProperty('\${imovel.id}')" class="relative h-64 bg-slate-900 overflow-hidden cursor-pointer">
                <div id="slider-\${imovel.id}" class="flex h-full transition-transform duration-500 ease-out" style="transform: translateX(0%);" data-index="0" data-total="\${imovel.media.length}">\${slidesHTML}</div>
                <div class="absolute top-3 left-3 badge px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white z-10">\${imovel.type}</div>
                <div class="absolute bottom-3 left-3 badge px-3 py-1 rounded text-sm font-bold text-white z-10 border-blue-500/50">\${imovel.price}</div>
                \${hasMultiple ? \`<button onclick="slideCardMedia(event, '\${imovel.id}', -1)" class="slider-arrow absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white z-20">‹</button><button onclick="slideCardMedia(event, '\${imovel.id}', 1)" class="slider-arrow absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white z-20">›</button>\` : ''}
            </div>
            <div class="p-5">
              <h3 onclick="openProperty('\${imovel.id}')" class="text-xl font-bold text-white mb-1 truncate cursor-pointer hover:text-blue-400 transition">\${imovel.title}</h3>
              <p class="text-gray-400 text-sm mb-4 border-b border-gray-700 pb-3 flex justify-between"><span>\${imovel.beds} Quartos</span><span>\${imovel.area}</span></p>
              <div class="flex gap-2">
                  <button onclick="openProperty('\${imovel.id}')" class="flex-1 py-3 bg-slate-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-slate-600 transition">Ver Detalhes</button>
                  <a href="\${waLink}" target="_blank" class="flex-1 py-3 bg-white text-black font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-gray-200 transition flex items-center justify-center gap-1">WhatsApp</a>
              </div>
            </div>
          </div>
        \`;
    }

    window.slideCardMedia = function(event, id, direction) {
        event.stopPropagation();
        const slider = document.getElementById(\`slider-\${id}\`);
        let index = parseInt(slider.getAttribute('data-index')) + direction;
        const total = parseInt(slider.getAttribute('data-total'));
        if(index < 0) index = total - 1; if(index >= total) index = 0;
        slider.style.transform = \`translateX(-\${index * 100}%)\`;
        slider.setAttribute('data-index', index);
    };

    window.openProperty = function(id) {
        const imovel = properties.find(p => String(p.id) === String(id));
        if(!imovel) return;
        currentDetailId = id;

        document.getElementById('detail-title').innerText = imovel.title;
        document.getElementById('detail-location').innerText = imovel.city;
        document.getElementById('detail-bairro').innerText = imovel.bairro;
        document.getElementById('detail-price').innerText = imovel.price;
        document.getElementById('detail-desc').innerText = imovel.desc;
        document.getElementById('detail-beds').innerText = imovel.beds;
        document.getElementById('detail-suites').innerText = imovel.suites;
        document.getElementById('detail-baths').innerText = imovel.baths;
        document.getElementById('detail-cars').innerText = imovel.cars;
        document.getElementById('detail-area').innerText = imovel.area;

        const stEl = document.getElementById('detail-status');
        stEl.innerText = imovel.status || "DISPONÍVEL";
        stEl.className = 'px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ';
        if(imovel.status === 'Últimas unidades') stEl.className += 'bg-yellow-500/20 text-yellow-400';
        else if(imovel.status === 'Vendido') stEl.className += 'bg-red-500/20 text-red-400';
        else stEl.className += 'bg-green-600/20 text-green-400';

        const btnSim = document.getElementById('btn-simulador');
        if(imovel.simulador) btnSim.classList.remove('hidden', 'flex'); else btnSim.classList.add('hidden');
        if(imovel.simulador) btnSim.classList.add('flex');

        const featuresContainer = document.getElementById('detail-features');
        if(imovel.features && Array.isArray(imovel.features)) {
            featuresContainer.innerHTML = imovel.features.map(f => \`<div class="flex items-center gap-2 text-sm text-gray-300"><span class="w-1 h-1 bg-blue-500 rounded-full"></span>\${f}</div>\`).join('');
        } else featuresContainer.innerHTML = '';

        let mapSrc = "";
        if(imovel.lat && imovel.lng) {
            mapSrc = \`https://maps.google.com/maps?q=\${imovel.lat},\${imovel.lng}&hl=pt-br&z=14&output=embed\`;
        } else {
            mapSrc = \`https://maps.google.com/maps?q=\${encodeURIComponent(imovel.bairro + ", " + imovel.city)}&hl=pt-br&z=15&output=embed\`;
        }
        document.getElementById('map-frame').src = mapSrc;

        currentDetailMedia = imovel.media;
        currentDetailIndex = 0;
        updateDetailGallery();
        startViewerSimulation(imovel.viewerMin, imovel.viewerMax);

        const waDetailText = imovel.customMsg 
            ? encodeURIComponent(imovel.customMsg) 
            : \`Olá \${globalName}, vi o imóvel *\${encodeURIComponent(imovel.title)}* e gostaria de detalhes.\`;
        document.getElementById('detail-whatsapp-btn').href = \`https://wa.me/\${globalWhatsApp}?text=\${waDetailText}\`;

        document.title = \`Luxe Estate | \${imovel.title}\`;
        document.getElementById('og-title').setAttribute('content', \`\${imovel.title} - \${imovel.bairro}\`);
        document.getElementById('og-desc').setAttribute('content', \`\${imovel.beds} Quartos • \${imovel.area} • \${imovel.price}\`);
        document.getElementById('og-image').setAttribute('content', imovel.shareImage || (imovel.media[0] ? imovel.media[0].url : ''));

        homeView.classList.add('hidden');
        propertyView.classList.remove('hidden');
        window.scrollTo(0,0);
    }

    window.closeProperty = function() {
        propertyView.classList.add('hidden');
        homeView.classList.remove('hidden');
        document.getElementById('detail-main-media').innerHTML = "";
        if(viewerInterval) clearInterval(viewerInterval);
        if(notificationTimeout) clearTimeout(notificationTimeout);
        document.getElementById('viewer-notification').classList.add('hidden');
    }

    function updateDetailGallery() {
        const media = currentDetailMedia[currentDetailIndex];
        const container = document.getElementById('detail-main-media');
        if(media.type === 'video') {
            container.innerHTML = \`<video src="\${media.url}" autoplay muted loop playsinline controls class="w-full h-full object-contain bg-black"></video>\`;
        } else {
            container.innerHTML = \`<img src="\${media.url}" class="w-full h-full object-cover">\`;
        }
        document.getElementById('detail-counter').innerText = \`\${currentDetailIndex + 1} / \${currentDetailMedia.length}\`;
        const thumbsContainer = document.getElementById('detail-thumbs');
        thumbsContainer.innerHTML = currentDetailMedia.map((m, i) => {
            const activeClass = i === currentDetailIndex ? 'border-2 border-blue-500 opacity-100' : 'opacity-60 hover:opacity-100';
            const content = m.type === 'video' ? \`<video src="\${m.url}" class="w-full h-full object-cover"></video>\` : \`<img src="\${m.url}" class="w-full h-full object-cover">\`;
            return \`<div onclick="setDetailSlide(\${i})" class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition \${activeClass} bg-slate-800">\${content}</div>\`;
        }).join('');
    }

    window.nextDetailSlide = function() { currentDetailIndex = (currentDetailIndex + 1) % currentDetailMedia.length; updateDetailGallery(); }
    window.prevDetailSlide = function() { currentDetailIndex = (currentDetailIndex - 1 + currentDetailMedia.length) % currentDetailMedia.length; updateDetailGallery(); }
    window.setDetailSlide = function(index) { currentDetailIndex = index; updateDetailGallery(); }

    init();
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortKey === 'price' || sortKey === 'createdAt') {
        // Numeric sort
        return (Number(a[sortKey]) - Number(b[sortKey])) * modifier;
      }
      
      // String sort
      const valA = String(a[sortKey]).toLowerCase();
      const valB = String(b[sortKey]).toLowerCase();
      return valA.localeCompare(valB) * modifier;
    });
  }, [properties, sortKey, sortDirection]);

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.AVAILABLE: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case PropertyStatus.SOLD: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case PropertyStatus.RESERVED: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case PropertyStatus.LAST_UNITS: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Imóveis</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seu catálogo imobiliário</p>
        </div>
        <div className="flex items-center gap-3">
          <button
              onClick={handlePreview}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
              <Globe size={20} />
              Ver Minha Vitrine
          </button>
          <Link 
            to="/properties/new" 
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
            Novo Imóvel
          </Link>
        </div>
      </div>

      {properties.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 flex items-center gap-2">
            <ArrowUpDown size={16} />
            Ordenar por:
          </span>
          
          <select 
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            <option value="createdAt">Data de Cadastro</option>
            <option value="price">Preço</option>
            <option value="status">Status</option>
            <option value="title">Título</option>
          </select>

          <button 
            onClick={toggleSortDirection}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Inverter ordem"
          >
            {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="hidden sm:inline">{sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}</span>
          </button>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-gray-400 dark:text-gray-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum imóvel cadastrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Comece adicionando o primeiro imóvel ao seu portfólio.</p>
          <Link 
            to="/properties/new" 
            className="text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 dark:hover:text-brand-300 underline"
          >
            Cadastrar agora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProperties.map((property) => (
            <div key={property.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group">
              <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
                <img 
                  src={property.media[0]?.url || 'https://via.placeholder.com/400x300?text=Sem+Imagem'} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-bold text-lg">{property.displayPrice}</p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                   <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{property.type}</span>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 truncate" title={property.title}>{property.title}</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                     <MapPin size={14} />
                     {property.neighborhood}, {property.city}
                   </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-gray-100 dark:border-gray-700 mb-4">
                  <div className="flex flex-col items-center justify-center text-center">
                    <BedDouble size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.bedrooms} Quartos</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center border-l border-gray-100 dark:border-gray-700">
                    <Bath size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.bathrooms} Banheiros</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center border-l border-gray-100 dark:border-gray-700">
                    <Square size={18} className="text-gray-400 dark:text-gray-500 mb-1" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{property.area}m²</span>
                  </div>
                </div>

                <div className="mt-auto flex gap-3">
                  <Link 
                    to={`/properties/${property.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors font-medium text-sm"
                  >
                    <Edit2 size={16} />
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(property.id)}
                    className="flex-none flex items-center justify-center px-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 py-2 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};