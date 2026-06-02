import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function ReporteLotes() {
  const { lotes_material_color, fetchLoteMaterialColor, loading, error } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLoteMaterialColor();
  }, []);

  const filteredLotes = (lotes_material_color || []).filter(row => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some(val => 
      val !== null && String(val).toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] font-headline">Historial</p>
          <h2 className="text-4xl font-black font-headline text-primary tracking-tighter uppercase leading-none mt-1">Reporte de Lotes</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchLoteMaterialColor()}
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

      {/* Search Bar */}
      <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20">
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
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">ID</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Código PC</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Categoría</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Artículo</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Nombre</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Color</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Cantidad</th>
                  <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Fecha Manu.</th>
                </tr>
              </thead>
              <tbody>
                {filteredLotes.map((row, idx) => (
                  <tr key={row.id || idx} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="p-5 whitespace-nowrap font-bold text-slate-400 text-sm">
                      #{row.id || '—'}
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      <span className="text-sm font-mono font-black text-secondary bg-secondary/5 px-3 py-1.5 rounded-lg">
                        {row.pc || '—'}
                      </span>
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      <span className="font-bold text-slate-700 text-sm uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                        {row.categoria || '—'}
                      </span>
                    </td>
                    <td className="p-5 whitespace-nowrap font-semibold text-slate-700 uppercase text-sm">{row.articulo || '—'}</td>
                    <td className="p-5 whitespace-nowrap font-semibold text-slate-700 uppercase text-sm">{row.nombre || '—'}</td>
                    <td className="p-5 whitespace-nowrap font-semibold text-slate-700 uppercase text-sm">
                      {row.color ? (
                        <div className="flex items-center gap-2">
                           <span className="font-semibold">{row.color}</span>
                           <span className="text-xs text-slate-400">({row.idcolor || '—'})</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-5 whitespace-nowrap font-bold font-mono text-slate-800 text-base">
                      {row.cantidad != null ? parseFloat(row.cantidad).toLocaleString() : '—'}
                    </td>
                    <td className="p-5 whitespace-nowrap font-bold text-slate-500 text-sm">
                      {row.fecha_manufactura ? new Date(row.fecha_manufactura).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
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
