import React from 'react';
import { useStore } from '../store/useStore';

export default function Traslados() {
  const { 
    transferencias, 
    planificacion, 
    updateTransferenciaEstado, 
    fetchTransferencias, 
    fetchPlanificacion,
    fetchMetaDiaria,
    updateMultipleTransferenciasEstado,
    getAvailableModules
  } = useStore();

  const handleRefresh = async () => {
    await Promise.all([
      fetchTransferencias(),
      fetchPlanificacion(),
      fetchMetaDiaria()
    ]);
  };

  const [dateFilter, setDateFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [localChecks, setLocalChecks] = React.useState([]);

  const filteredTransferencias = React.useMemo(() => {
    let data = [...transferencias]; // Create a copy for sorting
    
    if (dateFilter) {
      data = data.filter(t => t.fecha_transferencia?.startsWith(dateFilter));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(t => 
        t.producto?.toLowerCase().includes(q) || 
        t.nombre_color?.toLowerCase().includes(q) ||
        t.color?.toLowerCase().includes(q)
      );
    }

    // Sorting: Estado 0/NULL first (at the top), Estado 1 at the bottom.
    // Secondary: Newest date first.
    data.sort((a, b) => {
      const estA = a.estado_transferencia || 0;
      const estB = b.estado_transferencia || 0;

      if (estA !== estB) {
        return estA - estB; // 0 comes before 1
      }
      
      const dateA = new Date(a.fecha_transferencia || 0).getTime();
      const dateB = new Date(b.fecha_transferencia || 0).getTime();
      return dateB - dateA; // Newest first
    });
    
    return data;
  }, [transferencias, dateFilter, searchQuery]);

  const adjustQuantity = (producto, cantidad) => {
    const qty = parseInt(cantidad || 0, 10);
    const prod = String(producto || '').trim();
    if (prod.includes('60 08 180') || prod.includes('60 08 0180')) {
      return Math.round(qty / 1225);
    }
    return Math.round(qty / 3000);
  };

  const stats = React.useMemo(() => {
    const totalStock = filteredTransferencias.reduce((acc, t) => acc + adjustQuantity(t.producto, t.cantidad), 0);
    const totalRequerida = planificacion.reduce((acc, p) => acc + adjustQuantity(p.producto, p.cantidad), 0);
    const cumplimiento = totalRequerida > 0 ? (totalStock / totalRequerida) * 100 : 0;

    let color = 'text-rose-500'; // Rojo crítico
    let border = 'border-rose-500';
    let bgColor = 'bg-rose-500';
    let textColor = 'text-white';
    
    if (cumplimiento >= 90) {
      color = 'text-emerald-500'; // Verde adecuado
      border = 'border-emerald-500';
      bgColor = 'bg-emerald-500';
    } else if (cumplimiento >= 50) {
      color = 'text-amber-500'; // Amarillo alerta
      border = 'border-amber-500';
      bgColor = 'bg-amber-600'; // Darker amber for contrast
    }

    // Dynamic module discovery — no hardcoded list
    const moduleList = getAvailableModules();
    const normalizeModule = (m) => {
      if (!m) return null;
      return String(m).trim();
    };

    const moduleStats = moduleList.map(modId => {
      const toolReq = planificacion
        .filter(p => normalizeModule(p.modulo) === modId)
        .reduce((acc, p) => acc + adjustQuantity(p.producto, p.cantidad), 0);
      const toolTrans = transferencias
        .filter(t => normalizeModule(t.modulo) === modId)
        .reduce((acc, t) => acc + adjustQuantity(t.producto, t.cantidad), 0);
      const prc = toolReq > 0 ? (toolTrans / toolReq) * 100 : 0;
      
      let badgeColor = 'bg-rose-500';
      if (prc >= 90) badgeColor = 'bg-emerald-500';
      else if (prc >= 50) badgeColor = 'bg-amber-500';

      return { modId, req: toolReq, trans: toolTrans, percent: prc, badgeColor };
    });

    return { totalStock, totalRequerida, cumplimiento, color, border, bgColor, textColor, moduleStats };
  }, [filteredTransferencias, planificacion, transferencias]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch (e) {
      return dateString;
    }
  };

  const handleToggleEstadoLocal = (id) => {
    setLocalChecks(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApplyChecks = async () => {
    if (localChecks.length === 0) return;
    if (window.confirm(`¿Desea marcar los ${localChecks.length} traslados seleccionados como Procesados?`)) {
      const res = await updateMultipleTransferenciasEstado(localChecks, 1);
      if (res) setLocalChecks([]);
    }
  };

  return (
    <div key="traslados">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-secondary font-bold tracking-widest text-[10px] uppercase mb-2 block">Logística de Almacén</span>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight font-headline uppercase">REPORTE TRASLADOS DE HILOS ENTRE ALMACEN</h1>
            <p className="text-on-surface-variant mt-2 max-w-xl">Estado en tiempo real de hilazas, hilos y activos textiles terminados en la planta de manufactura de Intermoda.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleApplyChecks}
              disabled={localChecks.length === 0}
              className={`flex items-center justify-center gap-3 px-12 py-3 font-extrabold rounded-xl transition-all active:scale-95 whitespace-nowrap min-w-[240px]
                ${localChecks.length > 0 
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/20 hover:shadow-primary/40' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
            >
              <span className="material-symbols-outlined text-2xl">checklist</span>
              <span className="uppercase tracking-widest text-sm">Actualiza Tabla {localChecks.length > 0 && `(${localChecks.length})`}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-200 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-slate-900 text-[12px] font-black uppercase tracking-widest mb-3 font-headline whitespace-nowrap">CANTIDAD REQUERIDA</p>
          <p className="text-6xl font-black text-slate-900 font-headline drop-shadow-sm">{stats.totalRequerida.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-3 text-emerald-700 text-[10px] font-black uppercase">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Desde Planificación</span>
          </div>
        </div>
        <div className="bg-slate-200 p-6 rounded-xl transition-all flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-slate-900 text-[12px] font-black uppercase tracking-widest mb-3 font-headline whitespace-nowrap">CANTIDAD TRANSFERIDA</p>
          <p className="text-6xl font-black text-slate-900 font-headline drop-shadow-sm">{stats.totalStock.toLocaleString()}</p>
          <p className="text-slate-600 text-[10px] mt-3 font-black uppercase">Volumen de material</p>
        </div>
        <div className={`${stats.bgColor} p-6 rounded-xl transition-all shadow-xl shadow-black/5 flex flex-col items-center justify-center text-center ring-2 ring-white/20`}>
          <p className="text-white text-[14px] font-black uppercase tracking-[0.25em] mb-3 font-headline">% CUMPLIMIENTO</p>
          <p className="text-6xl font-black text-white font-headline drop-shadow-md">{Math.round(stats.cumplimiento)}%</p>
          <p className="text-white/70 text-xs mt-3 font-extrabold uppercase tracking-tight">Estatus Actual del Plan</p>
        </div>
        <div className="bg-sky-100 p-6 rounded-xl transition-all overflow-hidden relative shadow-sm border border-sky-200">
          <div className="relative z-10 h-full flex flex-col">
            <p className="text-blue-900 text-[12px] font-black uppercase tracking-widest mb-4 font-headline whitespace-nowrap">RESUMEN MÓDULOS</p>
            <div className="flex flex-col gap-5 flex-grow">
              {stats.moduleStats.map(mod => (
                <div key={mod.modId} className="flex flex-col gap-1.5 group/mod">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-blue-900 font-headline tracking-tighter">Módulo {mod.modId}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-blue-800 font-black tabular-nums">
                        {mod.trans.toLocaleString()} / {mod.req.toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-black ${mod.percent >= 90 ? 'text-emerald-600' : mod.percent >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {Math.round(mod.percent)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden border border-blue-200/50 shadow-inner">
                    <div 
                      className={`${mod.badgeColor} h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                      style={{ width: `${Math.min(mod.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-[0.05] pointer-events-none">
            <span className="material-symbols-outlined text-8xl -mb-6 -mr-4 text-blue-900">monitoring</span>
          </div>
        </div>
      </section>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-surface-container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body" 
                placeholder="Buscar por hilo, color o fecha..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-48">
              <input 
                className="w-full px-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body appearance-none" 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
            <button 
              onClick={handleRefresh}
              className="p-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center shadow-md"
              title="Refrescar datos"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
            <button className="p-2 bg-surface-container-low rounded-lg text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Stock Válido</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Advertencia</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Crítico</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-[0.2em] font-black font-headline">
                <th className="px-6 py-5 text-center">
                  <span className="material-symbols-outlined text-sm">done_all</span>
                </th>
                <th className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60">calendar_today</span>
                    <span>DÍA</span>
                  </div>
                </th>
                <th className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60">texture</span>
                    <span>HILO</span>
                  </div>
                </th>
                <th className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60">precision_manufacturing</span>
                    <span>MÓDULO</span>
                  </div>
                </th>
                <th className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60">palette</span>
                    <span>COLOR</span>
                  </div>
                </th>
                <th className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary/60">sell</span>
                    <span>NOMBRE COLOR</span>
                  </div>
                </th>
                <th className="px-6 py-5 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="material-symbols-outlined text-sm text-primary/60">straighten</span>
                    <span>Kyds</span>
                  </div>
                </th>
                <th className="px-6 py-5 text-right pr-8">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="material-symbols-outlined text-sm text-primary/60">inventory_2</span>
                    <span>CONOS</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              {filteredTransferencias.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-on-surface-variant/40 italic font-body">
                    No se encontraron transferencias con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTransferencias.map((t, idx) => {
                  const isDbDone = t.estado_transferencia === 1;
                  const isCheckedLocal = localChecks.includes(t.id);
                  const showChecked = isDbDone || isCheckedLocal;
                  
                  return (
                    <tr key={t.id || idx} className={`hover:bg-surface-container/30 transition-colors group ${isDbDone ? 'opacity-40 whitespace-nowrap' : ''}`}>
                      <td className="px-4 py-5 text-center">
                        <input 
                          type="checkbox" 
                          checked={showChecked}
                          disabled={isDbDone}
                          onChange={() => handleToggleEstadoLocal(t.id)}
                          className={`rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4 
                            ${isDbDone ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        />
                      </td>
                      <td className={`px-8 py-5 font-semibold text-primary font-body ${isDbDone ? 'line-through' : ''}`}>
                        {formatDate(t.fecha_transferencia)}
                      </td>
                      <td className={`px-6 py-5 ${isDbDone ? 'line-through decoration-slate-400' : ''}`}>
                        <div className="flex flex-col font-body">
                          <span className="font-bold">{t.producto}</span>
                          <span className="text-xs text-on-surface-variant font-body">ID: {t.id}</span>
                          {t.comentario && (
                            <span className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded w-fit italic leading-tight">
                              "{t.comentario}"
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black font-headline ${isDbDone ? 'line-through opacity-50' : ''}`}>
                          MOD {t.modulo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-base font-mono font-bold text-slate-500 uppercase tracking-tight ${isDbDone ? 'line-through decoration-slate-400' : ''}`}>
                          {t.color}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 bg-surface-container rounded-full text-xs font-medium uppercase font-body ${isDbDone ? 'line-through' : ''}`}>
                          {t.nombre_color}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right pr-4 font-body">
                         <span className={`text-md font-extrabold text-slate-700 font-headline ${isDbDone ? 'line-through decoration-slate-400 opacity-50' : ''}`}>
                          {t.cantidad?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right pr-8 font-body">
                        <span className={`text-lg font-extrabold text-primary font-headline ${isDbDone ? 'line-through' : ''}`}>
                          {adjustQuantity(t.producto, t.cantidad).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-tighter">CONOS</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant font-bold uppercase tracking-widest font-headline">
          <div>Mostrando {Math.min(filteredTransferencias.length, 50)} de {filteredTransferencias.length} registros</div>
          <div className="flex items-center gap-2">
            <button 
              className="w-8 h-8 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-white transition-all disabled:opacity-50" 
              disabled
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-white transition-all">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      <aside className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-primary-container text-white p-10 rounded-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold font-headline leading-tight">Automated Reordering <br/>System Active</h3>
            <p className="mt-4 text-on-primary-container max-w-md">Intermoda AI is monitoring thread levels. High-tenacity polyester is currently scheduled for replenishment in 48 hours.</p>
          </div>
          <div className="relative z-10">
            <button className="px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:shadow-xl transition-all">Review Schedule</button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none">
            <svg className="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M44.7,-76.4C58.2,-69.2,70.1,-58.5,77.5,-45.5C84.9,-32.5,87.7,-17.2,85.6,-2.4C83.5,12.4,76.5,26.7,68.2,39.8C59.9,52.8,50.3,64.6,38.1,71.7C25.8,78.8,11,81.1,-3.5,85.1C-18.1,89.1,-32.4,94.8,-46,90.5C-59.6,86.2,-72.5,71.9,-79.9,56.5C-87.3,41.1,-89.2,24.6,-87.6,9.1C-86.1,-6.3,-81,-20.7,-73,-33.7C-65,-46.7,-54.1,-58.3,-41.2,-65.7C-28.4,-73.1,-13.6,-76.3,0.8,-77.7C15.2,-79.1,29.4,-78.6,44.7,-76.4Z" fill="#FFFFFF" transform="translate(100 100)"></path>
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-center border-l-4 border-secondary">
            <span className="material-symbols-outlined text-secondary text-4xl mb-4">history</span>
            <h4 className="font-headline font-bold text-xl">Audit Log</h4>
            <p className="text-on-surface-variant text-sm mt-2">Last entry modified by R. Silva at 08:42 AM.</p>
            <a className="text-primary font-bold text-xs uppercase tracking-widest mt-6 hover:underline" href="#">View History</a>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-center">
            <span className="material-symbols-outlined text-primary text-4xl mb-4">analytics</span>
            <h4 className="font-headline font-bold text-xl">Forecasting</h4>
            <p className="text-on-surface-variant text-sm mt-2">Predicted consumption for November: +12%</p>
            <a className="text-primary font-bold text-xs uppercase tracking-widest mt-6 hover:underline" href="#">Analyze Data</a>
          </div>
        </div>
      </aside>
    </div>
  );
}
