import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { planificacion, transferencias, meta_diaria, getAvailableModules } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [moduleFilter, setModuleFilter] = React.useState('all');
  
  const dayOptions = [
    { label: 'Lu', value: 'LUNES' },
    { label: 'Ma', value: 'MARTES' },
    { label: 'Mi', value: 'MIERCOLES' },
    { label: 'Ju', value: 'JUEVES' },
    { label: 'Vi', value: 'VIERNES' },
    { label: 'Pr', value: 'PROCESO' },
  ];
  const [selectedDays, setSelectedDays] = React.useState(dayOptions.map(d => d.value));

  const normalizeDay = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      let d = days[date.getDay()];
      if (d === 'SABADO' || d === 'DOMINGO') return 'PROCESO';
      return d;
    } catch (e) { return ''; }
  };

  const isAllSelected = selectedDays.length === dayOptions.length;

  const toggleDay = (dayValue) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue) 
        : [...prev, dayValue]
    );
  };

  const availableModules = useMemo(() => getAvailableModules(), [planificacion, transferencias]);

  const stationsData = useMemo(() => {
    // Build stations dynamically from available modules
    const stations = {};
    availableModules.forEach(mod => {
      stations[mod] = { planned: 0, transferred: 0 };
    });

    planificacion.forEach(p => {
      const pMod = String(p.modulo || '').trim();
      const pDia = normalizeDay(p.dia);
      
      if (!isAllSelected && !selectedDays.includes(pDia)) return;

      const matched = ['1', '2', '3', '4'].find(m => 
        pMod === m || pMod.includes(` ${m}`) || pMod.includes(`${m} `) || pMod.startsWith(`Módulo ${m}`) || pMod.startsWith(`Modulo ${m}`)
      );
      
      if (matched) {
        stations[matched].planned += parseFloat(p.cantidad || 0);
      }
    });

    transferencias.forEach(t => {
      const pMod = String(t.modulo || '').trim();
      const tDia = getDayName(t.fecha_transferencia);
      
      if (!isAllSelected && !selectedDays.includes(tDia)) return;

      const matched = ['1', '2', '3', '4'].find(m => 
        pMod === m || pMod.includes(` ${m}`) || pMod.includes(`${m} `) || pMod.startsWith(`Módulo ${m}`) || pMod.startsWith(`Modulo ${m}`)
      );
      
      if (matched) {
        stations[matched].transferred += parseFloat(t.cantidad || 0);
      }
    });

    return Object.entries(stations).map(([name, data]) => {
      const percent = data.planned > 0 ? Math.min(100, (data.transferred / data.planned) * 100) : 0;
      let statusColor = 'bg-rose-500';
      if (percent >= 100) statusColor = 'bg-emerald-500';
      else if (percent >= 50) statusColor = 'bg-amber-500';

      const moduleMetas = (meta_diaria || []).filter(m => {
        const mMod = String(m.modulo || '').trim();
        return mMod === name;
      });

      const dailyTransfers = {
        'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Proceso': 0
      };
      const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      transferencias.forEach(t => {
        const tMod = String(t.modulo || '').trim();
        if (tMod === name) {
          const date = new Date(t.fecha_transferencia);
          let dayIdx = date.getDay();
          if (dayIdx === 0 || dayIdx === 6) dayIdx = 5;
          const dayName = daysInSpanish[dayIdx];
          if (dailyTransfers[dayName] !== undefined) {
            dailyTransfers[dayName] += parseInt(t.cantidad || 0, 10);
          }
        }
      });
      
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
  }, [planificacion, transferencias, meta_diaria, availableModules, selectedDays]);

  const visibleModules = useMemo(() => (
    moduleFilter === 'all' 
      ? availableModules 
      : availableModules.filter(mod => mod === moduleFilter)
  ), [availableModules, moduleFilter]);

  const productionData = useMemo(() => {
    const products = {};

    planificacion.forEach(p => {
      const pDia = normalizeDay(p.dia);
      
      if (!isAllSelected && !selectedDays.includes(pDia)) return;

      const key = (p.sku || '').trim().toLowerCase();
      if (!products[key]) {
        products[key] = {
          sku: p.sku,
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          modules: {},
        };
      }
      const pMod = String(p.modulo || '').trim();
      const modKey = ['1', '2', '3', '4'].find(m => 
        pMod === m || pMod.includes(` ${m}`) || pMod.includes(`${m} `) || pMod.startsWith(`Módulo ${m}`) || pMod.startsWith(`Modulo ${m}`)
      );
      
      if (modKey) {
        if (!products[key].modules[modKey]) {
          products[key].modules[modKey] = { planned: 0, transferred: 0 };
        }
        products[key].modules[modKey].planned += parseFloat(p.cantidad || 0);
      }
    });

    transferencias.forEach(t => {
      const tDia = getDayName(t.fecha_transferencia);
      if (!isAllSelected && !selectedDays.includes(tDia)) return;

      const key = (t.sku || '').trim().toLowerCase();
      if (products[key]) {
        const pMod = String(t.modulo || '').trim();
        const modKey = ['1', '2', '3', '4'].find(m => 
          pMod === m || pMod.includes(` ${m}`) || pMod.includes(`${m} `) || pMod.startsWith(`Módulo ${m}`) || pMod.startsWith(`Modulo ${m}`)
        );
        
        if (modKey) {
          if (!products[key].modules[modKey]) {
            products[key].modules[modKey] = { planned: 0, transferred: 0 };
          }
          products[key].modules[modKey].transferred += parseFloat(t.cantidad || 0);
        }
      }
    });

    const baseData = Object.values(products).map(p => {
      let totalTransferred = 0;
      let totalPlanned = 0;
      Object.values(p.modules).forEach(mod => {
        totalTransferred += mod.transferred;
        totalPlanned += mod.planned;
      });
      const percent = totalPlanned > 0 ? Math.min(100, (totalTransferred / totalPlanned) * 100) : 0;
      return { ...p, totalTransferred, totalPlanned, percent };
    });

    // Filtering
    let filtered = [...baseData];
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(p => {
        const mod = p.modules[moduleFilter];
        return mod && (mod.planned > 0 || mod.transferred > 0);
      });
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.producto.toLowerCase().includes(term) || 
        p.nombre_color.toLowerCase().includes(term) ||
        (p.op && p.op.toLowerCase().includes(term))
      );
    }

    // Custom Sorting Logic
    const colorPriorityMap = {
      'black a&e': 1,
      'black ae': 1,
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

    return filtered.sort((a, b) => {
      const nameA = a.nombre_color.toLowerCase().trim();
      const nameB = b.nombre_color.toLowerCase().trim();
      const pA = colorPriorityMap[nameA] || 99;
      const pB = colorPriorityMap[nameB] || 99;

      if (pA !== pB) return pA - pB;
      if (a.producto < b.producto) return -1;
      if (a.producto > b.producto) return 1;
      return nameA.localeCompare(nameB);
    });
  }, [planificacion, transferencias, searchQuery, moduleFilter, availableModules]);

  const now = new Date();
  const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} | ${now.toLocaleDateString()}`;

  // Dynamic grid class based on number of modules
  const getGridClass = () => {
    const count = stationsData.length;
    if (count <= 3) return 'md:grid-cols-3';
    if (count <= 4) return 'md:grid-cols-2 lg:grid-cols-4';
    return 'md:grid-cols-3 lg:grid-cols-5';
  };


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
            <p className="text-on-surface-variant text-[10px] font-bold uppercase font-headline">Última Actualización</p>
            <p className="font-bold text-primary font-body">{timestamp}</p>
          </div>
        </div>
      </section>

      {/* KPI Cards Section — Dynamic grid */}
      <section className={`grid grid-cols-1 ${getGridClass()} gap-8`}>
        {stationsData.map(st => {
          // Determinar colores de performance
          let perfBg = 'bg-rose-600';
          let perfProgress = 'bg-white/40';
          if (st.percent >= 90) {
            perfBg = 'bg-emerald-600';
          } else if (st.percent >= 50) {
            perfBg = 'bg-amber-600';
          }

          return (
            <div key={st.name} className="flex flex-col gap-0 shadow-xl rounded-2xl overflow-hidden transition-all hover:scale-[1.01]">
              {/* PRIMARY KPI CARD: Compliance & Totals */}
              <div className={`${perfBg} p-6 rounded-none flex flex-col items-center group relative overflow-hidden transition-all`}>
                <div className="w-full flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90 font-headline">MÓDULO {st.name}</h3>
                  <span className="material-symbols-outlined text-white/30 text-xl">analytics</span>
                </div>
                
                <div className="flex flex-col items-center justify-center text-center mb-8 relative z-10">
                  <p className="text-white/80 text-[15px] font-black uppercase tracking-[0.25em] mb-2 font-headline">% CUMPLIMIENTO</p>
                  <p className={`text-6xl font-black text-white font-headline drop-shadow-md`}>{Math.round(st.percent)}%</p>
                  <p className="text-white/60 text-[10px] mt-2 font-extrabold uppercase tracking-tight">Estatus en tiempo real</p>
                </div>

                <div className="w-full bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-8 flex justify-around items-center relative z-10 border border-white/10 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Transferido</span>
                    <span className="text-base font-black text-white">{(st.transferred / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}Kyds</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/10"></div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Programado</span>
                    <span className="text-base font-black text-white/90">{(st.planned / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}Kyds</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden shadow-inner relative z-10">
                  <div 
                    className={`h-full ${perfProgress} transition-all duration-1000`} 
                    style={{ width: `${st.percent}%` }}
                  ></div>
                </div>
                
                {/* Decorative background shape */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none"></div>
              </div>

              {/* SECONDARY CARD: Daily Meta Summary */}
              {st.moduleMetas.length > 0 && (
                <div className="bg-sky-100 p-6 rounded-none relative overflow-hidden flex flex-col gap-4 border-t border-white/10">
                  <p className="text-[10px] font-black uppercase text-blue-900 font-headline tracking-widest text-center border-b border-blue-900/10 pb-4">RESUMEN META POR DIA (Kyds)</p>
                  <div className="flex flex-col gap-3">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Proceso'].map(day => {
                      const metaRec = st.moduleMetas.find(m => String(m.dia || '').toLowerCase() === day.toLowerCase());
                      const metaVal = metaRec ? (metaRec.meta_yds || 0) : 0;
                      const transVal = st.dailyTransfers[day] || 0;
                      const dayPercent = metaVal > 0 ? (transVal / metaVal) * 100 : 0;
                      
                      const metaK = (metaVal / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                      const transK = (transVal / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

                      let dayColor = 'text-rose-500';
                      if (dayPercent >= 90) dayColor = 'text-emerald-500';
                      else if (dayPercent >= 50) dayColor = 'text-amber-500';

                      return (
                        <div key={day} className="flex items-center justify-between text-[11px] font-bold font-body border-b border-blue-900/5 pb-2 last:border-0 px-2">
                          <span className="text-blue-900/40 w-16">{day}:</span> 
                          <span className="text-blue-900 tabular-nums font-black flex-1 text-center">{transK} / {metaK}</span>
                          <span className={`text-[10px] font-black tabular-nums w-12 text-right ${dayColor}`}>
                            {Math.round(dayPercent)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
          
          /* Force hide default arrow on all browsers */
          select {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          select::-ms-expand {
            display: none !important;
          }
        `}} />
        
        {/* Day Filter Bubbles */}
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] font-headline">Filtrar por Día de Planificación</p>
          <div className="flex flex-wrap gap-4">
            {dayOptions.map(day => {
              const isActive = selectedDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all shadow-sm border-2 ${
                    isActive 
                      ? 'bg-primary border-primary text-white shadow-primary/30 scale-110' 
                      : 'bg-surface-container-low border-transparent text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
            <button
               onClick={() => setSelectedDays(selectedDays.length === dayOptions.length ? [] : dayOptions.map(d => d.value))}
               className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors"
            >
              {selectedDays.length === dayOptions.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80 font-body">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/10 text-xs py-3.5 pl-10 rounded-xl transition-all font-bold text-primary placeholder:text-slate-400/70" 
                placeholder="BUSCAR PRODUCTO O COLOR..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-60 font-body">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">grid_view</span>
              <select 
                className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/10 text-[10px] py-3.5 pl-10 pr-10 rounded-xl transition-all font-black text-primary font-headline uppercase tracking-[0.15em] appearance-none cursor-pointer"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="all">FILTRAR POR MÓDULO</option>
                {availableModules.map(mod => (
                  <option key={mod} value={mod}>MÓDULO {mod}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto font-headline">
            <button className="flex items-center gap-2 px-8 py-3 bg-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Run Optimization
            </button>
          </div>
        </div>

        {/* Main Data Table Container */}
        <div className="border border-outline-variant/10 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-outline-variant/20 shadow-[0_1px_0_rgba(0,0,0,0.05)] font-headline">
                <th className="py-4 px-4 bg-white">Producto</th>
                <th className="py-4 px-4 text-center bg-white">Color</th>
                <th className="py-4 px-4 bg-white">Nombre Color</th>
                {visibleModules.map(mod => (
                  <th key={mod} className="py-4 px-4 text-right bg-white">Módulo {mod}</th>
                ))}
                <th className="py-4 px-4 text-right bg-white">Cant. Transferida</th>
                <th className="py-4 px-4 text-right bg-white">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {productionData.map((row, idx) => (
                <tr key={idx} className={`group hover:bg-surface-container-low transition-colors font-body ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}>
                  <td className="py-6 px-4">
                    <p className="text-sm font-black text-primary font-headline group-hover:text-secondary transition-colors">{row.producto}</p>
                    <p className="text-[10px] text-slate-400">Production Line Active</p>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="text-base font-mono font-bold text-slate-500 uppercase tracking-tight">{row.color || '-'}</span>
                  </td>
                  <td className="py-6 px-4"><span className="text-xs font-semibold text-slate-700">{row.nombre_color}</span></td>
                  
                  {visibleModules.map(mod => {
                    const modData = row.modules[mod] || { planned: 0, transferred: 0 };
                    const divisor = (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180')) ? 1225 : 3000;
                    return (
                      <td key={mod} className="py-6 px-4 text-right text-xs font-medium tabular-nums">
                        {Math.round(modData.transferred / divisor).toLocaleString()} / {Math.round(modData.planned / divisor).toLocaleString()}
                      </td>
                    );
                  })}

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
