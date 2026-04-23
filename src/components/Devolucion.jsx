import React from 'react';

export default function Devolucion() {
  return (
    <div className="flex flex-col gap-12">
      <section className="animate-in fade-in slide-in-from-top-4 duration-700">
        <p className="text-sm font-bold text-secondary uppercase tracking-[0.2em] mb-2 font-headline">Inventory Management</p>
        <div className="flex justify-between items-end">
          <h2 className="text-5xl font-black font-headline text-primary tracking-tighter uppercase">Devolución de Hilos</h2>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase font-headline">Control de Retorno</p>
            <p className="font-bold text-primary font-body">Módulo de Re-ingreso</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-primary/20">keyboard_return</span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-primary font-headline uppercase mb-2">Módulo en Desarrollo</h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            Estamos trabajando en la implementación del sistema de devoluciones para optimizar el retorno de sobrantes a bodega y el ajuste de inventario.
          </p>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximamente</div>
          <div className="px-6 py-2 bg-amber-100 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest italic">Fase de Diseño</div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-50 grayscale pointer-events-none">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <span className="material-symbols-outlined text-primary/30 mb-4">inventory_2</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paso 1</p>
          <p className="text-base font-black text-primary font-headline uppercase">Validación de Sobrante</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <span className="material-symbols-outlined text-primary/30 mb-4">qr_code_scanner</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paso 2</p>
          <p className="text-base font-black text-primary font-headline uppercase">Escaneo de Hilo</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <span className="material-symbols-outlined text-primary/30 mb-4">assignment_return</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paso 3</p>
          <p className="text-base font-black text-primary font-headline uppercase">Ajuste de Stock</p>
        </div>
      </div>
    </div>
  );
}
