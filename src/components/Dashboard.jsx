import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { planificacion, transferencias, meta_diaria, getAvailableModules } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedModules, setSelectedModules] = React.useState(['1', '2', '3', '4']);
  
  const toggleModule = (mod) => {
    setSelectedModules(prev => 
      prev.includes(mod) 
        ? prev.filter(m => m !== mod) 
        : [...prev, mod]
    );
  };

  const availableModules = useMemo(() => getAvailableModules(), [planificacion, transferencias]);

  const isAllModules = selectedModules.length === availableModules.length;

  const stationsData = useMemo(() => {
    const stations = {};
    availableModules.forEach(mod => {
      stations[mod] = { planned: 0, transferred: 0 };
    });

    const getModKey = (pMod) => {
      const s = String(pMod || '').trim().toUpperCase();
      return ['1', '2', '3', '4'].find(m => 
        s === m || 
        s.includes(` ${m}`) || 
        s.includes(`${m} `) || 
        s.startsWith(`MODULO ${m}`) || 
        s.startsWith(`MÓDULO ${m}`) ||
        s.startsWith(`MOD. ${m}`) ||
        s.startsWith(`MOD ${m}`)
      );
    };

    planificacion.forEach(p => {
      const matched = getModKey(p.modulo);
      if (matched) {
        stations[matched].planned += parseFloat(p.cantidad || 0);
      }
    });

    transferencias.forEach(t => {
      const matched = getModKey(t.modulo);
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
        const matched = getModKey(t.modulo);
        if (matched === name) {
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
  }, [planificacion, transferencias, meta_diaria, availableModules]);

  const visibleModules = useMemo(() => (
    isAllModules
      ? availableModules 
      : availableModules.filter(mod => selectedModules.includes(mod))
  ), [availableModules, selectedModules]);

  const productionData = useMemo(() => {
    const products = {};

    const getProductKey = (item) => {
      const prod = String(item.producto || '').trim().toLowerCase();
      const col = String(item.nombre_color || '').trim().toLowerCase();
      return `${prod}|${col}`;
    };

    const getModKey = (pMod) => {
      const s = String(pMod || '').trim().toUpperCase();
      return ['1', '2', '3', '4'].find(m => 
        s === m || 
        s.includes(` ${m}`) || 
        s.includes(`${m} `) || 
        s.startsWith(`MODULO ${m}`) || 
        s.startsWith(`MÓDULO ${m}`) ||
        s.startsWith(`MOD. ${m}`) ||
        s.startsWith(`MOD ${m}`)
      );
    };

    // First, map all planned items
    planificacion.forEach(p => {
      const key = getProductKey(p);
      if (!products[key]) {
        products[key] = {
          sku: p.sku || p.producto,
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          modules: {},
        };
      }

      const modKey = getModKey(p.modulo);
      if (modKey) {
        if (!products[key].modules[modKey]) {
          products[key].modules[modKey] = { planned: 0, transferred: 0 };
        }
        products[key].modules[modKey].planned += parseFloat(p.cantidad || 0);
      }
    });

    // Then, map all transfers (even those without planned entry)
    transferencias.forEach(t => {
      const key = getProductKey(t);
      if (!products[key]) {
        products[key] = {
          sku: t.sku || t.producto,
          producto: t.producto,
          color: t.color,
          nombre_color: t.nombre_color,
          modules: {},
        };
      }

      const modKey = getModKey(t.modulo);
      if (modKey) {
        if (!products[key].modules[modKey]) {
          products[key].modules[modKey] = { planned: 0, transferred: 0 };
        }
        products[key].modules[modKey].transferred += parseFloat(t.cantidad || 0);
      }
    });

    const baseData = Object.values(products).map(p => {
      let totalTransferred = 0;
      let totalPlanned = 0;
      if (!isAllModules) {
        selectedModules.forEach(modId => {
          const mod = p.modules[modId];
          if (mod) {
            totalTransferred += mod.transferred;
            totalPlanned += mod.planned;
          }
        });
      } else {
        Object.values(p.modules).forEach(mod => {
          totalTransferred += mod.transferred;
          totalPlanned += mod.planned;
        });
      }
      const percent = totalPlanned > 0 ? Math.min(100, (totalTransferred / totalPlanned) * 100) : 0;
      return { ...p, totalTransferred, totalPlanned, percent };
    });

    let filtered = [...baseData];
    if (!isAllModules) {
      filtered = filtered.filter(p => {
        return selectedModules.some(modId => {
          const mod = p.modules[modId];
          return mod && (mod.planned > 0 || mod.transferred > 0);
        });
      });
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.producto.toLowerCase().includes(term) || 
        p.nombre_color.toLowerCase().includes(term)
      );
    }

    const colorPriorityMap = {
      'black a&e': 1, 'black ae': 1, 'navy 2025': 2, 'blanco': 3, 'princeton orange': 4, 'princeton': 4, 'princenton': 4, 'lucerne blue': 5, 'navy #3': 6, 'navy # 3': 6, 'light navy': 7
    };

    return filtered.sort((a, b) => {
      const isGimpA = String(a.producto || "").includes("HILO ANECOT GIMP SOFT T-180");
      const isGimpB = String(b.producto || "").includes("HILO ANECOT GIMP SOFT T-180");
      if (isGimpA && !isGimpB) return 1;
      if (!isGimpA && isGimpB) return -1;
      
      const nameA = a.nombre_color.toLowerCase().trim();
      const nameB = b.nombre_color.toLowerCase().trim();
      const pA = colorPriorityMap[nameA] || 99;
      const pB = colorPriorityMap[nameB] || 99;

      if (pA !== pB) return pA - pB;
      return nameA.localeCompare(nameB);
    });
  }, [planificacion, transferencias, searchQuery, selectedModules, availableModules]);

  const now = new Date();
  const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} | ${now.toLocaleDateString()}`;

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

      <section className={`grid grid-cols-1 ${getGridClass()} gap-8`}>
        {stationsData.map(st => {
          let perfBg = 'bg-rose-600';
          let perfProgress = 'bg-white/40';
          if (st.percent >= 90) perfBg = 'bg-emerald-600';
          else if (st.percent >= 50) perfBg = 'bg-amber-600';

          return (
            <div key={st.name} className="flex flex-col gap-0 shadow-xl rounded-2xl overflow-hidden transition-all hover:scale-[1.01]">
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
                  <div className={`h-full ${perfProgress} transition-all duration-1000`} style={{ width: `${st.percent}%` }}></div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none"></div>
              </div>

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

      <section className="bg-surface-container-lowest p-8 shadow-sm border border-outline-variant/10">
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          select { -webkit-appearance: none !important; appearance: none !important; }
        `}} />
        
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] font-headline">Filtrar por M&#243;dulo</p>
          <div className="flex flex-wrap gap-4">
            {availableModules.map(mod => {
              const isActive = selectedModules.includes(mod);
              return (
                <button
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all shadow-sm border-2 ${
                    isActive ? 'bg-secondary border-secondary text-white shadow-secondary/30 scale-110' : 'bg-surface-container-low border-transparent text-slate-400 hover:border-slate-200'
                  }`}
                >
                  M{mod}
                </button>
              );
            })}
            <button
               onClick={() => setSelectedModules(isAllModules ? [] : [...availableModules])}
               className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors"
            >
              {isAllModules ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          </div>
        </div>

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
          </div>
        </div>

        <div className="border border-outline-variant/10 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-outline-variant/20 font-headline">
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
              {productionData.map((row, idx) => {
                const divisor = (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180')) ? 1225 : 3000;
                return (
                  <tr key={idx} className={`hover:bg-surface-container-low transition-colors font-body ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}>
                    <td className="py-6 px-4">
                      <p className="text-sm font-black text-primary font-headline">{row.producto}</p>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-base font-mono font-bold text-slate-500 uppercase tracking-tight">{row.color || '-'}</span>
                    </td>
                    <td className="py-6 px-4"><span className="text-xs font-semibold text-slate-700">{row.nombre_color}</span></td>
                    {visibleModules.map(mod => {
                      const modData = row.modules[mod] || { planned: 0, transferred: 0 };
                      return (
                        <td key={mod} className="py-6 px-4 text-right text-xs font-medium tabular-nums">
                          {Math.round(modData.transferred / divisor).toLocaleString()} / {Math.round(modData.planned / divisor).toLocaleString()}
                        </td>
                      );
                    })}
                    <td className="py-6 px-4 text-right text-sm font-bold text-primary tabular-nums">
                      {Math.round(row.totalTransferred / divisor).toLocaleString()}
                    </td>
                    <td className="py-6 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-black text-secondary tabular-nums">{Math.round(row.percent)}%</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${row.percent >= 100 ? 'bg-emerald-500' : row.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-6">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-headline">Global Production Overview | {productionData.length} Product Lines Active</p>
          <div className="flex items-center gap-4 font-headline">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Optimal
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div> Watchlist
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div> Critical
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
