import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storage';
import { Property, AdminProfile, PropertyStatus } from '../types';

export const Showcase: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Viewer simulation state
  const [viewerCount, setViewerCount] = useState(0);
  const [showViewerNotif, setShowViewerNotif] = useState(false);

  // Calculator state
  const [calcEntry, setCalcEntry] = useState(0);
  const [calcYears, setCalcYears] = useState(35);
  const [calcRate, setCalcRate] = useState(10.5);
  const [calcResult, setCalcResult] = useState<{parcela: number, renda: number} | null>(null);

  // Touch state for swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setProperties(storageService.getProperties());
    setProfile(storageService.getProfile());
  }, []);

  // Viewer Simulation Effect
  useEffect(() => {
    if (!selectedProperty) {
      setShowViewerNotif(false);
      return;
    }

    // Defaults match the provided HTML template
    const min = selectedProperty.viewersMin || 113;
    const max = selectedProperty.viewersMax || 284;

    const simulate = () => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      setViewerCount(count);
      setShowViewerNotif(true);
      setTimeout(() => setShowViewerNotif(false), 5000);
    };

    const initialTimer = setTimeout(simulate, 1500);
    const intervalTimer = setInterval(simulate, 58000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [selectedProperty]);

  const activeProperties = useMemo(() => {
    return properties.filter(p => p.status !== PropertyStatus.SOLD);
  }, [properties]);

  const groupedProperties = useMemo(() => {
    const groups: { [key: string]: Property[] } = {};
    activeProperties.forEach(p => {
      const bairro = p.neighborhood || 'Outros';
      if (!groups[bairro]) groups[bairro] = [];
      groups[bairro].push(p);
    });
    return groups;
  }, [activeProperties]);

  const handleOpenProperty = (property: Property) => {
    setSelectedProperty(property);
    setCurrentMediaIndex(0);
    setCalcEntry(property.price * 0.2);
    setCalcResult(null);
    window.scrollTo(0, 0);
  };

  const handleCloseProperty = () => {
    setSelectedProperty(null);
    setShowCalculator(false);
  };

  const handleCalculate = () => {
    if (!selectedProperty) return;
    const valor = selectedProperty.price;
    const financiado = valor - calcEntry;
    const taxaMensal = (calcRate / 100) / 12;
    const meses = calcYears * 12;
    
    // SAC Simplificado (Primeira parcela)
    const amortizacao = financiado / meses;
    const juros = financiado * taxaMensal;
    const primeiraParcela = amortizacao + juros;
    
    setCalcResult({
      parcela: primeiraParcela,
      renda: primeiraParcela / 0.3
    });
  };

  const getWhatsAppLink = (text: string) => {
    const phone = profile?.whatsapp.replace(/\D/g, '') || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedProperty) {
      setCurrentMediaIndex((prev) => (prev + 1) % selectedProperty.media.length);
    }
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedProperty) {
      setCurrentMediaIndex((prev) => (prev - 1 + selectedProperty.media.length) % selectedProperty.media.length);
    }
  };

  // Touch Event Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedProperty) {
      setCurrentMediaIndex((prev) => (prev + 1) % selectedProperty.media.length);
    }
    
    if (isRightSwipe && selectedProperty) {
      setCurrentMediaIndex((prev) => (prev - 1 + selectedProperty.media.length) % selectedProperty.media.length);
    }
  };

  if (!profile) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Carregando...</div>;

  return (
    <div className="font-space bg-[#0f172a] text-white min-h-screen overflow-x-hidden selection:bg-blue-500 selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap');
        .font-space { font-family: 'Space Grotesk', sans-serif; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .property-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .property-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .badge { backdrop-filter: blur(8px); background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); }
        .top-bar-glass { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .slide-in-bottom { animation: slideInBottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        @keyframes slideInBottom { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-in-out; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 top-bar-glass px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleCloseProperty}>
            <div className="w-10 h-10 rounded-full p-[1px] bg-gradient-to-tr from-blue-500 to-cyan-400 relative">
                <img src={profile.photoUrl} className="w-full h-full rounded-full object-cover border border-[#0f172a]" alt="Perfil" />
            </div>
            <div>
                <div className="flex items-center gap-1">
                    <h1 className="text-sm font-bold text-white leading-tight">{profile.name}</h1>
                    <svg className="w-3 h-3 text-blue-400 fill-current" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.114-1.32.314C14.733 2.47 13.48 1.5 12 1.5c-1.48 0-2.733.97-3.452 2.316-.4-.2-.85-.314-1.32-.314-2.108 0-3.818 1.788-3.818 3.998 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.998 3.818 3.998.47 0 .92-.114 1.32-.314.72 1.347 1.973 2.316 3.452 2.316 1.48 0 2.733-.97 3.452-2.316.4.2.85.314 1.32.314 2.108 0 3.818-1.788 3.818-3.998 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zM13 17l-5-5 1.41-1.41L13 14.17l7.59-7.59L22 8l-9 9z"/></svg>
                </div>
                <p className="text-[10px] text-blue-400 font-bold tracking-wider">{profile.creci}</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <Link to="/" className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-full transition border border-white/10">
                Voltar ao Admin
            </Link>
            <a href={getWhatsAppLink(profile.headerMessage)} target="_blank" rel="noreferrer"
               className="bg-white hover:bg-gray-100 text-green-700 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg">
                <svg className="w-4 h-4 fill-green-700" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span className="hidden sm:inline">WhatsApp</span>
            </a>
        </div>
      </nav>

      {/* HOME VIEW */}
      <div className={selectedProperty ? 'hidden' : 'block'}>
          <header className="relative min-h-[60vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-16">
            <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80" alt="Background" className="w-full h-full object-cover opacity-30" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto pt-4">
               <div className="relative w-32 h-32 mx-auto mb-6">
                   <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-2xl">
                       <img src={profile.photoUrl} className="w-full h-full rounded-full object-cover border-4 border-[#0f172a]" alt="Foto Corretor" />
                   </div>
                   <div className="absolute bottom-1 right-1 bg-[#0f172a] rounded-full p-1">
                       <svg className="w-6 h-6 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.114-1.32.314C14.733 2.47 13.48 1.5 12 1.5c-1.48 0-2.733.97-3.452 2.316-.4-.2-.85-.314-1.32-.314-2.108 0-3.818 1.788-3.818 3.998 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.998 3.818 3.998.47 0 .92-.114 1.32-.314.72 1.347 1.973 2.316 3.452 2.316 1.48 0 2.733-.97 3.452-2.316.4.2.85.314 1.32.314 2.108 0 3.818-1.788 3.818-3.998 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zM13 17l-5-5 1.41-1.41L13 14.17l7.59-7.59L22 8l-9 9z"/></svg>
                   </div>
               </div>
               
               <h1 className="text-4xl md:text-6xl font-bold mb-2 tracking-tight text-white">{profile.name}</h1>
               <p className="text-sm uppercase tracking-[0.2em] text-blue-400 font-bold mb-6">{profile.creci} • Especialista em Alto Padrão</p>
               <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">Curadoria exclusiva de imóveis.</p>
            </div>
          </header>

          <main className="py-10 pb-24 max-w-[1400px] mx-auto">
            {Object.keys(groupedProperties).length === 0 ? (
               <div className="text-center text-gray-500 py-10">Nenhum imóvel disponível no momento.</div>
            ) : (
                Object.entries(groupedProperties).map(([bairro, items]: [string, Property[]]) => (
                    <div key={bairro} className="mb-12 pl-4 md:pl-8">
                        <div className="flex items-center gap-3 mb-5 border-b border-gray-800 pb-2 mr-4 md:mr-8">
                           <h2 className="text-2xl md:text-3xl font-bold text-white border-l-4 border-blue-600 pl-3">{bairro}</h2>
                           <span className="text-xs text-gray-500 font-mono">{items.length} imóveis</span>
                        </div>
                        <div className="flex overflow-x-auto gap-6 pb-8 hide-scroll snap-x snap-mandatory pr-4">
                            {items.map(imovel => (
                                <div key={imovel.id} className="property-card min-w-[300px] md:min-w-[360px] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative snap-center group">
                                    <div className="relative h-64 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => handleOpenProperty(imovel)}>
                                        {imovel.media.length > 0 ? (
                                           <img src={imovel.media[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={imovel.title} loading="lazy" decoding="async" />
                                        ) : (
                                           <div className="w-full h-full bg-slate-800 flex items-center justify-center text-gray-500">Sem Foto</div>
                                        )}
                                        <div className="absolute top-3 left-3 badge px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white z-10">{imovel.type}</div>
                                        <div className="absolute bottom-3 left-3 badge px-3 py-1 rounded text-sm font-bold text-white z-10 border-blue-500/50">{imovel.displayPrice}</div>
                                    </div>
                                    <div className="p-5">
                                      <h3 className="text-xl font-bold text-white mb-1 truncate">{imovel.title}</h3>
                                      <p className="text-gray-400 text-sm mb-4 border-b border-gray-700 pb-3 flex justify-between">
                                          <span>{imovel.bedrooms} Quartos</span>
                                          <span>{imovel.area}m²</span>
                                      </p>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleOpenProperty(imovel)} className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-slate-600 transition">Ver Detalhes</button>
                                          <a href={getWhatsAppLink(imovel.whatsappMessage || `Tenho interesse no imóvel ${imovel.title}`)} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-white text-black font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-gray-200 transition flex items-center justify-center gap-1">WhatsApp</a>
                                      </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
          </main>
      </div>

      {/* DETAIL VIEW */}
      {selectedProperty && (
        <div className="min-h-screen bg-[#0f172a] pb-20 relative pt-24 animate-fadeIn">
            
            {showViewerNotif && (
                <div className="fixed bottom-6 left-6 z-40 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-[80vw] slide-in-bottom">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
                    <p className="text-xs text-white tracking-wide">
                        <span className="font-bold font-mono text-base">{viewerCount} pessoas</span> estão vendo este imóvel agora
                    </p>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-6">
                <button onClick={handleCloseProperty} className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-widest">
                    ← Voltar para Imóveis
                </button>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-gray-800 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                           <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">BAIRRO</span>
                           <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                               selectedProperty.status === PropertyStatus.SOLD ? 'bg-red-500/20 text-red-400' : 
                               selectedProperty.status === PropertyStatus.LAST_UNITS ? 'bg-yellow-500/20 text-yellow-400' : 
                               'bg-green-600/20 text-green-400'
                           }`}>
                               {selectedProperty.status}
                           </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{selectedProperty.title}</h1>
                        <p className="text-gray-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span>{selectedProperty.city}</span>
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Valor de Investimento</p>
                            <p className="text-4xl font-bold text-white">{selectedProperty.displayPrice}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div 
                           className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative group touch-pan-y"
                           onTouchStart={handleTouchStart}
                           onTouchMove={handleTouchMove}
                           onTouchEnd={handleTouchEnd}
                        >
                             <div className="w-full h-[300px] md:h-[500px] flex items-center justify-center bg-gray-900 select-none">
                                 {selectedProperty.media[currentMediaIndex]?.type === 'video' ? (
                                    <video src={selectedProperty.media[currentMediaIndex].url} controls autoPlay muted className="w-full h-full object-contain pointer-events-auto"></video>
                                 ) : (
                                    <img src={selectedProperty.media[currentMediaIndex]?.url} className="w-full h-full object-cover pointer-events-none" alt="Property" decoding="async" />
                                 )}
                             </div>
                             {selectedProperty.media.length > 1 && (
                                <>
                                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-sm transition hidden md:block">‹</button>
                                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-sm transition hidden md:block">›</button>
                                </>
                             )}
                             <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm pointer-events-none">
                                 {currentMediaIndex + 1} / {selectedProperty.media.length}
                             </div>
                        </div>
                        
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scroll">
                            {selectedProperty.media.map((m, idx) => (
                                <div key={m.id} onClick={() => setCurrentMediaIndex(idx)} 
                                     className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition bg-slate-800 ${idx === currentMediaIndex ? 'border-2 border-blue-500 opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                    {m.type === 'video' ? <video src={m.url} className="w-full h-full object-cover" /> : <img src={m.url} className="w-full h-full object-cover" alt="thumb" loading="lazy" decoding="async" />}
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5">
                            <h3 className="text-xl font-bold mb-6">Sobre o Imóvel</h3>
                            <p className="text-gray-300 leading-relaxed text-lg mb-8 whitespace-pre-wrap">{selectedProperty.description}</p>
                            <h4 className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-4">Características</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedProperty.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>{f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5">
                            <h3 className="text-xl font-bold mb-6">Localização Aproximada</h3>
                            <div className="w-full h-64 bg-slate-700 rounded-xl overflow-hidden relative">
                                <iframe 
                                    title="map"
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    loading="lazy" 
                                    src={`https://maps.google.com/maps?q=${selectedProperty.lat || selectedProperty.neighborhood + ',' + selectedProperty.city},${selectedProperty.lng || ''}&hl=pt-br&z=14&output=embed`}
                                ></iframe>
                                <div className="absolute bottom-0 left-0 w-full h-5 backdrop-blur-[3px] z-10 border-t border-white/5 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            
                            <div className="bg-slate-800 p-6 rounded-2xl border border-white/10">
                                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Resumo</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900 p-3 rounded-lg text-center"><span className="block text-2xl font-bold text-white">{selectedProperty.bedrooms}</span><span className="text-xs text-gray-500 uppercase">Quartos</span></div>
                                    <div className="bg-slate-900 p-3 rounded-lg text-center"><span className="block text-2xl font-bold text-white">{selectedProperty.suites}</span><span className="text-xs text-gray-500 uppercase">Suítes</span></div>
                                    <div className="bg-slate-900 p-3 rounded-lg text-center"><span className="block text-2xl font-bold text-white">{selectedProperty.bathrooms}</span><span className="text-xs text-gray-500 uppercase">Banheiros</span></div>
                                    <div className="bg-slate-900 p-3 rounded-lg text-center"><span className="block text-2xl font-bold text-white">{selectedProperty.parking}</span><span className="text-xs text-gray-500 uppercase">Vagas</span></div>
                                    <div className="bg-slate-900 p-3 rounded-lg text-center col-span-2"><span className="block text-xl font-bold text-white">{selectedProperty.area}m²</span><span className="text-xs text-gray-500 uppercase">Área Total</span></div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-2xl border border-blue-500/30 shadow-lg space-y-3">
                                <h3 className="text-lg font-bold text-white mb-2">Interessou?</h3>
                                
                                <a href={getWhatsAppLink(selectedProperty.whatsappMessage || `Olá, gostaria de saber mais sobre: ${selectedProperty.title}`)} target="_blank" rel="noreferrer"
                                   className="block w-full bg-white text-blue-900 font-bold py-4 rounded-xl text-center hover:bg-gray-100 transition shadow-lg">
                                    Chamar no WhatsApp
                                </a>
                                
                                {selectedProperty.simulador && (
                                    <button onClick={() => setShowCalculator(true)} className="w-full border border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/5 transition text-sm flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        Simular Financiamento
                                    </button>
                                )}

                                <button onClick={() => {
                                   if (navigator.share) {
                                       navigator.share({ title: selectedProperty.title, text: `Olha esse imóvel: ${selectedProperty.title}`, url: window.location.href });
                                   } else {
                                       alert('Link copiado para a área de transferência');
                                   }
                                }} className="block w-full border border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/5 transition text-sm flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                    Compartilhar Imóvel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculator Modal */}
            {showCalculator && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-white/10 relative">
                        <button onClick={() => setShowCalculator(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold text-white mb-4">Simulador SAC</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-400 uppercase">Valor</label><input type="number" value={selectedProperty.price} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" /></div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase">Entrada (R$)</label>
                                <input type="number" value={calcEntry} onChange={(e) => setCalcEntry(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase">Prazo</label>
                                    <select value={calcYears} onChange={(e) => setCalcYears(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none">
                                        <option value="35">35 anos</option>
                                        <option value="30">30 anos</option>
                                        <option value="20">20 anos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase">Juros %</label>
                                    <input type="number" value={calcRate} onChange={(e) => setCalcRate(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" />
                                </div>
                            </div>
                            <button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition">Calcular</button>
                            
                            {calcResult && (
                                <div className="mt-4 space-y-3 p-4 bg-slate-900 rounded-lg border border-green-500/30">
                                    <div><p className="text-gray-400 text-xs uppercase">1ª Parcela (Estimada)</p><p className="text-3xl font-bold text-green-400">{calcResult.parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                                    <div className="bg-blue-900/30 p-2 rounded border border-blue-500/30"><p className="text-blue-200 text-[10px] uppercase">Renda Familiar Sugerida (30%)</p><p className="text-white font-bold text-sm">{calcResult.renda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                                    <a href={getWhatsAppLink(`Olá, quero aprovar crédito para o imóvel de R$ ${selectedProperty.price}`)} target="_blank" rel="noreferrer" className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-center text-xs mt-2">🏠 Aprovar Crédito</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
