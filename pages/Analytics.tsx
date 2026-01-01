import React, { useMemo, useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageCircle, ArrowUpRight, Calendar, MousePointerClick, Eye, UserPlus, CheckCircle2, Archive, ListFilter } from 'lucide-react';
import { storageService } from '../services/storage';
import { Lead, LeadColumn } from '../types';

export const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [properties, setProperties] = useState(storageService.getProperties());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<LeadColumn[]>([]);

  useEffect(() => {
    setProperties(storageService.getProperties());
    setLeads(storageService.getLeads());
    setColumns(storageService.getLeadColumns());
  }, []);

  // Filter Data based on Period
  const filteredLeads = useMemo(() => {
    const now = Date.now();
    let cutoff = now;
    if (period === '24h') cutoff = now - 24 * 60 * 60 * 1000;
    if (period === '7d') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    if (period === '30d') cutoff = now - 30 * 24 * 60 * 60 * 1000;
    if (period === 'Total') cutoff = 0;

    return leads.filter(l => l.createdAt >= cutoff);
  }, [leads, period]);

  // Lead Stats Logic (Based on Dynamic Columns)
  const leadStats = useMemo(() => {
    // Attempt to map typical phases if they exist (by index or loose ID match)
    // Assuming first column is "New", last or middle is "Contacted" for simple stats
    // But better to just show total and breakdown
    return {
      total: filteredLeads.length,
      conversionRate: properties.length > 0 ? (filteredLeads.length / (properties.length * 50)) * 100 : 0
    };
  }, [filteredLeads, properties]);

  const leadsByColumn = useMemo(() => {
      return columns.map(col => ({
          title: col.title,
          color: col.color,
          count: filteredLeads.filter(l => l.status === col.id).length
      }));
  }, [columns, filteredLeads]);

  // General Stats Logic (Mocked Views/Clicks mixed with Real Leads)
  const generalStats = useMemo(() => {
    const totalProperties = properties.length;
    // Mock views based on period multiplier
    const multiplier = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const totalViews = properties.reduce((acc, p) => acc + (Math.floor(Math.random() * 50) + 10), 0) * multiplier;
    const totalClicks = Math.floor(totalViews * 0.12);
    
    return { totalViews, totalClicks, totalProperties };
  }, [properties, period]);

  // Chart Data Generation
  const chartData = useMemo(() => {
    const points = period === '24h' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : 12;
    const data = [];
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
      let label = '';
      let dateFilter: (d: number) => boolean;

      if (period === '24h') {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        label = `${d.getHours()}h`;
        dateFilter = (ts) => {
           const leadDate = new Date(ts);
           return leadDate.getDate() === d.getDate() && leadDate.getHours() === d.getHours();
        };
      } else if (period === '30d' || period === '7d') {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        label = `${d.getDate()}/${d.getMonth() + 1}`;
        dateFilter = (ts) => {
            const leadDate = new Date(ts);
            return leadDate.getDate() === d.getDate() && leadDate.getMonth() === d.getMonth();
        };
      } else {
        // Total (Monthly view approx)
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = d.toLocaleString('default', { month: 'short' });
        dateFilter = (ts) => {
            const leadDate = new Date(ts);
            return leadDate.getMonth() === d.getMonth() && leadDate.getFullYear() === d.getFullYear();
        };
      }

      // Mock traffic data
      const views = Math.floor(Math.random() * (period === '24h' ? 50 : 300)) + 20;
      const clicks = Math.floor(views * 0.15);
      
      // Real Lead Data
      const leadCount = leads.filter(l => dateFilter(l.createdAt)).length;

      data.push({ label, views, clicks, leads: leadCount });
    }
    return data;
  }, [period, leads]);

  const StatCard = ({ title, value, subtext, icon: Icon, color, percent }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {percent && (
            <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            <ArrowUpRight size={14} className="mr-1" /> {percent}
            </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
  );

  // SVG Chart Construction
  const Chart = () => {
    const height = 250;
    const maxVal = Math.max(...chartData.map(d => Math.max(d.views, d.clicks, d.leads * 5))) || 10; // Scale leads up for visibility if needed, or just use raw
    
    // Scale helper
    const getY = (val: number) => height - (val / maxVal) * height * 0.8 - 20;
    const getX = (idx: number) => (idx / (chartData.length - 1)) * 100;

    const pointsBlue = chartData.map((d, i) => `${getX(i)},${getY(d.views)}`).join(' ');
    const pointsGreen = chartData.map((d, i) => `${getX(i)},${getY(d.clicks)}`).join(' ');
    const pointsPurple = chartData.map((d, i) => `${getX(i)},${getY(d.leads * 5)}`).join(' '); // Visual scaling for leads

    return (
      <div className="relative h-[300px] w-full cursor-crosshair">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1={height} x2="100" y2={height} stroke="#e5e7eb" strokeWidth="1" />
          <line x1="0" y1={height/2} x2="100" y2={height/2} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4" opacity="0.5" />
          
          {/* Blue Line (Traffic) */}
          <polyline points={pointsBlue} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-sm opacity-50" />
          
          {/* Green Line (Clicks) */}
          <polyline points={pointsGreen} fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" className="drop-shadow-sm opacity-60" />

          {/* Purple Line (Leads) */}
          <polyline points={pointsPurple} fill="none" stroke="#8b5cf6" strokeWidth="3" vectorEffect="non-scaling-stroke" className="drop-shadow-md" />

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
                <circle cx={hoveredData.x} cy={getY(hoveredData.leads * 5)} r="2.5" fill="#8b5cf6" stroke="white" strokeWidth="1" />
                <line x1={hoveredData.x} y1="0" x2={hoveredData.x} y2={height} stroke="#9ca3af" strokeDasharray="2" strokeWidth="0.2" />
              </>
          )}
        </svg>

        {hoveredData && (
            <div className="absolute top-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs p-3 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 min-w-[140px]" style={{ left: `${hoveredData.x}%` }}>
                <p className="font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">{hoveredData.label}</p>
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Visitas</span>
                        <span className="font-mono font-bold">{hoveredData.views}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Cliques</span>
                        <span className="font-mono font-bold">{hoveredData.clicks}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Leads</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{hoveredData.leads}</span>
                    </div>
                </div>
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
          <p className="text-gray-500 dark:text-gray-400">Acompanhe métricas e captação de leads.</p>
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

      {/* General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Visitas na Vitrine" value={generalStats.totalViews.toLocaleString()} subtext="Visualizações únicas estimadas" icon={Eye} color="bg-blue-500" percent="+12%" />
        <StatCard title="Cliques no WhatsApp" value={generalStats.totalClicks.toLocaleString()} subtext="Intenção de contato direta" icon={MessageCircle} color="bg-green-500" percent="+5%" />
        <StatCard title="Total de Leads" value={leadStats.total} subtext="Contatos capturados" icon={Users} color="bg-purple-500" percent={leadStats.total > 0 ? '+100%' : '0%'} />
        <StatCard title="Imóveis Ativos" value={generalStats.totalProperties} subtext="Disponíveis na vitrine" icon={BarChart3} color="bg-orange-500" />
      </div>

      {/* Leads Summary Section */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 flex items-center gap-2">
         <ListFilter size={20} className="text-gray-500" />
         Breakdown por Fase do Funil
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
         {leadsByColumn.map((col, idx) => (
             <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: col.color}}></div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate max-w-[120px]" title={col.title}>{col.title}</p>
                   </div>
                   <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{col.count}</p>
                </div>
             </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-500" />
              Evolução de Tráfego e Leads
            </h3>
          </div>
          <Chart />
          <div className="flex justify-center gap-6 mt-6 text-sm">
             <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Visitas</div>
             <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Clicks</div>
             <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium"><span className="w-3 h-3 bg-purple-500 rounded-full"></span> Leads Capturados</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
             <Eye size={20} className="text-brand-500" />
             Top Imóveis
           </h3>
           <div className="space-y-6">
             {properties.slice(0, 5).map((p, idx) => (
               <div key={p.id} className="flex items-start gap-3">
                 <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-500">{idx + 1}</span>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={p.title}>{p.title}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{p.neighborhood}</p>
                 </div>
               </div>
             ))}
             {properties.length === 0 && <p className="text-gray-500 text-sm">Nenhum dado disponível.</p>}
           </div>
        </div>
      </div>
    </div>
  );
};