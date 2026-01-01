import React, { useEffect, useState, useMemo } from 'react';
import { storageService } from '../services/storage';
import { Property, AdminProfile, PropertyStatus, Lead, LeadScore } from '../types';
import { X, Check, Lock, Loader2, ArrowRight, Wallet, Banknote, Building2, ChevronDown, ChevronUp } from 'lucide-react';

export const Showcase: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isPricesUnlocked, setIsPricesUnlocked] = useState(false);
  
  // FAQ State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Loading States
  const [mainMediaLoading, setMainMediaLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<{[key: string]: boolean}>({});

  // Lead Capture Modal State (Multi-step)
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadStep, setLeadStep] = useState(1);
  const [leadPropertyId, setLeadPropertyId] = useState<string | null>(null);
  
  // Form Data
  const [leadContact, setLeadContact] = useState({ name: '', whatsapp: '', email: '' });
  const [leadFinancial, setLeadFinancial] = useState({ income: '', downPayment: '', fgts: '' });
  
  // Viewer simulation state
  const [viewerCount, setViewerCount] = useState(0);
  const [showViewerNotif, setShowViewerNotif] = useState(false);

  // Calculator state
  const [calcEntry, setCalcEntry] = useState(0);
  const [calcYears, setCalcYears] = useState(35);
  const [calcRate, setCalcRate] = useState(10.5);
  const [calcResult, setCalcResult] = useState<{parcela: number, renda: number} | null>(null);

  // Touch state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setProperties(storageService.getProperties());
    setProfile(storageService.getProfile());
    // Check if leads are already unlocked in this session/browser
    const unlocked = localStorage.getItem('luxe_prices_unlocked') === 'true';
    setIsPricesUnlocked(unlocked);
  }, []);

  useEffect(() => {
    // Reset main media loading when changing index or property
    setMainMediaLoading(true);
  }, [currentMediaIndex, selectedProperty]);

  useEffect(() => {
    if (!selectedProperty) {
      setShowViewerNotif(false);
      return;
    }
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
    return properties.filter(p => p.status !== PropertyStatus.SOLD && p.status !== PropertyStatus.DRAFT);
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

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => ({ ...prev, [id]: true }));
  };

  const handleSimulatorClick = () => {
    if (!selectedProperty) return;

    if (selectedProperty.enableLeadCapture && !isPricesUnlocked) {
      setLeadPropertyId(selectedProperty.id);
      setLeadStep(1); // Reset to step 1
      setShowLeadModal(true);
    } else {
      setShowCalculator(true);
    }
  };

  const calculateLeadScore = (price: number, income: number, downPayment: number, fgts: number): LeadScore => {
    const totalEntry = downPayment + fgts;
    const entryRule = totalEntry >= (price * 0.2);

    // SAC Calculation Estimate
    const financedAmount = price - totalEntry;
    if (financedAmount <= 0) return 'gold'; // Fully paid entry

    const annualRate = 0.10; // 10% a.a.
    const monthlyRate = annualRate / 12;
    const months = 360; // 30 years
    
    const amortization = financedAmount / months;
    const interest = financedAmount * monthlyRate;
    const firstInstallment = amortization + interest;
    
    const maxInstallment = income * 0.3; // 30% of income rule
    const installmentRule = firstInstallment <= maxInstallment;

    if (entryRule && installmentRule) return 'gold';
    if (!entryRule && installmentRule) return 'silver';
    
    return 'curious';
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const property = properties.find(p => p.id === leadPropertyId);
    if (!property) return;

    // Financial Values Parsing
    const incomeVal = Number(leadFinancial.income) || 0;
    const downPaymentVal = Number(leadFinancial.downPayment) || 0;
    const fgtsVal = Number(leadFinancial.fgts) || 0;

    // Calculate Score
    const score = calculateLeadScore(property.price, incomeVal, downPaymentVal, fgtsVal);
    
    // Get columns to find the first one
    const columns = storageService.getLeadColumns();
    const defaultStatus = columns.length > 0 ? columns[0].id : 'new';

    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      name: leadContact.name,
      whatsapp: leadContact.whatsapp,
      email: leadContact.email,
      propertyId: leadPropertyId || '',
      propertyTitle: property?.title || 'Desconhecido',
      createdAt: Date.now(),
      status: defaultStatus,
      income: incomeVal,
      downPayment: downPaymentVal,
      fgts: fgtsVal,
      score: score
    };

    storageService.saveLead(newLead);
    localStorage.setItem('luxe_prices_unlocked', 'true');
    setIsPricesUnlocked(true);
    setShowLeadModal(false);
    
    // Reset forms
    setLeadContact({ name: '', whatsapp: '', email: '' });
    setLeadFinancial({ income: '', downPayment: '', fgts: '' });
    setLeadStep(1);

    // Automatically open calculator after lead capture
    setShowCalculator(true);
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadStep === 1) {
       if (leadContact.name && leadContact.whatsapp && leadContact.email) {
         setLeadStep(2);
       }
    }
  };

  const handleOpenProperty = (property: Property) => {
    setSelectedProperty(property);
    setCurrentMediaIndex(0);
    setCalcEntry(property.price * 0.2);
    setCalcResult(null);
    setExpandedFaq(null);
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
    if (selectedProperty) setCurrentMediaIndex((prev) => (prev + 1) % selectedProperty.media.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedProperty) setCurrentMediaIndex((prev) => (prev - 1 + selectedProperty.media.length) % selectedProperty.media.length);
  };

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
    const minSwipeDistance = 50; // Minimum distance to be considered a swipe
    
    if (distance > minSwipeDistance && selectedProperty) {
      // Swiped Left -> Next Image
      nextSlide();
    }
    
    if (distance < -minSwipeDistance && selectedProperty) {
      // Swiped Right -> Previous Image
      prevSlide();
    }
  };
  
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
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
        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
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
                </div>
                <p className="text-[10px] text-blue-400 font-bold tracking-wider">{profile.creci}</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <a href={getWhatsAppLink(profile.headerMessage)} target="_blank" rel="noreferrer"
               className="bg-white hover:bg-gray-100 text-green-700 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg">
                <svg className="w-4 h-4 fill-green-700" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span className="hidden sm:inline">WhatsApp</span>
            </a>
        </div>
      </nav>

      {/* HOME VIEW and PROPERTY LIST (Hidden when selectedProperty) */}
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
                                           <>
                                             {!loadedImages[imovel.id] && (
                                                <div className="absolute inset-0 bg-slate-800 shimmer z-0"></div>
                                             )}
                                             <img 
                                               src={imovel.media[0].url} 
                                               className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${loadedImages[imovel.id] ? 'opacity-100' : 'opacity-0'}`} 
                                               alt={imovel.title} 
                                               loading="lazy" 
                                               decoding="async"
                                               onLoad={() => handleImageLoad(imovel.id)}
                                             />
                                           </>
                                        ) : (
                                           <div className="w-full h-full bg-slate-800 flex items-center justify-center text-gray-500">Sem Foto</div>
                                        )}
                                        <div className="absolute top-3 left-3 badge px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white z-10">{imovel.type}</div>
                                        <div className="absolute bottom-3 left-3 badge px-3 py-1 rounded text-sm font-bold text-white z-10 border-blue-500/50 flex flex-col items-start gap-1">
                                            <span>
                                                {imovel.displayPrice}
                                            </span>
                                            {imovel.belowMarketPrice && (
                                                <span className="text-[10px] text-green-400 font-bold bg-green-900/80 px-1.5 py-0.5 rounded border border-green-500/50 animate-pulse">
                                                    ABAIXO DO MERCADO
                                                </span>
                                            )}
                                        </div>
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
                            <p className="text-4xl font-bold text-white">
                                {selectedProperty.displayPrice}
                            </p>
                            {selectedProperty.belowMarketPrice && (
                                <p className="text-sm font-bold text-green-400 mt-1 uppercase tracking-wider">★ Preço abaixo do mercado</p>
                            )}
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
                             <div className="w-full h-[300px] md:h-[500px] flex items-center justify-center bg-gray-900 select-none relative">
                                 {mainMediaLoading && (
                                     <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                         <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                     </div>
                                 )}
                                 
                                 {selectedProperty.media[currentMediaIndex]?.type === 'video' ? (
                                    <video 
                                        src={selectedProperty.media[currentMediaIndex].url} 
                                        controls 
                                        autoPlay 
                                        muted 
                                        className="w-full h-full object-contain pointer-events-auto"
                                        onLoadedData={() => setMainMediaLoading(false)}
                                    ></video>
                                 ) : (
                                    <img 
                                        src={selectedProperty.media[currentMediaIndex]?.url} 
                                        className={`w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${mainMediaLoading ? 'opacity-0' : 'opacity-100'}`} 
                                        alt="Property" 
                                        decoding="async"
                                        onLoad={() => setMainMediaLoading(false)}
                                    />
                                 )}
                             </div>
                             {selectedProperty.media.length > 1 && (
                                <>
                                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-sm transition hidden md:block">‹</button>
                                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-sm transition hidden md:block">›</button>
                                </>
                             )}
                             <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm pointer-events-none z-20">
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

                        {/* FAQ Section */}
                        {selectedProperty.faq && selectedProperty.faq.length > 0 && (
                          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5">
                              <h3 className="text-xl font-bold mb-6">Perguntas Frequentes</h3>
                              <div className="space-y-3">
                                {selectedProperty.faq.map((item, idx) => (
                                  <div key={idx} className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
                                    <button 
                                      onClick={() => toggleFaq(idx)}
                                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                                    >
                                      <span className="font-bold text-gray-200">{item.question}</span>
                                      {expandedFaq === idx ? <ChevronUp size={20} className="text-blue-400" /> : <ChevronDown size={20} className="text-gray-500" />}
                                    </button>
                                    {expandedFaq === idx && (
                                      <div className="p-4 pt-0 text-gray-400 border-t border-white/5 bg-black/20">
                                        {item.answer}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                          </div>
                        )}
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
                                    <button onClick={handleSimulatorClick} className="w-full border border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/5 transition text-sm flex items-center justify-center gap-2">
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
            
            {/* Lead Capture Modal (Multi-Step) */}
            {showLeadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-700 shadow-2xl relative overflow-hidden">
                  <button 
                    onClick={() => setShowLeadModal(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
                  >
                    <X size={20} />
                  </button>
                  
                  {/* Step Progress */}
                  <div className="flex justify-center mb-6 gap-2">
                     <div className={`h-1 flex-1 rounded-full transition-colors ${leadStep >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                     <div className={`h-1 flex-1 rounded-full transition-colors ${leadStep >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                     <div className={`h-1 flex-1 rounded-full transition-colors ${leadStep >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  </div>

                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {leadStep === 1 ? 'Simular Financiamento' : leadStep === 2 ? 'Análise de Crédito' : 'Confirmar'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {leadStep === 1 ? 'Preencha seus dados para acessar o simulador.' : leadStep === 2 ? 'Entenda seu potencial de compra.' : 'Tudo pronto para simular.'}
                    </p>
                  </div>

                  <form onSubmit={leadStep === 1 ? nextStep : handleLeadSubmit} className="space-y-4">
                    
                    {/* Step 1: Contact Info */}
                    {leadStep === 1 && (
                      <div className="animate-fadeIn space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                          <input 
                            type="text" 
                            required
                            value={leadContact.name}
                            onChange={e => setLeadContact({...leadContact, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            placeholder="Seu nome"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp (com DDD)</label>
                          <input 
                            type="tel" 
                            required
                            value={leadContact.whatsapp}
                            onChange={e => setLeadContact({...leadContact, whatsapp: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            placeholder="11999999999"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                          <input 
                            type="email" 
                            required
                            value={leadContact.email}
                            onChange={e => setLeadContact({...leadContact, email: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            placeholder="seu@email.com"
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg mt-2 flex items-center justify-center gap-2"
                        >
                          Continuar <ArrowRight size={18} />
                        </button>
                      </div>
                    )}

                    {/* Step 2: Financial Info */}
                    {leadStep === 2 && (
                       <div className="animate-fadeIn space-y-4">
                         <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Banknote size={16} /> Renda Mensal Familiar (R$)</label>
                          <input 
                            type="number" 
                            required
                            min="0"
                            value={leadFinancial.income}
                            onChange={e => setLeadFinancial({...leadFinancial, income: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            placeholder="Ex: 15000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Wallet size={16} /> Entrada Disponível (R$)</label>
                          <input 
                            type="number" 
                            required
                            min="0"
                            value={leadFinancial.downPayment}
                            onChange={e => setLeadFinancial({...leadFinancial, downPayment: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            placeholder="Recursos próprios"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"><Building2 size={16} /> Saldo FGTS (R$)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={leadFinancial.fgts}
                            onChange={e => setLeadFinancial({...leadFinancial, fgts: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            placeholder="Opcional"
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button 
                              type="button"
                              onClick={() => setLeadStep(1)}
                              className="w-1/3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-bold py-3 rounded-lg transition-colors"
                            >
                              Voltar
                            </button>
                            <button 
                              type="submit" 
                              className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                              <Check size={18} /> Ver Resultado
                            </button>
                        </div>
                       </div>
                    )}
                    
                    <p className="text-xs text-center text-gray-400 mt-2">
                        {leadStep === 2 ? 'Usaremos estes dados apenas para calcular seu perfil de crédito imobiliário.' : 'Seus dados estão seguros.'}
                    </p>
                  </form>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};