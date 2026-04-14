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
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Parse as local time to avoid UTC date-only offset bug
      let date;
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
        // Date-only string: parse as local midnight
        const [y, m, d] = dateStr.trim().split('-').map(Number);
        date = new Date(y, m - 1, d);
      } else {
        date = new Date(dateStr);
      }
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
    // Build stations dynamically from available modules
    const stations = {};
    availableModules.forEach(mod => {
      stations[mod] = { planned: 0, transferred: 0 };
    });

    planificacion.forEach(p => {
      const pMod = String(p.modulo || '').trim();

      const matched = ['1', '2', '3', '4'].find(m => 
        pMod === m || pMod.includes(` ${m}`) || pMod.includes(`${m} `) || pMod.startsWith(`Módulo ${m}`) || pMod.startsWith(`Modulo ${m}`)
      );
      
      if (matched) {
        stations[matched].planned += parseFloat(p.cantidad || 0);
      }
    });

    transferencias.forEach(t => {
      const pMod = String(t.modulo || '').trim();

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
  }, [planificacion, transferencias, meta_diaria, availableModules]);

  const visibleModules = useMemo(() => (
    isAllModules
      ? availableModules 
      : availableModules.filter(mod => selectedModules.includes(mod))
  ), [availableModules, selectedModules]);

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
          opsDetail: [],  // Array of { op, cantidad, dia }
        };
      }

      // Collect OP details with day and module info
      const pMod = String(p.modulo || '').trim();
      const modKey = ['1', '2', '3', '4'].find(m => 
        pMod === m || pMod.includes(` ${m}`) || pMod.includes(`${m} `) || pMod.startsWith(`Módulo ${m}`) || pMod.startsWith(`Modulo ${m}`)
      );
      products[key].opsDetail.push({
        op: p.op || 'Sin OP',
        cantidad: parseFloat(p.cantidad || 0),
        dia: p.dia || '',
        modulo: modKey || '',
      });
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
          if (!products[key].modules[modKey].transfersByDay) {
            products[key].modules[modKey].transfersByDay = {};
          }
          // Normalize the key: already uppercase, no accents, weekends→PROCESO
          const normalizedTDia = normalizeDay(tDia);
          const dayPoolKey = (normalizedTDia === 'SABADO' || normalizedTDia === 'DOMINGO') ? 'PROCESO' : normalizedTDia;
          products[key].modules[modKey].transfersByDay[dayPoolKey] = (products[key].modules[modKey].transfersByDay[dayPoolKey] || 0) + parseFloat(t.cantidad || 0);
          products[key].modules[modKey].transferred += parseFloat(t.cantidad || 0);
        }
      }
    });

    // DEBUG: SKU key matching diagnostic
    const productKeys = Object.keys(products).slice(0, 5);
    const transferKeys = transferencias.slice(0, 5).map(t => (t.sku || '').trim().toLowerCase());
    const transferDays = transferencias.slice(0, 5).map(t => ({ sku: t.sku, fecha: t.fecha_transferencia, dia: getDayName(t.fecha_transferencia), modulo: t.modulo }));
    console.log('=== DEBUG SKU MATCHING ===');
    console.log('Planning product keys (first 5):', productKeys);
    console.log('Transfer SKU keys (first 5):', transferKeys);
    console.log('Transfer details (first 5):', transferDays);
    console.log('Any SKU key match?', transferKeys.some(tk => products[tk] !== undefined));

    const baseData = Object.values(products).map(p => {
      let totalTransferred = 0;
      let totalPlanned = 0;
      if (!isAllModules) {
        // Only count selected modules
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

    // Filtering
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
      // Regla especial: HILO ANECOT GIMP SOFT T-180 siempre al final
      const isGimpA = String(a.producto || "").includes("HILO ANECOT GIMP SOFT T-180") || String(a.nombre_color || "").includes("HILO ANECOT GIMP SOFT T-180");
      const isGimpB = String(b.producto || "").includes("HILO ANECOT GIMP SOFT T-180") || String(b.nombre_color || "").includes("HILO ANECOT GIMP SOFT T-180");
      
      if (isGimpA && !isGimpB) return 1;
      if (!isGimpA && isGimpB) return -1;

      const nameA = a.nombre_color.toLowerCase().trim();
      const nameB = b.nombre_color.toLowerCase().trim();
      const pA = colorPriorityMap[nameA] || 99;
      const pB = colorPriorityMap[nameB] || 99;

      if (pA !== pB) return pA - pB;
      if (a.producto < b.producto) return -1;
      if (a.producto > b.producto) return 1;
      return nameA.localeCompare(nameB);
    });
  }, [planificacion, transferencias, searchQuery, selectedModules, availableModules, selectedDays]);

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

        {/* Module Filter Bubbles */}
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
                    isActive 
                      ? 'bg-secondary border-secondary text-white shadow-secondary/30 scale-110' 
                      : 'bg-surface-container-low border-transparent text-slate-400 hover:border-slate-200'
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
              {productionData.map((row, idx) => {
                const isExpanded = expandedRow === idx;
                const divisor = (row.producto.includes('60 08 180') || row.producto.includes('60 08 0180')) ? 1225 : 3000;
                // Group opsDetail by OP name, filtered by module if applicable
                const opsGrouped = {};
                const filteredOps = isAllModules 
                  ? (row.opsDetail || []) 
                  : (row.opsDetail || []).filter(d => selectedModules.includes(d.modulo));
                filteredOps.forEach(d => {
                  if (!opsGrouped[d.op]) {
                    opsGrouped[d.op] = { cantidad: 0, dias: new Set(), modulos: new Set(), breakdown: [] };
                  }
                  opsGrouped[d.op].cantidad += d.cantidad;
                  if (d.dia) opsGrouped[d.op].dias.add(d.dia);
                  if (d.modulo) opsGrouped[d.op].modulos.add(d.modulo);
                  opsGrouped[d.op].breakdown.push({ dia: d.dia, modulo: d.modulo, cantidad: d.cantidad });
                });
                const dayWeight = {
                  'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'PROCESO': 6, 'SABADO': 6, 'DOMINGO': 6
                };

                const opEntries = Object.entries(opsGrouped).sort((a, b) => {
                  const getMinWeight = (dias) => {
                    const weights = Array.from(dias).map(d => dayWeight[normalizeDay(d)] || 99);
                    return weights.length > 0 ? Math.min(...weights) : 99;
                  };
                  const getMinMod = (mods) => {
                    const modNums = Array.from(mods).map(m => parseInt(m) || 99);
                    return modNums.length > 0 ? Math.min(...modNums) : 99;
                  };

                  const weightA = getMinWeight(a[1].dias);
                  const weightB = getMinWeight(b[1].dias);
                  if (weightA !== weightB) return weightA - weightB;

                  const modA = getMinMod(a[1].modulos);
                  const modB = getMinMod(b[1].modulos);
                  return modA - modB;
                });

                // Build local pool for this SKU/Module/Day
                const poolByModAndDay = {};
                Object.keys(row.modules).forEach(modId => {
                  poolByModAndDay[modId] = { ...(row.modules[modId]?.transfersByDay || {}) };
                });

                const getMatchDay = (dia) => {
                  const norm = normalizeDay(dia);
                  if (norm === 'SABADO' || norm === 'DOMINGO') return 'PROCESO';
                  return norm;
                };

                // DEBUG: comprehensive log for first row
                if (idx === 0) {
                  console.log('=== DEBUG OP WATERFALL (Row 0) ===');
                  console.log('SKU:', row.sku, '| Producto:', row.producto);
                  console.log('selectedDays:', selectedDays);
                  console.log('row.totalTransferred:', row.totalTransferred);
                  console.log('row.modules (full):', JSON.stringify(
                    Object.fromEntries(
                      Object.entries(row.modules).map(([k, v]) => [k, { planned: v.planned, transferred: v.transferred, transfersByDay: v.transfersByDay }])
                    )
                  ));
                  console.log('Pool by Mod/Day:', JSON.stringify(poolByModAndDay));
                }
                // DEBUG: find first row that HAS transfers
                if (row.totalTransferred > 0 && idx <= 5) {
                  console.log(`=== ROW WITH TRANSFERS (idx ${idx}) ===`);
                  console.log('SKU:', row.sku, '| Producto:', row.producto, '| totalTransferred:', row.totalTransferred);
                  console.log('modules:', JSON.stringify(
                    Object.fromEntries(
                      Object.entries(row.modules).map(([k, v]) => [k, { planned: v.planned, transferred: v.transferred, transfersByDay: v.transfersByDay }])
                    )
                  ));
                }

                const opWithTransfers = opEntries.map(([opName, data]) => {
                  const opPlanned = data.cantidad;
                  let filledForOp = 0;

                  // Distribute transfers strictly by matching day and module
                  data.breakdown.forEach(item => {
                    const dKey = getMatchDay(item.dia);
                    const poolQty = poolByModAndDay[item.modulo]?.[dKey] || 0;
                    const fill = Math.min(poolQty, item.cantidad);
                    filledForOp += fill;
                    
                    if (poolByModAndDay[item.modulo] && poolByModAndDay[item.modulo][dKey] !== undefined) {
                      poolByModAndDay[item.modulo][dKey] -= fill;
                    }
                  });

                  const opPercent = opPlanned > 0 ? Math.min(100, (filledForOp / opPlanned) * 100) : 0;
                  return { opName, data, filled: filledForOp, opPercent };
                });
                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      className={`group hover:bg-surface-container-low transition-colors font-body cursor-pointer ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''} ${isExpanded ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
                          <div>
                            <p className="text-sm font-black text-primary font-headline group-hover:text-secondary transition-colors">{row.producto}</p>
                            <p className="text-[10px] text-slate-400">{opEntries.length} OP(s) asignada(s)</p>
                          </div>
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
                      <tr className="bg-primary/[0.03]">
                        <td colSpan={3 + visibleModules.length + 2} className="px-4 py-4">
                          <div className="ml-8 border-l-2 border-primary/20 pl-6">
                            <p className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em] mb-3 font-headline">Desglose por Orden de Producción</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {opWithTransfers.map(({ opName, data, filled, opPercent }) => {
                                const plannedConos = Math.round(data.cantidad / divisor);
                                const filledConos = Math.round(filled / divisor);
                                let cardBorder = 'border-slate-100';
                                let statusIcon = 'pending';
                                let statusColor = 'text-slate-400';
                                if (opPercent >= 100) {
                                  cardBorder = 'border-emerald-200 bg-emerald-50/50';
                                  statusIcon = 'check_circle';
                                  statusColor = 'text-emerald-500';
                                } else if (opPercent > 0) {
                                  cardBorder = 'border-amber-200 bg-amber-50/30';
                                  statusIcon = 'timelapse';
                                  statusColor = 'text-amber-500';
                                }
                                return (
                                  <div key={opName} className={`rounded-lg px-4 py-3 border shadow-sm ${cardBorder}`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest font-headline">{opName}</p>
                                      <span className={`material-symbols-outlined text-sm ${statusColor}`}>{statusIcon}</span>
                                    </div>
                                    <p className="text-lg font-black text-primary tabular-nums">
                                      {filledConos} <span className="text-slate-300">/</span> {plannedConos}
                                      <span className="text-[10px] text-slate-400 font-medium ml-1">conos</span>
                                    </p>
                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all ${opPercent >= 100 ? 'bg-emerald-500' : opPercent > 0 ? 'bg-amber-500' : 'bg-slate-200'}`}
                                        style={{ width: `${Math.min(100, opPercent)}%` }}
                                      />
                                    </div>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      {data.modulos.size > 0 && (
                                        <span className="text-[9px] text-primary/50 font-bold uppercase">Mód: {[...data.modulos].join(', ')}</span>
                                      )}
                                      {data.dias.size > 0 && (
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{[...data.dias].join(', ')}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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
