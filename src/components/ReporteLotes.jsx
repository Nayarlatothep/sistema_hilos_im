import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function ReporteLotes() {
  const { lotes_material_color, fetchLoteMaterialColor, materiales_color, fetchMaterialesColor, addLoteMaterialColorRecord, deleteMultipleLoteMaterialColor, loading, error } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLotes, setSelectedLotes] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editCantidad, setEditCantidad] = useState('');

  useEffect(() => {
    fetchLoteMaterialColor();
    fetchMaterialesColor();
  }, []);

  const lotesWithStatus = (lotes_material_color || []).reduce((acc, row) => {
    const key = `${row.pc}-${row.articulo}-${row.idcolor}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        ids: [],
        pc: row.pc,
        categoria: row.categoria,
        articulo: row.articulo,
        nombre: row.nombre,
        color: row.color,
        idcolor: row.idcolor,
        cantidad: 0,
        fecha_manufactura: null,
      };
    }
    
    acc[key].ids.push(row.id);
    acc[key].cantidad += Number(row.cantidad || 0);

    if (row.fecha_manufactura) {
      if (!acc[key].fecha_manufactura || new Date(row.fecha_manufactura) < new Date(acc[key].fecha_manufactura)) {
        acc[key].fecha_manufactura = row.fecha_manufactura;
      }
    }
    return acc;
  }, {});

  const groupedArray = Object.values(lotesWithStatus).map(group => {
    const material = materiales_color?.find(m => m.articulo === group.articulo && String(m.idcolor) === String(group.idcolor));
    const shelflife = material ? Number(material.shelflife) || 0 : 0;
    
    let status = 'Desconocido';
    let fechaVencimientoStr = '—';
    let diasRestantes = '—';
    
    if (group.fecha_manufactura && shelflife > 0) {
      let expirationDate;
      const [year, month, day] = group.fecha_manufactura.split('-').map(Number);
      if (year && month && day) {
        expirationDate = new Date(year, month - 1, day);
      } else {
        expirationDate = new Date(group.fecha_manufactura);
      }
      
      if (!isNaN(expirationDate)) {
        expirationDate.setDate(expirationDate.getDate() + shelflife);
        fechaVencimientoStr = expirationDate.toLocaleDateString();
        
        const today = new Date();
        const diffTime = expirationDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        diasRestantes = daysRemaining;
        
        if (daysRemaining < 0) {
          status = 'Obsoleto';
        } else if (daysRemaining <= shelflife * 0.3) {
          status = 'En Riesgo';
        } else {
          status = 'Disponible';
        }
      }
    }
    return { ...group, status, fechaVencimientoStr, diasRestantes };
  });

  const filteredLotes = groupedArray.filter(row => {
    const matchesSearch = !searchQuery || Object.values(row).some(val => 
      val !== null && typeof val !== 'object' && String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = filterStatus === 'All' || row.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full min-w-max md:px-8">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] font-headline">Historial</p>
          <h2 className="text-4xl font-black font-headline text-primary tracking-tighter uppercase leading-none mt-1">Reporte de Lotes</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={async () => {
              if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente estos ${selectedLotes.size} registro(s)? Esta acción no se puede deshacer.`)) {
                await deleteMultipleLoteMaterialColor(Array.from(selectedLotes));
                setSelectedLotes(new Set());
              }
            }}
            disabled={loading || selectedLotes.size === 0}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold font-headline text-xs tracking-wider uppercase shadow-lg shadow-rose-600/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">
              delete
            </span>
            Borrar Registros
          </button>
          <button 
            onClick={() => { fetchLoteMaterialColor(); fetchMaterialesColor(); }}
            disabled={loading}
            className="px-6 py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-bold font-headline text-xs tracking-wider uppercase shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-75"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {loading ? 'Cargando...' : 'Actualizar Datos'}
          </button>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-200 text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          Ocurrió un error: {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20 w-full">
          <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
          <input 
            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-600 placeholder:text-slate-400" 
            placeholder="Buscar por código PC, artículo, categoría o color..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-md">close</span>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-64 shrink-0">
          <select 
            className="appearance-none bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm w-full text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/5 focus:border-primary/20 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Estatus: Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="En Riesgo">En Riesgo</option>
            <option value="Obsoleto">Obsoleto</option>
            <option value="Desconocido">Desconocido</option>
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            expand_more
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="overflow-x-auto flex-grow custom-scrollbar">
          {loading && filteredLotes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Consultando Reporte...</p>
            </div>
          ) : filteredLotes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <span className="material-symbols-outlined text-4xl opacity-30">layers_clear</span>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">No se encontraron lotes</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Editar</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Código PC</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Categoría</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Artículo</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Nombre</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Color</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Cantidad</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Fecha Manu.</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Fecha Vencimiento</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Días Venc.</th>
                  <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filteredLotes.map((row, idx) => {
                  let rowBg = 'hover:bg-slate-50/70';
                  let badgeClass = 'bg-slate-100 text-slate-500';
                  
                  if (row.status === 'Disponible') {
                    badgeClass = 'bg-success/10 text-success';
                  } else if (row.status === 'Obsoleto') {
                    rowBg = 'bg-danger-bg/10 hover:bg-danger-bg/20';
                    badgeClass = 'bg-danger/10 text-danger';
                  } else if (row.status === 'En Riesgo') {
                    rowBg = 'bg-warning-bg/10 hover:bg-warning-bg/20';
                    badgeClass = 'bg-warning/10 text-warning';
                  }

                  return (
                    <tr key={idx} className={`border-b border-slate-50 transition-colors ${rowBg}`}>
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          {editingId === (row.key || idx) ? (
                            <button 
                              onClick={async () => {
                                const diferencia = parseFloat(editCantidad) - row.cantidad;
                                if (diferencia !== 0) {
                                  const nuevoRegistro = {
                                    pc: row.pc,
                                    categoria: row.categoria,
                                    articulo: row.articulo,
                                    nombre: row.nombre,
                                    color: row.color,
                                    idcolor: row.idcolor,
                                    cantidad: diferencia,
                                    fecha_manufactura: row.fecha_manufactura,
                                    transaccion: diferencia > 0 ? 'AJUSTE (+)' : 'AJUSTE (-)'
                                  };
                                  await addLoteMaterialColorRecord(nuevoRegistro);
                                }
                                setEditingId(null);
                                fetchLoteMaterialColor();
                              }}
                              className="text-success hover:text-green-600 transition-colors p-1.5 rounded-lg hover:bg-success/10 flex items-center justify-center shrink-0"
                              title="Guardar cambios"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                check
                              </span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingId(row.key || idx);
                                setEditCantidad(row.cantidad);
                              }}
                              className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10 flex items-center justify-center shrink-0"
                              title="Editar cantidad"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-black text-secondary bg-secondary/5 px-3 py-1.5 rounded-lg">
                          {row.pc || '—'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 text-sm uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                          {row.categoria || '—'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-semibold text-slate-700 uppercase text-sm">{row.articulo || '—'}</td>
                      <td className="p-4 whitespace-nowrap font-semibold text-slate-700 uppercase text-sm">{row.nombre || '—'}</td>
                      <td className="p-4 whitespace-nowrap font-semibold text-slate-700 uppercase text-sm">
                        {row.color ? (
                          <div className="flex items-center gap-2">
                             <span className="font-semibold">{row.color}</span>
                             <span className="text-xs text-slate-400">({row.idcolor || '—'})</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap font-bold font-mono text-slate-800 text-base">
                        {editingId === (row.key || idx) ? (
                          <input 
                            type="number"
                            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={editCantidad}
                            onChange={(e) => setEditCantidad(e.target.value)}
                            autoFocus
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const diferencia = parseFloat(editCantidad) - row.cantidad;
                                if (diferencia !== 0) {
                                  const nuevoRegistro = {
                                    pc: row.pc,
                                    categoria: row.categoria,
                                    articulo: row.articulo,
                                    nombre: row.nombre,
                                    color: row.color,
                                    idcolor: row.idcolor,
                                    cantidad: diferencia,
                                    fecha_manufactura: row.fecha_manufactura,
                                    transaccion: diferencia > 0 ? 'AJUSTE (+)' : 'AJUSTE (-)'
                                  };
                                  await addLoteMaterialColorRecord(nuevoRegistro);
                                }
                                setEditingId(null);
                                fetchLoteMaterialColor();
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                          />
                        ) : (
                          row.cantidad != null ? parseFloat(row.cantidad).toLocaleString() : '—'
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap font-bold text-slate-500 text-sm">
                        {row.fecha_manufactura ? new Date(row.fecha_manufactura).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap font-bold text-slate-500 text-sm">
                        {row.fechaVencimientoStr}
                      </td>
                      <td className="p-4 whitespace-nowrap font-bold text-slate-500 text-sm">
                        {row.diasRestantes !== '—' ? (
                          <span className={row.diasRestantes < 0 ? 'text-danger' : (row.diasRestantes <= 30 ? 'text-warning' : '')}>
                            {row.diasRestantes}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-center">
                        <span className={`${badgeClass} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Scrollbar Customization */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
