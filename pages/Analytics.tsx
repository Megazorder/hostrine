import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, ArrowUpRight, Calendar, MousePointerClick, Eye } from 'lucide-react';
import { storageService } from '../services/storage';

export const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [hoveredData, setHoveredData] = useState<any>(null);
  const properties = storageService.getProperties();

  // Stats Logic
  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const totalViews = properties.reduce((acc, p) => acc + (Math.floor(Math.random() * 500) + 50), 0);
    const totalClicks = Math.floor(totalViews * 0.15);
    const totalLeads = Math.floor(totalClicks * 0.4);
    return { totalViews, totalClicks, totalLeads, totalProperties };
  }, [properties, period]);

  // Chart Data Generation
  const chartData = useMemo(() => {
    const points = period === '24h' ? 24 : period === '7d' ? 7 : 12;
    const data = [];
    for (let i = 0; i < points; i++) {
      const views = Math.floor(Math.random() * 100) + 20;
      const clicks = Math.floor(views * (Math.random() * 0.3 + 0.1));
      data.push({ label: i.toString(), views, clicks });
    }
    return data;
  }, [period]);

  const topProperties = useMemo(() => {
    return [...properties]
      .map(p => ({
        ...p,
        views: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 100) + 10
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [properties]);

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
          <ArrowUpRight size={14} className="mr-1" /> +12.5%
        </span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 mt-2">{subtext}</p>
    </div>
  );

  // Simple SVG Line Chart Construction
  const Chart = () => {
    const height = 200;
    const width = 100; // percent
    const maxVal = Math.max(...chartData.map(d => d.views));
    
    // Scale helper
    const getY = (val: number) => height - (val / maxVal) * height * 0.8 - 10;
    const getX = (idx: number) => (idx / (chartData.length - 1)) * 100;

    const pointsBlue = chartData.map((d, i) => `${getX(i)},${getY(d.views)}`).join(' ');
    const pointsGreen = chartData.map((d, i) => `${getX(i)},${getY(d.clicks)}`).join(' ');

    return (
      <div className="relative h-64 w-full cursor-crosshair">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1={height} x2="100" y2={height} stroke="#e5e7eb" strokeWidth="1" />
          
          {/* Blue Line (Traffic) */}
          <polyline 
            points={pointsBlue} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2" 
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-sm"
          />
          
          {/* Green Line (Clicks) */}
          <polyline 
            points={pointsGreen} 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="2" 
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-sm"
          />

          {/* Invisible Overlay for Tooltips */}
          {chartData.map((d, i) => (
             <rect 
                key={i} 
                x={getX(i) - 2} 
                y="0" 
                width="4" 
                height={height} 
                fill="transparent"
                onMouseEnter={() => setHoveredData({ ...d, x: getX(i) })}
                onMouseLeave={() => setHoveredData(null)}
             />
          ))}

          {/* Hover Points */}
          {hoveredData && (
              <>
                <circle cx={hoveredData.x} cy={getY(hoveredData.views)} r="1.5" fill="white" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx={hoveredData.x} cy={getY(hoveredData.clicks)} r="1.5" fill="white" stroke="#22c55e" strokeWidth="0.5" />
                <line x1={hoveredData.x} y1="0" x2={hoveredData.x} y2={height} stroke="#9ca3af" strokeDasharray="2" strokeWidth="0.2" />
              </>
          )}
        </svg>

        {hoveredData && (
            <div className="absolute top-0 bg-gray-900 text-white text-xs p-2 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full" style={{ left: `${hoveredData.x}%` }}>
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Visitas: {hoveredData.views}</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Cliques: {hoveredData.clicks}</div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análise de Performance</h1>
          <p className="text-gray-500 dark:text-gray-400">Acompanhe as métricas da sua vitrine em tempo real.</p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {['24h', '7d', '30d', 'Total'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === p
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Visitas na Vitrine" value={stats.totalViews.toLocaleString()} subtext="Total de visualizações únicas" icon={Eye} color="bg-blue-500" />
        <StatCard title="Cliques no WhatsApp" value={stats.totalClicks.toLocaleString()} subtext="Intenção de contato direta" icon={MessageCircle} color="bg-green-500" />
        <StatCard title="Taxa de Conversão" value={`${((stats.totalClicks / stats.totalViews) * 100).toFixed(1)}%`} subtext="Visitas que viraram cliques" icon={TrendingUp} color="bg-purple-500" />
        <StatCard title="Imóveis Ativos" value={stats.totalProperties} subtext="Disponíveis na vitrine" icon={BarChart3} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-brand-500" />
              Tráfego vs Conversão
            </h3>
          </div>
          <Chart />
          <div className="flex justify-center gap-6 mt-4 text-sm">
             <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Visitas</div>
             <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-3 h-3 bg-green-500 rounded-full"></span> WhatsApp</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
             <TrendingUp size={20} className="text-brand-500" />
             Imóveis em Alta
           </h3>
           <div className="space-y-6">
             {topProperties.map((p, idx) => (
               <div key={p.id} className="flex items-start gap-3">
                 <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-500">{idx + 1}</span>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={p.title}>{p.title}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{p.neighborhood}</p>
                 </div>
                 <div className="text-right">
                   <div className="flex items-center justify-end gap-1 text-xs text-blue-500 font-medium"><Eye size={12} /> {p.views}</div>
                   <div className="flex items-center justify-end gap-1 text-xs text-green-500 font-medium mt-1"><MousePointerClick size={12} /> {p.clicks}</div>
                 </div>
               </div>
             ))}
             {topProperties.length === 0 && <p className="text-gray-500 text-sm">Nenhum dado disponível.</p>}
           </div>
        </div>
      </div>
    </div>
  );
};