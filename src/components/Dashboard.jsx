import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { planificacion, transferencias, meta_diaria, getAvailableModules } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedModules, setSelectedModules] = React.useState(['1', '2', '3', '4']);
  const [expandedRow, setExpandedRow] = React.useState(null);

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
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    try {
      const str = String(dateStr).trim();
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        let d = days[date.getDay()];
        if (d === 'SABADO' || d === 'DOMINGO') return 'PROCESO';
        return d;
      }
      return '';
    } catch (e) { return ''; }
  };

  const isAllDays = selectedDays.length === dayOptions.length;

  const toggleDay = (dayValue) => {
    setSelectedDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

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

    (planificacion || []).forEach(p => {
      const matched = getModKey(p.modulo);
      if (matched) {
        stations[matched].planned += parseFloat(p.cantidad || 0);
      }
    });

    (transferencias || []).forEach(t => {
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
      
      (transferencias || []).forEach(t => {
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
      ? (availableModules || []) 
      : (availableModules || []).filter(mod => selectedModules.includes(mod))
  ), [availableModules, selectedModules, isAllModules]);

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
    (planificacion || []).forEach(p => {
      const pDia = normalizeDay(p.dia);
      if (!isAllDays && !selectedDays.includes(pDia)) return;

      const key = getProductKey(p);
      if (!products[key]) {
        products[key] = {
          sku: p.sku || p.producto,
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          modules: {},
          ops: []
        };
      }

      const modKey = getModKey(p.modulo);
      
      // Store OP detail
      products[key].ops.push({
        op: p.op || 'Sin OP',
        modulo: modKey || String(p.modulo || 'Sin Módulo'),
        dia: p.dia || 'Sin Día',
        cantidad: parseFloat(p.cantidad || 0)
      });

      if (modKey) {
        if (!products[key].modules[modKey]) {
          products[key].modules[modKey] = { planned: 0, transferred: 0 };
        }
        products[key].modules[modKey].planned += parseFloat(p.cantidad || 0);
      }
    });

    // Then, map all transfers (even those without planned entry)
    (transferencias || []).forEach(t => {
      const tDia = getDayName(t.fecha_transferencia);
      if (!isAllDays && !selectedDays.includes(tDia)) return;

      const key = getProductKey(t);
      if (!products[key]) {
        products[key] = {
          sku: t.sku || t.producto,
          producto: t.producto,
          color: t.color,
          nombre_color: t.nombre_color,
          modules: {},
          ops: []
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
  }, [planificacion, transferencias, searchQuery, selectedModules, availableModules, selectedDays, isAllDays]);

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
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] font-headline">Filtrar por D&#237;a de Planificaci&#243;n</p>
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
               onClick={() => setSelectedDays(isAllDays ? [] : dayOptions.map(d => d.value))}
               className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors"
            >
              {isAllDays ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          </div>
        </div>

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
                const isExpanded = expandedRow === idx;

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      className={`hover:bg-surface-container-low transition-all cursor-pointer font-body group ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''} ${isExpanded ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-primary/40 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-primary' : ''}`}>
                            chevron_right
                          </span>
                          <p className="text-sm font-black text-primary font-headline group-hover:text-secondary transition-colors underline-offset-4 group-hover:underline">{row.producto}</p>
                        </div>
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
                    
                    {isExpanded && (
                      <tr className="bg-primary/[0.02] border-l-4 border-primary">
                        <td colSpan={visibleModules.length + 5} className="py-8 px-12">
                          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                             <h4 className="text-[10px] font-black uppercase text-secondary tracking-[0.2em] mb-6 font-headline flex items-center gap-2">
                               <span className="material-symbols-outlined text-sm">list_alt</span>
                               Detalle de Órdenes de Producción (OP) por Módulo y Día
                             </h4>
                             {(() => {
                               if (!row.ops || row.ops.length === 0) {
                                 return <p className="text-xs text-slate-400 italic">No hay detalles de OP disponibles.</p>;
                               }
                               const dayOrder = { 'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'MIÉRCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'PROCESO': 6, 'SIN DÍA': 7 };
                               const getDayWeight = (d) => dayOrder[normalizeDay(d)] || dayOrder[d] || 99;
                               
                               const sorted = [...row.ops].sort((a, b) => {
                                 const wA = getDayWeight(a.dia);
                                 const wB = getDayWeight(b.dia);
                                 if (wA !== wB) return wA - wB;
                                 const mA = parseInt(a.modulo) || 99;
                                 const mB = parseInt(b.modulo) || 99;
                                 return mA - mB;
                               });

                               const grouped = {};
                               sorted.forEach(op => {
                                 const key = op.dia || 'Sin Día';
                                 if (!grouped[key]) grouped[key] = [];
                                 grouped[key].push(op);
                               });

                               return Object.entries(grouped).map(([dayName, ops], gi) => (
                                 <div key={dayName} className={gi > 0 ? 'mt-8 pt-8 border-t-2 border-dashed border-primary/10' : ''}>
                                   <div className="flex items-center gap-3 mb-5">
                                     <span className="material-symbols-outlined text-primary/30 text-sm">calendar_today</span>
                                     <h5 className="text-[11px] font-black uppercase text-primary tracking-[0.15em] font-headline">{dayName}</h5>
                                     <div className="flex-1 h-px bg-primary/10"></div>
                                     <span className="text-[10px] font-bold text-slate-400">{ops.length} OP(s)</span>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                     {ops.map((op, i) => (
                                       <div key={i} className="bg-white p-5 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
                                         <div className="flex justify-between items-start mb-4">
                                           <div>
                                             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-headline">OP Number</p>
                                             <p className="text-base font-black text-primary font-headline">{op.op}</p>
                                           </div>
                                           <span className="material-symbols-outlined text-primary/20">tag</span>
                                         </div>
                                         
                                         <div className="grid grid-cols-2 gap-4">
                                           <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-0.5">
                                             <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Módulo</span>
                                             <span className="text-xs font-black text-secondary">{op.modulo}</span>
                                           </div>
                                           <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-0.5">
                                             <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Día Plan</span>
                                             <span className="text-xs font-black text-primary">{op.dia}</span>
                                           </div>
                                         </div>
                                         
                                         <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                           <span className="text-[10px] font-bold text-slate-400">Cantidad</span>
                                           <span className="text-sm font-black text-primary">{Math.round(op.cantidad / divisor).toLocaleString()} <span className="text-[10px] text-slate-400">hilos</span></span>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               ));
                             })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
