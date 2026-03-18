import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function TransferForm() {
  const { planificacion, transferencias, addMultipleTransferencias, fetchTransferencias, clearTransferencias, loading } = useStore();
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre_color: '',
    modulo: '',
    cantidad: ''
  });

  const [localTransferencias, setLocalTransferencias] = useState([]);
  const [msg, setMsg] = useState(null);

  const inventoryData = useMemo(() => {
    const dataMap = {};
    planificacion.forEach(p => {
      const key = `${p.producto} - ${p.nombre_color}`;
      if (!dataMap[key]) {
        dataMap[key] = {
          sku: p.sku || p.producto,
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          planned: 0,
          transferred: 0
        };
      }
      dataMap[key].planned += parseInt(p.cantidad || 0, 10);
    });

    transferencias.forEach(t => {
      const key = `${t.producto} - ${t.nombre_color}`;
      if (dataMap[key]) {
        dataMap[key].transferred += parseInt(t.cantidad || 0, 10);
      }
    });

    return Object.values(dataMap);
  }, [planificacion, transferencias]);

  const selectedItem = useMemo(() => {
    return inventoryData.find(item => item.sku === formData.sku);
  }, [inventoryData, formData.sku]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const qty = parseInt(formData.cantidad, 10);
    if (!formData.sku || !selectedItem) {
      alert('Por favor seleccione un producto.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      alert('Ingrese una cantidad válida.');
      return;
    }

    const nuevoRegistro = {
      id: Date.now(),
      sku: `${selectedItem.producto}${selectedItem.color}`,
      fecha_transferencia: new Date().toISOString(),
      producto: selectedItem.producto,
      color: selectedItem.color,
      nombre_color: selectedItem.nombre_color,
      modulo: formData.modulo,
      cantidad: qty,
      yardas: selectedItem.producto === '60 08 180' ? qty * 1125 : qty * 3000
    };

    setLocalTransferencias([nuevoRegistro, ...localTransferencias]);
    setMsg({ type: 'success', text: `Registered locally.` });
    setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpload = async () => {
    if (localTransferencias.length === 0) return;
    if (!window.confirm(`Subir ${localTransferencias.length} registros?`)) return;

    const recordsToUpload = localTransferencias.map(t => ({
      sku: t.sku,
      fecha_transferencia: t.fecha_transferencia,
      producto: t.producto,
      color: t.color,
      nombre_color: t.nombre_color,
      modulo: t.modulo,
      cantidad: t.yardas
    }));

    const res = await addMultipleTransferencias(recordsToUpload);
    if (res) {
      setLocalTransferencias([]);
      fetchTransferencias();
      alert("Success!");
    }
  };

  const handleClearTrans = async () => {
    if (window.confirm("Borrar tabla permanente?")) {
      const res = await clearTransferencias();
      if (res) fetchTransferencias();
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto">
      <section className="font-headline">
        <h2 className="text-4xl font-black text-primary tracking-tighter">Material Registration</h2>
        <p className="text-on-surface-variant font-medium mt-2">Log production transfers and yardage calculations.</p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-container/20 to-primary-container/5 px-10 flex items-center gap-6 border-b border-outline-variant/10">
          <div className="bg-primary p-4 rounded-xl text-white shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-primary font-headline">Production Details</h3>
            <p className="text-on-surface-variant text-sm font-medium">Capture real-time site data.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">texture</span> Hilo-Color
              </label>
              <select 
                className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-4 px-4 rounded-t-lg font-body"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                required
              >
                <option value="" disabled>Seleccione SKU</option>
                {inventoryData.map(item => (
                  <option key={`${item.producto}_${item.nombre_color}`} value={item.sku}>
                    {item.producto} - {item.nombre_color}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">palette</span> Color Code
              </label>
              <input 
                className="w-full bg-surface-container-low/50 border-none border-b-2 border-outline-variant text-sm py-4 px-4 rounded-t-lg font-body text-slate-400"
                value={selectedItem?.color || ''} 
                readOnly 
                placeholder="Auto-detected"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">grid_view</span> Module
              </label>
              <select 
                className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-4 px-4 rounded-t-lg font-body"
                value={formData.modulo}
                onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                required
              >
                <option value="" disabled>Select Module</option>
                <option value="1">Modulo 1</option>
                <option value="2">Modulo 2</option>
                <option value="3">Modulo 3</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">circle</span> Quantity (Units)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-4 px-4 rounded-t-lg font-body"
                  placeholder="0"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">UNS</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-slate-100 pt-8">
            <button 
              type="button" 
              onClick={() => setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '' })}
              className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
            >
              Reset
            </button>
            <button 
              type="submit" 
              disabled={loading || !selectedItem}
              className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl shadow-primary/20 hover:bg-[#0a1a2e] active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add entry
            </button>
          </div>
        </form>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-surface-container-low/50 px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="text-lg font-black font-headline text-primary uppercase tracking-tight">Session Log</h3>
          <div className="flex gap-4">
            <button 
              onClick={handleClearTrans}
              disabled={loading}
              className="px-4 py-2 bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all rounded-lg"
            >
              Clear DB
            </button>
            <button 
              onClick={handleUpload}
              disabled={loading || localTransferencias.length === 0}
              className="px-8 py-2 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-secondary/30 hover:bg-[#8f3400] active:scale-95 transition-all"
            >
              Sync Records
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/20 font-headline font-headline">
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Date</th>
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Product</th>
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Color</th>
                <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Mod</th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Yardage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body">
              {localTransferencias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-300 italic text-sm">No session records found.</td>
                </tr>
              ) : (
                localTransferencias.map(t => (
                  <tr key={t.id} className="hover:bg-primary-fixed/5 transition-colors">
                    <td className="px-8 py-4 text-xs font-medium text-slate-400 tabular-nums">{t.fecha_transferencia?.split('T')[0]}</td>
                    <td className="px-8 py-4">
                      <p className="text-sm font-black text-primary font-headline">{t.producto}</p>
                      <p className="text-[10px] text-slate-400">SKU: {t.sku}</p>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm ring-1 ring-slate-100" style={{ backgroundColor: t.color }}></div>
                        <span className="text-xs font-semibold text-slate-600">{t.nombre_color}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center text-sm font-black text-primary">{t.modulo}</td>
                    <td className="px-8 py-4 text-right">
                      <p className="text-sm font-black text-secondary tabular-nums">{t.yardas?.toLocaleString()} YDS</p>
                      <p className="text-[10px] text-slate-400 font-bold">{t.cantidad} Units</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

