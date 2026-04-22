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
  const availableModules = useMemo(() => getAvailableModules(), [planificacion, transferencias]);
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre_color: '',
    modulo: '',
    cantidad: '',
    comentario: ''
  });

  const [localTransferencias, setLocalTransferencias] = useState([]);
  const [msg, setMsg] = useState(null);

  const [entregaTipo, setEntregaTipo] = useState('individual'); // 'individual' | 'proceso'
  const [procesoSelected, setProcesoSelected] = useState('');

  const procesosList = ['Preparados', 'Partes Traseras', 'Empaque', 'Distribución Total'];

  useEffect(() => {
    fetchMaestroHilos();
  }, [fetchMaestroHilos]);

  const inventoryData = useMemo(() => {
    return maestro_hilos.map(m => {
      const prod = String(m.articulo || '').trim();
      // Default unit values (in Kyds)
      const defaultKyd = (prod.includes('60 08 180') || prod.includes('60 08 0180')) ? 1.225 : 3;
      
      return {
        sku: m.sku || m.articulo || '',
        producto: m.articulo || '',
        color: m.cod_color || m.color || '',
        nombre_color: m.nombre_color || '',
        class_abc: m.class_abc || '',
        cod_articulo: m.cod_articulo || '',
        cantidad_conos: m.cantidad_conos || m.cantidad_kyd || defaultKyd,
        cantidad_kyd: parseFloat(m.cantidad_kyd || m.cantidad_conos || defaultKyd),
        planned: 0,
        transferred: 0
      };
    }).sort((a, b) => (a.producto || '').localeCompare(b.producto || ''));
  }, [maestro_hilos]);

  const selectedItem = useMemo(() => {
    return inventoryData.find(item => item.sku === formData.sku);
  }, [inventoryData, formData.sku]);

  const [filterText, setFilterText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const filteredItems = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    
    // Don't show options if the query is empty
    if (!q) return [];

    // Check if the query matches the currently selected item label exactly to avoid showing the dropdown again
    const isSelectedMatch = selectedItem && `${selectedItem.producto} - ${selectedItem.nombre_color}`.toLowerCase() === q;
    if (isSelectedMatch) return [];

    const words = q.split(/\s+/);
    return inventoryData.filter(item => {
      const searchableText = `
        ${item.producto} 
        ${item.nombre_color} 
        ${item.color} 
        ${item.cod_articulo} 
        ${item.sku}
      `.toLowerCase();
      
      // All words in the query must be found in the searchable text (AND logic)
      return words.every(word => searchableText.includes(word));
    }).slice(0, 50); // Limit results for performance
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

    let registrosNuevos = [];
    const kydValue = selectedItem.cantidad_kyd || 3;
    const totalYardage = qty * kydValue * 1000;

    if (entregaTipo === 'individual') {
      if (!formData.modulo) {
        alert('Seleccione un módulo.');
        return;
      }
      registrosNuevos.push({
        id: Date.now(),
        sku: `${selectedItem.producto}${selectedItem.color}`,
        fecha_transferencia: new Date().toISOString(),
        producto: selectedItem.producto,
        color: selectedItem.color,
        nombre_color: selectedItem.nombre_color,
        modulo: formData.modulo,
        cantidad: qty,
        yardas: totalYardage,
        comentario: formData.comentario
      });
    } else {
      // MODO PROCESO: Distribución automática
      if (!procesoSelected) {
        alert('Seleccione un proceso para distribuir.');
        return;
      }

      // Buscar módulos que necesiten este hilo en la planificación
      const normalize = (s) => String(s || '').trim().toUpperCase();
      const targetProd = normalize(selectedItem.producto);
      const targetColor = normalize(selectedItem.color);

      const modulesPlanned = planificacion.filter(p => 
        normalize(p.producto) === targetProd && 
        normalize(p.color) === targetColor
      ).map(p => String(p.modulo).trim()).filter(Boolean);

      const uniqueModules = Array.from(new Set(modulesPlanned));

      if (uniqueModules.length === 0) {
        alert(`No hay planificación activa para ${selectedItem.producto} en ningún módulo. No se puede realizar la distribución automática.`);
        return;
      }

      const qtyPerMod = Math.floor(qty / uniqueModules.length);
      const remainder = qty % uniqueModules.length;

      uniqueModules.forEach((modId, index) => {
          const finalQty = qtyPerMod + (index === 0 ? remainder : 0);
          if (finalQty === 0) return;

          registrosNuevos.push({
            id: Date.now() + index,
            sku: `${selectedItem.producto}${selectedItem.color}`,
            fecha_transferencia: new Date().toISOString(),
            producto: selectedItem.producto,
            color: selectedItem.color,
            nombre_color: selectedItem.nombre_color,
            modulo: modId,
            cantidad: finalQty,
            yardas: finalQty * kydValue * 1000,
            comentario: `[PROCESO: ${procesoSelected}] ${formData.comentario}`.trim()
          });
      });
    }

    setLocalTransferencias([...registrosNuevos, ...localTransferencias]);
    setMsg({ type: 'success', text: `Registrado: ${registrosNuevos.length} entrada(s).` });
    
    // Clear all fields as requested by the user
    setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '', comentario: '' });
    setFilterText('');
    setProcesoSelected('');
    
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
      cantidad: t.yardas,
      comentario: t.comentario
    }));

    const res = await addMultipleTransferencias(recordsToUpload);
    if (res) {
      setLocalTransferencias([]);
      fetchTransferencias();
      alert("¡Éxito!");
    }
  };

  const handleClearTrans = async () => {
    const password = window.prompt("Ingrese la contraseña de seguridad para borrar la tabla:");
    if (password !== "shim2022+") {
      alert("Contraseña incorrecta. Operación cancelada.");
      return;
    }

    if (window.confirm("¿Está seguro de que desea borrar la tabla permanente? Esta acción no se puede deshacer.")) {
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
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{item.nombre_color}</span>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {item.class_abc && (
                                <span className="bg-slate-200 text-slate-900 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">ABC: {item.class_abc}</span>
                              )}
                              <p className="text-[9px] text-slate-900 font-black whitespace-nowrap">
                                {item.cod_articulo} - {item.cantidad_conos}Kyds
                              </p>
                            </div>
                          </div>
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
                <span className="material-symbols-outlined text-sm">circle</span> Cantidad Total (Conos)
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">CONOS</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 md:col-span-2 bg-primary/5 p-6 rounded-xl border border-primary/10">
               <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="entregaTipo" 
                      checked={entregaTipo === 'individual'} 
                      onChange={() => setEntregaTipo('individual')}
                      className="w-4 h-4 text-primary focus:ring-primary/20"
                    />
                    <span className={`text-xs font-black uppercase tracking-widest ${entregaTipo === 'individual' ? 'text-primary' : 'text-slate-400'}`}>MODULOS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="entregaTipo" 
                      checked={entregaTipo === 'proceso'} 
                      onChange={() => setEntregaTipo('proceso')}
                      className="w-4 h-4 text-primary focus:ring-primary/20"
                    />
                    <span className={`text-xs font-black uppercase tracking-widest ${entregaTipo === 'proceso' ? 'text-primary' : 'text-slate-400'}`}>POR AREA DE PRODUCCION</span>
                  </label>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entregaTipo === 'individual' ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">grid_view</span> Módulo Destino
                      </label>
                      <select 
                        className="w-full bg-white border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-3 px-4 rounded-t-lg font-body"
                        value={formData.modulo}
                        onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                      >
                        <option value="" disabled>Seleccione Módulo</option>
                        {availableModules.map(mod => (
                          <option key={mod} value={mod}>Módulo {mod}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">account_tree</span> Area de Produccion
                      </label>
                      <select 
                        className="w-full bg-white border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-3 px-4 rounded-t-lg font-body"
                        value={procesoSelected}
                        onChange={(e) => setProcesoSelected(e.target.value)}
                      >
                        <option value="" disabled>Seleccione Proceso</option>
                        {procesosList.map(proc => (
                          <option key={proc} value={proc}>{proc}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant font-headline flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">comment</span> Observaciones Adicionales
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-white border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 text-sm py-3 px-4 rounded-t-lg font-body"
                      placeholder="Nota opcional..."
                      value={formData.comentario}
                      onChange={(e) => setFormData({...formData, comentario: e.target.value})}
                    />
                  </div>
               </div>
               
               {entregaTipo === 'proceso' && selectedItem && (
                 <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
                    <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                    <p className="text-[10px] text-blue-800 font-bold uppercase tracking-tight">
                      El sistema dividirá los {formData.cantidad || '0'} conos entre todos los módulos activos en el plan para {selectedItem.producto}.
                    </p>
                 </div>
               )}
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
          <h3 className="text-lg font-black font-headline text-primary uppercase tracking-tight">BITACORA DE HILOS</h3>
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
                      {t.comentario && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded w-fit italic">
                          "{t.comentario}"
                        </p>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm ring-1 ring-slate-100" style={{ backgroundColor: t.color }}></div>
                        <span className="text-xs font-semibold text-slate-600">{t.nombre_color}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center text-sm font-black text-primary">{t.modulo}</td>
                    <td className="px-8 py-4 text-right">
                      <p className="text-sm font-black text-secondary tabular-nums">{t.yardas?.toLocaleString()} Kyds</p>
                      <p className="text-[10px] text-slate-400 font-bold">{t.cantidad} Conos</p>
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

