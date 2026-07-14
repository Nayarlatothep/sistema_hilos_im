import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function HomeDashboard() {
  const { 
    planificacion, 
    transferencias, 
    getAvailableModules,
    lotes_con_costo, 
    materiales_color, 
    lotes_material_color 
  } = useStore();

  // --- LOGIC FOR HILOS ---
  const availableModules = useMemo(() => getAvailableModules(), [planificacion, transferencias, getAvailableModules]);

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

      return {
        name,
        planned: data.planned,
        transferred: data.transferred,
        percent,
        statusColor
      };
    }).sort((a, b) => Number(a.name) - Number(b.name));
  }, [planificacion, transferencias, availableModules]);

  // --- LOGIC FOR INVENTORY ---
  const inventoryStats = useMemo(() => {
    if (!lotes_con_costo || !materiales_color || !lotes_material_color) return { total: 0, obsolete: 0, atRisk: 0, totalQty: 0, obsoleteQty: 0, atRiskQty: 0 };

    const groups = {};
    let totalCosto = 0;
    let obsoleteCosto = 0;
    let atRiskCosto = 0;
    let totalQty = 0;
    let obsoleteQty = 0;
    let atRiskQty = 0;

    lotes_con_costo.forEach(lote => {
      const key = `${lote.articulo}-${lote.idcolor}-${lote.pc}`;
      if (!groups[key]) {
        const material = materiales_color.find(m => m.articulo === lote.articulo && String(m.idcolor) === String(lote.idcolor));
        const shelflife = material ? Number(material.shelflife) || 0 : 0;
        
        const originalLote = lotes_material_color.find(l => l.pc === lote.pc && l.articulo === lote.articulo);
        const lote_total = originalLote?.total ? parseFloat(originalLote.total) : null;
        const costoU = parseFloat(lote.costo) || 0;

        groups[key] = {
          cantidad: 0,
          shelflife: shelflife,
          earliestManufacture: null,
          costo_unitario: costoU,
          lote_total: lote_total
        };
      }
      
      groups[key].cantidad += Number(lote.cantidad || 0);

      if (lote.fecha_manufactura) {
        const date = new Date(lote.fecha_manufactura);
        if (!groups[key].earliestManufacture || date < groups[key].earliestManufacture) {
          groups[key].earliestManufacture = date;
        }
      }
    });

    Object.values(groups).forEach(group => {
      let status = 'Desconocido';
      
      if (group.earliestManufacture && group.shelflife > 0) {
        let expirationDate = new Date(group.earliestManufacture);
        expirationDate.setDate(expirationDate.getDate() + group.shelflife);
        
        const today = new Date();
        const diffTime = expirationDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          status = 'Obsoleto';
        } else if (daysRemaining <= group.shelflife * 0.3) {
          status = 'En Riesgo';
        } else {
          status = 'Disponible';
        }
      }

      const costo_total = group.lote_total !== null ? group.lote_total : (group.cantidad * (group.costo_unitario || 0));
      
      totalCosto += costo_total;
      totalQty += group.cantidad;

      if (status === 'Obsoleto') {
        obsoleteCosto += costo_total;
        obsoleteQty += group.cantidad;
      }
      if (status === 'En Riesgo') {
        atRiskCosto += costo_total;
        atRiskQty += group.cantidad;
      }
    });

    return {
      total: totalCosto,
      totalQty: totalQty,
      obsolete: obsoleteCosto,
      obsoleteQty: obsoleteQty,
      atRisk: atRiskCosto,
      atRiskQty: atRiskQty
    };
  }, [lotes_con_costo, materiales_color, lotes_material_color]);


  return (
    <div className="flex flex-col gap-10 p-4 max-w-7xl mx-auto">
      <header className="flex flex-col gap-2 mb-4">
        <h1 className="text-4xl font-black text-primary font-headline tracking-tighter uppercase leading-none">Menú Principal</h1>
        <p className="text-secondary font-bold text-xs uppercase tracking-[0.3em]">Resumen Global del Sistema</p>
      </header>

      {/* --- SECCIÓN HILOS --- */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="material-symbols-outlined text-primary text-2xl">line_weight</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase font-headline">Indicador Semanal Hilos</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stationsData.length === 0 ? (
            <p className="text-slate-400 font-bold text-sm col-span-full">No hay datos de hilos para mostrar.</p>
          ) : (
            stationsData.map(st => (
              <div key={st.name} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col items-center relative overflow-hidden group hover:shadow-xl transition-all">
                <div className={`absolute top-0 left-0 w-full h-2 ${st.statusColor} transition-all`}></div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 font-headline mb-4 mt-2">Módulo {st.name}</h3>
                
                <div className="flex flex-col items-center justify-center mb-6">
                  <p className="text-5xl font-black text-slate-800 font-headline tabular-nums">{Math.round(st.percent)}%</p>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Cumplimiento</p>
                </div>
                
                <div className="w-full bg-slate-50 rounded-xl p-4 flex justify-between items-center text-xs font-bold border border-slate-100">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">Transferido</span>
                    <span className="text-slate-700">{(st.transferred / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">Programado</span>
                    <span className="text-slate-700">{(st.planned / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- SECCIÓN VENCIMIENTOS --- */}
      <section className="flex flex-col gap-6 mt-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="material-symbols-outlined text-rose-500 text-2xl">warning</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase font-headline">Indicador de Vencimiento</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inventario Total */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl text-slate-800">inventory_2</span>
            </div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-2 relative z-10">Inventario Total</p>
            <p className="text-4xl font-black text-slate-800 font-headline tabular-nums relative z-10">
              ${inventoryStats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 relative z-10">
              <span className="material-symbols-outlined text-sm text-slate-500">category</span>
              <span className="text-xs font-bold text-slate-600">{inventoryStats.totalQty.toLocaleString()} unidades</span>
            </div>
          </div>

          {/* Inventario en Riesgo */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 rounded-3xl shadow-lg shadow-amber-500/20 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <span className="material-symbols-outlined text-6xl text-white">timer</span>
            </div>
            <p className="text-xs font-black uppercase text-white/80 tracking-[0.2em] mb-2 relative z-10">Inventario en Riesgo</p>
            <p className="text-4xl font-black text-white font-headline tabular-nums relative z-10">
              ${inventoryStats.atRisk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg relative z-10">
              <span className="material-symbols-outlined text-sm text-white">category</span>
              <span className="text-xs font-bold text-white">{inventoryStats.atRiskQty.toLocaleString()} unidades</span>
            </div>
          </div>

          {/* Inventario Vencido */}
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 rounded-3xl shadow-lg shadow-rose-500/20 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <span className="material-symbols-outlined text-6xl text-white">error</span>
            </div>
            <p className="text-xs font-black uppercase text-white/80 tracking-[0.2em] mb-2 relative z-10">Inventario Vencido</p>
            <p className="text-4xl font-black text-white font-headline tabular-nums relative z-10 drop-shadow-sm">
              ${inventoryStats.obsolete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg relative z-10">
              <span className="material-symbols-outlined text-sm text-white">category</span>
              <span className="text-xs font-bold text-white">{inventoryStats.obsoleteQty.toLocaleString()} unidades</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
