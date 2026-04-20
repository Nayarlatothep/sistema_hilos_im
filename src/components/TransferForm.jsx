import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function TransferForm() {
  const { 
    planificacion, 
    transferencias, 
    maestro_hilos,
    fetchMaestroHilos,
    addMultipleTransferencias, 
    fetchTransferencias, 
    clearTransferencias, 
    loading, 
    getAvailableModules 
  } = useStore();
  const availableModules = React.useMemo(() => getAvailableModules(), [planificacion, transferencias]);
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre_color: '',
    modulo: '',
    cantidad: ''
  });

  const [localTransferencias, setLocalTransferencias] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchMaestroHilos();
  }, [fetchMaestroHilos]);

  const inventoryData = useMemo(() => {
    return maestro_hilos.map(m => ({
      sku: m.sku || m.articulo || '',
      producto: m.articulo || '',
      color: m.cod_color || m.color || '',
      nombre_color: m.nombre_color || '',
      class_abc: m.class_abc || '',
      cod_articulo: m.cod_articulo || '',
      cantidad_kyd: m.cantidad_kyd || '',
      planned: 0,
      transferred: 0
    })).sort((a, b) => (a.producto || '').localeCompare(b.producto || ''));
  }, [maestro_hilos]);

  const selectedItem = useMemo(() => {
    return inventoryData.find(item => item.sku === formData.sku);
  }, [inventoryData, formData.sku]);

  const [filterText, setFilterText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const filteredItems = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    const isSelectedMatch = selectedItem && `${selectedItem.producto} - ${selectedItem.nombre_color}` === filterText;
    if (!q || isSelectedMatch) return inventoryData;
    return inventoryData.filter(item => 
      String(item.producto).toLowerCase().includes(q) || 
      String(item.nombre_color).toLowerCase().includes(q)
    );
  }, [inventoryData, filterText, selectedItem]);

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
      yardas: (selectedItem.producto === '60 08 180' || selectedItem.producto === '60 08 0180') ? qty * 1225 : qty * 3000
    };

    setLocalTransferencias([nuevoRegistro, ...localTransferencias]);
    setMsg({ type: 'success', text: `Registered locally.` });
    setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '' });
    setFilterText('');
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
      alert("¡Éxito!");
    }
  };

  const handleClearTrans = async () => {
    if (window.confirm("Borrar tabla permanente?")) {
      const res = await clearTransferencias();
      if (res) fetchTransferencias();
    }
  };

  const handleDeleteLocal = (id) => {
    setLocalTransferencias(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto">
      <section className="font-headline">
        <h2 className="text-4xl font-black text-primary tracking-tighter">Traslado a Almacén de Producción</h2>
        <p className="text-on-surface-variant font-medium mt-2">Registro de transferencias y cálculo de yardaje.</p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-container/20 to-primary-container/5 px-10 flex items-center gap-6 border-b border-outline-variant/10">
          <div className="bg-primary p-4 rounded-xl text-white shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-primary font-headline">Detalles de Producción</h3>
            <p className="text-on-surface-variant text-sm font-medium">Captura de datos de planta en tiempo real.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">texture</span> Hilo-Color
              </label>
              <div className="relative group">
                <input 
                  type="text"
                  className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-4 px-4 rounded-t-lg font-body placeholder:text-slate-300"
                  placeholder="Buscar Producto o Color..."
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setShowOptions(true);
                    if (!e.target.value) setFormData({...formData, sku: ''});
                  }}
                  onFocus={() => setShowOptions(true)}
                  onBlur={() => setTimeout(() => setShowOptions(false), 200)}
                  autoComplete="off"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-transform group-focus-within:rotate-180">
                  expand_more
                </span>
                
                {showOptions && (
                  <div className="absolute left-0 right-0 top-full bg-white border border-outline-variant shadow-2xl rounded-b-xl z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <div 
                          key={`${item.producto}_${item.nombre_color}`}
                          onMouseDown={() => {
                            setFormData({...formData, sku: item.sku});
                            setFilterText(`${item.producto} - ${item.nombre_color}`);
                            setShowOptions(false);
                          }}
                          className="px-6 py-4 hover:bg-primary/5 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                        >
                          <p className="text-sm font-black text-primary font-headline">{item.producto}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {item.nombre_color}
                          </p>
                          {item.class_abc && (
                            <div className="mt-1">
                              <span className="bg-slate-200 text-slate-900 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">ABC: {item.class_abc}</span>
                            </div>
                          )}
                          <p className="text-[9px] text-slate-300 font-medium mt-1">
                            {item.cod_articulo} - {item.cantidad_kyd}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-10 text-center text-slate-400 italic text-sm font-body">
                        No se encontraron coincidencias
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">palette</span> Código de Color
              </label>
              <input 
                className="w-full bg-surface-container-low/50 border-none border-b-2 border-outline-variant text-sm py-4 px-4 rounded-t-lg font-body text-slate-400"
                value={selectedItem?.color || ''} 
                readOnly 
                placeholder="Auto-detección"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">grid_view</span> Módulo
              </label>
              <select 
                className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-4 px-4 rounded-t-lg font-body"
                value={formData.modulo}
                onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                required
              >
                <option value="" disabled>Seleccione Módulo</option>
                {availableModules.map(mod => (
                  <option key={mod} value={mod}>Módulo {mod}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">circle</span> Cantidad (Unidades)
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
                onClick={() => {
                  setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '' });
                  setFilterText('');
                }}
                className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
              >
                Reiniciar
              </button>
              <button 
                type="submit" 
                disabled={loading || !selectedItem}
                className="px-10 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl shadow-primary/20 hover:bg-[#0a1a2e] active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span> Agregar Entrada
              </button>
          </div>
        </form>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-surface-container-low/50 px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="text-lg font-black font-headline text-primary uppercase tracking-tight">Bitácora de Sesión</h3>
          <div className="flex gap-4">
            <button 
              onClick={handleClearTrans}
              disabled={loading}
              className="px-4 py-2 bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all rounded-lg"
            >
              Limpiar DB
            </button>
            <button 
              onClick={handleUpload}
              disabled={loading || localTransferencias.length === 0}
              className={`px-8 py-2 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all
                ${(loading || localTransferencias.length === 0) 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'shadow-lg shadow-secondary/30 hover:bg-[#8f3400] active:scale-95'}`}
            >
              Sincronizar Registros
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
                <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body">
              {localTransferencias.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-slate-300 italic text-sm">No session records found.</td>
                </tr>
              ) : (
                localTransferencias.map(t => (
                  <tr key={t.id} className="hover:bg-primary-fixed/5 transition-colors group">
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
                    <td className="px-8 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteLocal(t.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-lg group-hover:opacity-100"
                        title="Borrar registro"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
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

