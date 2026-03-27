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

      // Calcular transferencias diarias (lunes-viernes) desde transferencias_realizadas
      const dailyTransfers = {
        'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Proceso': 0
      };
      const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      transferencias.forEach(t => {
        const tMod = normalizeModule(t.modulo);
        if (tMod === name) {
          const date = new Date(t.fecha_transferencia);
          let dayIdx = date.getDay(); // 0-6
          // Sabado (6) y Domingo (0) -> Viernes (5)
          if (dayIdx === 0 || dayIdx === 6) dayIdx = 5;
          const dayName = daysInSpanish[dayIdx];
          if (dailyTransfers[dayName] !== undefined) {
            dailyTransfers[dayName] += parseInt(t.cantidad || 0, 10);
          }
        }
      });
      
      // Determinar meta de hoy
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
        dailyTransfers,
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
        {stationsData.map(st => {
          // Determinar colores basados en la lógica de Traslados
          let bgColor = 'bg-rose-500';
          if (st.percent >= 90) bgColor = 'bg-emerald-500';
          else if (st.percent >= 50) bgColor = 'bg-amber-600';

          return (
            <div key={st.name} className={`${bgColor} p-6 rounded-xl transition-all shadow-xl shadow-black/5 flex flex-col items-center group ring-2 ring-white/10`}>
              <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 font-headline">Mód. {st.name}</h3>
                <span className="material-symbols-outlined text-white/40 text-xl">analytics</span>
              </div>
              
              <div className="flex flex-col items-center justify-center text-center mb-6">
                <p className="text-white text-[12px] font-black uppercase tracking-[0.25em] mb-2 font-headline">% CUMPLIMIENTO</p>
                <p className="text-6xl font-black text-white font-headline drop-shadow-md">{Math.round(st.percent)}%</p>
                <p className="text-white/80 text-[10px] mt-2 font-extrabold uppercase tracking-tight">Estatus de Producción</p>
              </div>

              <div className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-6 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Transferido</span>
                  <span className="text-lg font-black text-white">{st.transferred.toLocaleString()}</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Programado</span>
                  <span className="text-lg font-black text-white/90">{st.planned.toLocaleString()}</span>
                </div>
              </div>

              {st.moduleMetas.length > 0 && (
                <div className="w-full mb-6 bg-sky-100 p-4 rounded-xl border border-sky-200 relative overflow-hidden shadow-inner">
                  <p className="text-[9px] font-black uppercase text-blue-900 font-headline mb-4 tracking-widest text-center">RESUMEN META POR DIA (Kyds)</p>
                  <div className="flex flex-col gap-2">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Proceso'].map(day => {
                      const metaRec = st.moduleMetas.find(m => String(m.dia || '').toLowerCase() === day.toLowerCase());
                      const metaVal = metaRec ? (metaRec.meta_yds || 0) : 0;
                      const transVal = st.dailyTransfers[day] || 0;
                      const dayPercent = metaVal > 0 ? (transVal / metaVal) * 100 : 0;
                      
                      const metaK = (metaVal / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                      const transK = (transVal / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

                      return (
                        <div key={day} className="flex items-center justify-between text-[10px] font-bold font-body border-b border-blue-200/50 pb-1 last:border-0">
                          <span className="text-blue-800/60 w-16">{day}:</span> 
                          <div className="flex-1 flex justify-center items-center gap-2">
                            <span className="text-blue-900 tabular-nums font-black">{transK} / {metaK}</span>
                            <span className={`text-[9px] font-black tabular-nums w-10 text-right ${dayPercent >= 90 ? 'text-emerald-600' : dayPercent >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {Math.round(dayPercent)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Decorative icon like in Traslados */}
                  <div className="absolute -bottom-2 -right-2 opacity-[0.05] pointer-events-none">
                    <span className="material-symbols-outlined text-4xl text-blue-900">monitoring</span>
                  </div>
                </div>
              )}

              <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-white transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                  style={{ width: `${st.percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
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
