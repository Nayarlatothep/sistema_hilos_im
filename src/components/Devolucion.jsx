import React, { useState } from 'react';

export default function Devolucion() {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for returns
  const returnItems = [
    { id: 1, producto: 'Premium Matte Vinyl', colorCode: '#2D3E50', colorName: 'Navy', qty: '500 units', status: 'PENDIENTE', statusColor: 'bg-amber-100 text-amber-800' },
    { id: 2, producto: 'Industrial Grade Epoxy', colorCode: '#F2C94C', colorName: 'Amber', qty: '1.2k units', status: 'EN PROCESO', statusColor: 'bg-blue-100 text-blue-800' },
    { id: 3, producto: 'Synthetic Mesh Fabric', colorCode: '#EB5757', colorName: 'Coral', qty: '300 units', status: 'URGENTE', statusColor: 'bg-rose-100 text-rose-800' },
    { id: 4, producto: 'Polyester Composite', colorCode: '#27AE60', colorName: 'Forest', qty: '750 units', status: 'COMPLETADO', statusColor: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] font-headline">Sistema de Re-ingreso</p>
        <div className="flex justify-between items-end">
          <h2 className="text-4xl font-black font-headline text-primary tracking-tighter uppercase">Gestión de Devolución</h2>
        </div>
      </section>

      {/* Persistent Search Bar */}
      <div className="mt-2">
        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20">
          <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
          <input 
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-600 placeholder:text-slate-400" 
            placeholder="Buscar hilos por nombre o color..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Stats Bento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1 bg-primary p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-primary/10">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">HILOS POR RETORNAR</span>
          <span className="text-4xl font-black text-white font-headline">24</span>
        </div>
        <div className="col-span-1 grid grid-rows-2 gap-4">
          <div className="bg-white p-4 rounded-xl flex items-center justify-between border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URGENTES</span>
            <span className="text-xl font-black text-rose-500 font-headline">08</span>
          </div>
          <div className="bg-white p-4 rounded-xl flex items-center justify-between border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EFICIENCIA</span>
            <span className="text-xl font-black text-emerald-500 font-headline">92%</span>
          </div>
        </div>
      </div>

      {/* Product List / Table */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-primary uppercase tracking-widest">Listado de Pendientes</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Actualizado hace 2m</span>
        </div>

        <div className="space-y-4">
          {returnItems.map(item => (
            <div key={item.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-primary/10 hover:shadow-md">
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">PRODUCTO</p>
                    <h3 className="text-base font-black text-primary font-headline uppercase leading-tight">{item.producto}</h3>
                  </div>
                  <div className={`${item.statusColor} px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm`}>
                    {item.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                  <div className="col-span-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CÓDIGO</p>
                    <p className="text-xs font-bold text-slate-600 font-mono">{item.colorCode}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">COLOR</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-100 shadow-inner" style={{ backgroundColor: item.colorCode }}></div>
                      <span className="text-xs font-bold text-slate-600">{item.colorName}</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CANTIDAD</p>
                    <p className="text-xs font-black text-primary tabular-nums">{item.qty}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scanner FAB (Contextual) */}
      <button className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 hover:bg-primary-container">
        <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
      </button>
    </div>
  );
}
