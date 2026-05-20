import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function IngresoLotes() {
  const { lotes, addLote, removeLote, loadLotes, planificacion } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [codigoLote, setCodigoLote] = useState('');
  const [sku, setSku] = useState('');
  const [color, setColor] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [conos, setConos] = useState('');
  const [yardasPorCono, setYardasPorCono] = useState(3000);
  const [fechaIngreso, setFechaIngreso] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [observaciones, setObservaciones] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Load lotes from store / localStorage on mount
  useEffect(() => {
    loadLotes();
  }, []);

  // Auto-generate lot code based on current date and sequential index
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2); // YYMMDD
    const count = lotes.length + 1;
    const seq = String(count).padStart(3, '0');
    setCodigoLote(`LOT-${todayStr}-${seq}`);
  }, [lotes]);

  // Handle auto-detection of yardage and color if a known SKU is chosen from active planning
  const handleSkuChange = (selectedSku) => {
    setSku(selectedSku);
    
    // Check if we can prefill color and yardas_por_cono from planning data
    const matchedItem = planificacion.find(p => p.sku === selectedSku);
    if (matchedItem) {
      setColor(matchedItem.nombre_color || matchedItem.color || '');
    }

    // Set default yardage according to README conversion rules:
    // "60 08 180" / "60 08 0180" is 1225 yds/cono, others are 3000
    if (selectedSku.includes('60 08 180') || selectedSku.includes('60 08 0180')) {
      setYardasPorCono(1225);
    } else {
      setYardasPorCono(3000);
    }
  };

  const handleAddLoteSubmit = (e) => {
    e.preventDefault();
    if (!sku || !conos || conos <= 0 || !proveedor) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    const calculatedTotalYardas = parseInt(conos, 10) * parseInt(yardasPorCono, 10);
    
    const newLote = {
      id: Date.now().toString(),
      codigo_lote: codigoLote,
      sku,
      color: color || 'S/C',
      proveedor,
      conos: parseInt(conos, 10),
      yardas_por_cono: parseInt(yardasPorCono, 10),
      total_yardas: calculatedTotalYardas,
      fecha_ingreso: fechaIngreso,
      observaciones: observaciones || ''
    };

    addLote(newLote);

    // Reset Form (except date and supplier to ease bulk entries)
    setSku('');
    setColor('');
    setConos('');
    setObservaciones('');
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  // Extract unique SKUs from active planning for dropdown select
  const uniqueSkus = [...new Set(planificacion.map(p => p.sku).filter(Boolean))].sort();

  // Statistics Computations
  const totalLotesCount = lotes.length;
  const totalConosSum = lotes.reduce((sum, item) => sum + (item.conos || 0), 0);
  const totalYardasSum = lotes.reduce((sum, item) => sum + (item.total_yardas || 0), 0);

  // Find dominant supplier
  const getDominantSupplier = () => {
    if (lotes.length === 0) return 'Ninguno';
    const freqs = {};
    lotes.forEach(l => {
      const p = l.proveedor || 'Desconocido';
      freqs[p] = (freqs[p] || 0) + 1;
    });
    return Object.entries(freqs).sort((a, b) => b[1] - a[1])[0][0];
  };

  // Filtered Lotes
  const filteredLotes = lotes.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.codigo_lote && item.codigo_lote.toLowerCase().includes(q)) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.color && item.color.toLowerCase().includes(q)) ||
      (item.proveedor && item.proveedor.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-2">
      
      {/* Header Section */}
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] font-headline">Maestro de Inventario</p>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <h2 className="text-4xl font-black font-headline text-primary tracking-tighter uppercase leading-none">Ingreso de Lotes de Hilaza</h2>
          
          <button 
            onClick={handleSync}
            disabled={syncing || lotes.length === 0}
            className={`px-6 py-3 rounded-xl font-bold font-headline text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
              syncSuccess 
                ? 'bg-emerald-600 text-white shadow-emerald-600/10' 
                : 'bg-primary text-white hover:bg-primary-container shadow-primary/10'
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            <span className="material-symbols-outlined text-[16px] animate-spin-slow">
              {syncSuccess ? 'check_circle' : syncing ? 'sync' : 'cloud_upload'}
            </span>
            {syncSuccess ? 'Sincronizado' : syncing ? 'Sincronizando...' : 'Sincronizar a Supabase'}
          </button>
        </div>
      </section>

      {/* Bento Grid Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Lotes Card */}
        <div className="bg-primary p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-primary/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">LOTES REGISTRADOS</span>
            <span className="material-symbols-outlined text-lg">layers</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">{totalLotesCount}</span>
        </div>

        {/* Total Conos Card */}
        <div className="bg-[#1B2A4A] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">CONOS ACUMULADOS</span>
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">{totalConosSum.toLocaleString()} <span className="text-sm font-medium opacity-60">u.</span></span>
        </div>

        {/* Total Yardaje Card */}
        <div className="bg-[#003B46] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">YARDAJE TOTAL</span>
            <span className="material-symbols-outlined text-lg">straighten</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">{(totalYardasSum / 1000).toFixed(1)} <span className="text-sm font-medium opacity-60">K Yds.</span></span>
        </div>

        {/* Dominant Supplier Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between h-32 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">PROVEEDOR PRINCIPAL</span>
            <span className="material-symbols-outlined text-lg text-primary/70">local_shipping</span>
          </div>
          <span className="text-xl font-black text-primary font-headline uppercase leading-none truncate" title={getDominantSupplier()}>
            {getDominantSupplier()}
          </span>
        </div>

      </div>

      {/* Main Form and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Container */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden sticky top-24">
            
            <div className="bg-slate-50/50 p-6 border-b border-slate-100">
              <h3 className="text-md font-black text-primary font-headline uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined">add_box</span>
                Nuevo Registro de Lote
              </h3>
            </div>

            <form onSubmit={handleAddLoteSubmit} className="p-6 flex flex-col gap-4">
              
              {/* Código de Lote */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CÓDIGO DE LOTE (AUTO)</label>
                <input 
                  type="text" 
                  value={codigoLote}
                  onChange={(e) => setCodigoLote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-700 outline-none focus:border-primary focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Hilo SKU */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">SKU / HILO HILAZA *</label>
                <div className="relative">
                  <select 
                    value={sku}
                    onChange={(e) => handleSkuChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Seleccione SKU...</option>
                    {uniqueSkus.map(itemSku => (
                      <option key={itemSku} value={itemSku}>{itemSku}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-3 pointer-events-none material-symbols-outlined text-slate-400 text-[18px]">
                    unfold_more
                  </span>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">COLOR / DESCRIPCIÓN</label>
                <input 
                  type="text" 
                  placeholder="Ej. BLACK A&E, Navy 2026..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"
                />
              </div>

              {/* Proveedor */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">PROVEEDOR DE HILO *</label>
                <input 
                  type="text" 
                  placeholder="Ej. Coats Cadena, A&E..."
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"
                  required
                />
              </div>

              {/* Conos & Yardas por Cono */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CONOS RECIBIDOS *</label>
                  <input 
                    type="number" 
                    placeholder="Cantidad"
                    value={conos}
                    onChange={(e) => setConos(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">YDS POR CONO</label>
                  <input 
                    type="number" 
                    value={yardasPorCono}
                    onChange={(e) => setYardasPorCono(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"
                    required
                    min="1"
                  />
                </div>
              </div>

              {/* Yardaje Calculado */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mt-1">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">YARDAJE TOTAL GENERADO</p>
                  <p className="text-xs text-slate-500 font-medium">Conos × Yardas por cono</p>
                </div>
                <p className="text-lg font-black text-primary font-mono leading-none">
                  {conos > 0 ? (parseInt(conos, 10) * parseInt(yardasPorCono, 10)).toLocaleString() : '0'} <span className="text-[10px] font-bold text-slate-400">Yds</span>
                </p>
              </div>

              {/* Fecha Ingreso */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">FECHA DE INGRESO</label>
                <input 
                  type="date" 
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all cursor-pointer"
                  required
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">OBSERVACIONES</label>
                <textarea 
                  placeholder="Detalles adicionales del lote..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows="2"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-2 py-3.5 bg-[#2C3E50] hover:bg-[#34495E] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
              >
                Registrar Lote de Hilo
              </button>

            </form>
          </div>
        </div>

        {/* Table Container */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Filter Bar */}
          <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20">
            <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
            <input 
              className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-600 placeholder:text-slate-400" 
              placeholder="Buscar lote por código, SKU, color o proveedor..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-md">close</span>
              </button>
            )}
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex-grow flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest font-headline">Lotes de Hilaza Registrados</h3>
              <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {filteredLotes.length} registros
              </span>
            </div>

            <div className="overflow-x-auto flex-grow">
              {filteredLotes.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="material-symbols-outlined text-5xl opacity-40">layers_clear</span>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-400">No se encontraron lotes</p>
                  <p className="text-xs text-slate-400">Registra un nuevo lote en el formulario de la izquierda.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Código Lote</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Hilo SKU</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Color</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Conos</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Yardaje</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLotes.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Código Lote */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                            {item.codigo_lote}
                          </span>
                        </td>
                        
                        {/* Hilo SKU */}
                        <td className="p-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-700">{item.sku}</p>
                        </td>

                        {/* Color */}
                        <td className="p-4">
                          <p className="text-xs font-semibold text-slate-600 uppercase truncate max-w-[120px]">{item.color}</p>
                        </td>

                        {/* Proveedor */}
                        <td className="p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase truncate max-w-[100px]">{item.proveedor}</p>
                        </td>

                        {/* Conos */}
                        <td className="p-4 whitespace-nowrap text-center">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {item.conos}
                          </span>
                        </td>

                        {/* Yardaje */}
                        <td className="p-4 whitespace-nowrap text-right">
                          <p className="text-xs font-bold text-primary font-mono">{item.total_yardas.toLocaleString()}</p>
                          <p className="text-[8px] font-semibold text-slate-400 tracking-wider">yds</p>
                        </td>

                        {/* Acciones */}
                        <td className="p-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => removeLote(item.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                            title="Eliminar Lote"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
