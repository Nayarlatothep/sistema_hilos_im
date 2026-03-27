import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { planificacion, transferencias, meta_diaria } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const stationsData = useMemo(() => {
    const stations = {
      '1': { planned: 0, transferred: 0 },
      '2': { planned: 0, transferred: 0 },
      '3': { planned: 0, transferred: 0 }
    };

    const normalizeModule = (m) => {
      if (!m) return null;
      const str = String(m).toLowerCase();
      if (str.includes('1')) return '1';
      if (str.includes('2')) return '2';
      if (str.includes('3')) return '3';
      return null;
    };

    planificacion.forEach(p => {
      const key = normalizeModule(p.modulo);
      if (key && stations[key]) {
        stations[key].planned += parseInt(p.cantidad || 0, 10);
      }
    });

    transferencias.forEach(t => {
      const key = normalizeModule(t.modulo);
      if (key && stations[key]) {
        stations[key].transferred += parseInt(t.cantidad || 0, 10);
      }
    });

    return Object.entries(stations).map(([name, data]) => {
      const percent = data.planned > 0 ? Math.min(100, (data.transferred / data.planned) * 100) : 0;
      let statusColor = 'bg-rose-500';
      if (percent >= 100) statusColor = 'bg-emerald-500';
      else if (percent >= 50) statusColor = 'bg-amber-500';

      // Filtrar metas por módulo desde la tabla meta_diaria_plancostura (campos: dia, meta_yds, modulo)
      const moduleMetas = (meta_diaria || []).filter(m => {
        const mMod = String(m.modulo || '').toLowerCase();
        const sName = name.toLowerCase();
        return mMod === sName || mMod.includes(sName) || sName.includes(mMod);
      });
      
      // Determinar meta de hoy
      const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const todayName = daysInSpanish[new Date().getDay()];
      const todayMetaRecord = moduleMetas.find(m => String(m.dia || '').toLowerCase() === todayName.toLowerCase());
      const dailyGoal = todayMetaRecord ? (todayMetaRecord.meta_yds || 0) : 0;

      return {
        name,
        planned: data.planned,
        transferred: data.transferred,
        percent,
        statusColor,
        dailyGoal,
        moduleMetas,
        hasMeta: moduleMetas.length > 0
      };
    });
  }, [planificacion, transferencias, meta_diaria]);

  const productionData = useMemo(() => {
    const products = {};

    const normalizeModule = (m) => {
      if (!m) return null;
      const str = String(m).toLowerCase();
      if (str.includes('1')) return '1';
      if (str.includes('2')) return '2';
      if (str.includes('3')) return '3';
      return null;
    };

    planificacion.forEach(p => {
      const key = `${p.producto}_${p.color}`.toLowerCase().trim();
      if (!products[key]) {
        products[key] = {
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          mod1_planned: 0,
          mod1_transferred: 0,
          mod2_planned: 0,
          mod2_transferred: 0,
          mod3_planned: 0,
          mod3_transferred: 0,
        };
      }
      const modKey = normalizeModule(p.modulo);
      if (modKey === '1') products[key].mod1_planned += parseInt(p.cantidad || 0, 10);
      if (modKey === '2') products[key].mod2_planned += parseInt(p.cantidad || 0, 10);
      if (modKey === '3') products[key].mod3_planned += parseInt(p.cantidad || 0, 10);
    });

    transferencias.forEach(t => {
      const key = `${t.producto}_${t.color}`.toLowerCase().trim();
      if (products[key]) {
        const modKey = normalizeModule(t.modulo);
        const qty = parseInt(t.cantidad || 0, 10);
        if (modKey === '1') products[key].mod1_transferred += qty;
        if (modKey === '2') products[key].mod2_transferred += qty;
        if (modKey === '3') products[key].mod3_transferred += qty;
      }
    });

    const baseData = Object.values(products).map(p => {
      const totalTransferred = p.mod1_transferred + p.mod2_transferred + p.mod3_transferred;
      const totalPlanned = p.mod1_planned + p.mod2_planned + p.mod3_planned;
      const percent = totalPlanned > 0 ? Math.min(100, (totalTransferred / totalPlanned) * 100) : 0;
      return { ...p, totalTransferred, totalPlanned, percent };
    });

    // Custom Sorting Logic
    const colorPriorityMap = {
      'black a&e': 1,
      'black ae': 1, // fallback for common variants
      'navy 2025': 2,
      'blanco': 3,
      'princeton orange': 4,
      'princeton': 4,
      'princenton': 4,
      'lucerne blue': 5,
      'navy #3': 6,
      'navy # 3': 6,
      'light navy': 7
    };

    const sortedData = baseData.sort((a, b) => {
      const nameA = a.nombre_color.toLowerCase().trim();
      const nameB = b.nombre_color.toLowerCase().trim();
      const pA = colorPriorityMap[nameA] || 99;
      const pB = colorPriorityMap[nameB] || 99;

      // 1. Prioritize group (1-7) over others (99)
      if (pA !== pB) return pA - pB;

      // 2. If both are NOT in priority list OR both are the SAME priority color
      // then sort by Texture (Producto)
      if (a.producto < b.producto) return -1;
      if (a.producto > b.producto) return 1;

      // 3. Fallback: Alphabetical by color name
      return nameA.localeCompare(nameB);
    });

    if (!searchQuery) return sortedData;

    const term = searchQuery.toLowerCase();
    return sortedData.filter(p => 
      p.producto.toLowerCase().includes(term) || 
      p.nombre_color.toLowerCase().includes(term)
    );
  }, [planificacion, transferencias, searchQuery]);

  const now = new Date();
  const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} | ${now.toLocaleDateString()}`;

  if (stationsData.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-8 shadow-sm border border-outline-variant/10">
        <h2 className="text-2xl font-black font-headline text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">layers</span>
          Dashboard KPI
        </h2>
        <p className="text-on-surface-variant font-body">No hay datos disponibles para mostrar el progreso.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Hero Editorial Header */}
      <section>
        <p className="text-sm font-bold text-secondary uppercase tracking-[0.2em] mb-2 font-headline">Real-Time Performance</p>
        <div className="flex justify-between items-end">
          <h2 className="text-5xl font-black font-headline text-primary tracking-tighter">KPI Producción</h2>
          <div className="text-right">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase font-headline">Last Update</p>
            <p className="font-bold text-primary font-body">{timestamp}</p>
          </div>
        </div>
      </section>

      {/* KPI Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stationsData.map(st => (
          <div key={st.name} className="bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10 group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline">Módulo {st.name}</h3>
              <span className={`text-xs font-black font-headline ${st.percent >= 100 ? 'text-emerald-500' : st.percent >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                {Math.round(st.percent)}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-black text-primary font-headline">{st.transferred.toLocaleString()}</span>
              <span className="text-xs font-medium text-slate-400">/ {st.planned.toLocaleString()} Yardas</span>
            </div>
            
            {st.dailyGoal > 0 && (
              <div className="flex items-center gap-1.5 mb-5 bg-secondary/[0.03] p-2 border-l-2 border-secondary rounded-r">
                <span className="material-symbols-outlined text-sm text-secondary">target</span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-secondary/70 font-headline leading-tight">Meta de Hoy</span>
                  <span className="text-[11px] font-black text-secondary font-body leading-tight">{st.dailyGoal.toLocaleString()} Yds</span>
                </div>
              </div>
            )}

            {st.moduleMetas.length > 0 && (
              <div className="mb-5 pt-4 border-t border-outline-variant/10">
                <p className="text-[9px] font-black uppercase text-on-surface-variant/60 font-headline mb-3 tracking-widest">Resumen de Meta por Día (Yds)</p>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => {
                    const meta = st.moduleMetas.find(m => String(m.dia || '').toLowerCase() === day.toLowerCase());
                    if (!meta) return null;
                    return (
                      <div key={day} className="flex justify-between text-[10px] font-bold font-body">
                        <span className="text-slate-400">{day}:</span> 
                        <span className="text-primary">{meta.meta_yds ? meta.meta_yds.toLocaleString() : '0'}</span>
                      </div>
                    );
                  })}
                </div>
                {/* if there is any process info in any row, show it */}
                {st.moduleMetas.some(m => m.proceso) && (
                  <div className="mt-4 flex items-center gap-2 bg-primary/[0.04] px-3 py-2 rounded-lg border border-primary/10">
                    <span className="material-symbols-outlined text-[14px] text-primary">account_tree</span>
                    <span className="text-[10px] font-black uppercase text-primary font-headline tracking-tight">Proceso: {st.moduleMetas.find(m => m.proceso)?.proceso}</span>
                  </div>
                )}
              </div>
            )}

            <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${st.statusColor}`} 
                style={{ width: `${st.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </section>

      {/* Data Explorer Section */}
      <section className="bg-surface-container-lowest p-8 shadow-sm border border-outline-variant/10">
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}} />
        
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-96 font-body">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-3 pl-10 rounded-t-lg transition-colors" 
              placeholder="Search product or color..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto font-headline">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">download</span> Export
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-secondary text-white text-xs font-bold uppercase tracking-widest hover:bg-[#8f3400] transition-transform active:scale-95 shadow-md shadow-secondary/20">
              Run Optimization
            </button>
          </div>
        </div>

        {/* Main Data Table Container */}
        <div className="overflow-y-auto custom-scrollbar max-h-[600px] border border-outline-variant/10">
          <table className="w-full border-collapse sticky-header">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-outline-variant/20 shadow-[0_1px_0_rgba(0,0,0,0.05)] font-headline">
                <th className="py-4 px-4 bg-white">Producto</th>
                <th className="py-4 px-4 text-center bg-white">Color</th>
                <th className="py-4 px-4 bg-white">Nombre Color</th>
                <th className="py-4 px-4 text-right bg-white">Módulo 1</th>
                <th className="py-4 px-4 text-right bg-white">Módulo 2</th>
                <th className="py-4 px-4 text-right bg-white">Módulo 3</th>
                <th className="py-4 px-4 text-right bg-white">Cant. Transferida</th>
                <th className="py-4 px-4 text-right bg-white">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {productionData.map((row, idx) => (
                <tr key={idx} className={`group hover:bg-surface-container-low transition-colors font-body ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}>
                  <td className="py-6 px-4">
                    <p className="text-sm font-black text-primary font-headline group-hover:text-secondary transition-colors">{row.producto}</p>
                    <p className="text-[10px] text-slate-400">Production Line Active | ID: {idx + 101}</p>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-tight">{row.color || '-'}</span>
                  </td>
                  <td className="py-6 px-4"><span className="text-xs font-semibold text-slate-700">{row.nombre_color}</span></td>
                  <td className="py-6 px-4 text-right text-xs font-medium tabular-nums">
                    {Math.round(row.mod1_transferred / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()} / {Math.round(row.mod1_planned / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-right text-xs font-medium tabular-nums">
                    {Math.round(row.mod2_transferred / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()} / {Math.round(row.mod2_planned / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-right text-xs font-medium tabular-nums">
                    {Math.round(row.mod3_transferred / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()} / {Math.round(row.mod3_planned / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-right text-sm font-bold text-primary tabular-nums">
                    {Math.round(row.totalTransferred / (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180') ? 1225 : 3000)).toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-black text-secondary tabular-nums">{Math.round(row.percent)}%</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${row.percent >= 100 ? 'bg-emerald-500' : row.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-6">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-headline">Global Production Overview | {productionData.length} Product Lines Active</p>
          <div className="flex items-center gap-4 font-headline">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Optimal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Watchlist</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Critical</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
