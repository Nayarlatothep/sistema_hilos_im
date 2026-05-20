import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function IngresoLotes() {
  const { 
    materiales_color, 
    fetchMaterialesColor, 
    lotes_procesados, 
    addLoteProcesado, 
    removeLoteProcesado, 
    loadLotesProcesados,
    uploadLoteMaterialColor,
    loading, 
    error 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryProcessed, setSearchQueryProcessed] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal & Duplication State
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pcCode, setPcCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fechaManu, setFechaManu] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Fetch initial data on mount
  useEffect(() => {
    fetchMaterialesColor();
    loadLotesProcesados();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMaterialesColor();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Auto-detect columns of materials_color table
  const getCatalogColumns = () => {
    if (!materiales_color || materiales_color.length === 0) return [];
    return Object.keys(materiales_color[0]).filter(key => 
      !['id', 'created_at', 'updated_at', 'id_color', 'id_material'].includes(key)
    );
  };

  const catalogColumns = getCatalogColumns();

  // Auto-detect columns of the lotes_procesados table
  const getProcessedColumns = () => {
    if (!lotes_procesados || lotes_procesados.length === 0) return [];
    return Object.keys(lotes_procesados[0]).filter(key => 
      !['id', 'created_at', 'updated_at', 'id_color', 'id_material'].includes(key)
    );
  };

  const processedColumns = getProcessedColumns();

  // Format headers to Capitalized Spaced Text
  const formatHeader = (header) => {
    return header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Open modal to duplicate a row
  const handleOpenDuplicationModal = (item) => {
    setSelectedMaterial(item);
    // Suggest a sequential PC code as a simple number (formatted as PC-000x in display/db)
    const seq = String(lotes_procesados.length + 1);
    setPcCode(seq);
    setQuantity('');
    setShowModal(true);
  };

  // Save duplicated item with custom fields
  const handleConfirmDuplication = (e) => {
    e.preventDefault();
    if (!pcCode || !quantity || quantity <= 0) {
      alert("Por favor rellene los campos obligatorios.");
      return;
    }

    const newProcessedLote = {
      ...selectedMaterial, // Copy all fields from Supabase materials_color
      id: `proc-${Date.now()}`, // Generate new unique ID
      PC: pcCode,
      Cantidad: parseFloat(quantity),
      Fecha_manu: fechaManu
    };

    addLoteProcesado(newProcessedLote);
    setShowModal(false);
    setSelectedMaterial(null);
  };

  // Sync session log to Supabase table lote_material_color
  const handleSyncToDatabase = async () => {
    if (lotes_procesados.length === 0) return;
    const confirmUpload = window.confirm(`¿Desea subir los ${lotes_procesados.length} registros de producción de hilos a la base de datos permanente en Supabase (tabla lote_material_color)?`);
    if (!confirmUpload) return;

    const result = await uploadLoteMaterialColor(lotes_procesados);
    if (result) {
      alert("¡Éxito! Los lotes han sido registrados en Supabase y la bitácora local ha sido actualizada.");
    } else {
      alert("Hubo un error al registrar los lotes. Por favor, intente de nuevo.");
    }
  };

  // Filters
  const filteredCatalog = (materiales_color || []).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(item).some(val => 
      val !== null && String(val).toLowerCase().includes(q)
    );
  });

  const filteredProcessed = (lotes_procesados || []).filter(item => {
    if (!searchQueryProcessed) return true;
    const q = searchQueryProcessed.toLowerCase();
    return Object.values(item).some(val => 
      val !== null && String(val).toLowerCase().includes(q)
    );
  });

  // KPI Computations for processed lots
  const totalLotesProcesados = lotes_procesados.length;
  const totalCantidadProcesada = lotes_procesados.reduce((sum, item) => sum + (parseFloat(item.Cantidad) || 0), 0);
  
  const getDominantPc = () => {
    if (lotes_procesados.length === 0) return 'Ninguno';
    const freqs = {};
    lotes_procesados.forEach(l => {
      const pc = l.PC || 'N/A';
      freqs[pc] = (freqs[pc] || 0) + 1;
    });
    const topPc = Object.entries(freqs).sort((a, b) => b[1] - a[1])[0][0];
    const rawPc = String(topPc).trim();
    return rawPc.toUpperCase().startsWith('PC-') ? rawPc : `PC-000${rawPc}`;
  };

  const uniqueSkusProcesados = new Set(lotes_procesados.map(l => l.sku || l.producto || l.material).filter(Boolean)).size;

  // Render cell content beautifully
  const renderCellContent = (value, colName) => {
    if (value === null || value === undefined) return <span className="text-slate-300">—</span>;

    // Color representations
    if (typeof value === 'string' && value.startsWith('#') && value.length === 7) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: value }} />
          <span className="font-mono text-xs font-bold text-slate-600">{value}</span>
        </div>
      );
    }

    // Dates
    if (colName.toLowerCase().includes('fecha') || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      return <span className="font-bold text-slate-500">{new Date(value).toLocaleDateString()}</span>;
    }

    // Quantity / Cones / Cantidad
    if (typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)) && (colName.toLowerCase().includes('cant') || colName.toLowerCase().includes('stock')))) {
      return <span className="font-bold font-mono text-slate-800">{parseFloat(value).toLocaleString()}</span>;
    }

    // PC Column Highlight
    if (colName === 'PC' || colName === 'pc') {
      const rawPc = String(value).trim();
      const formattedPc = rawPc.toUpperCase().startsWith('PC-') ? rawPc : `PC-000${rawPc}`;
      return <span className="text-xs font-mono font-black text-secondary bg-secondary/5 px-2.5 py-1 rounded-lg">{formattedPc}</span>;
    }

    // Text
    return <span className="font-semibold text-slate-700 uppercase">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-2">
      
      {/* Header Section */}
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] font-headline">Operaciones de Planta</p>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-black font-headline text-primary tracking-tighter uppercase leading-none">Ingreso y Duplicación de Lotes</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Catálogo de Materiales Supabase + Procesamiento de Producción
            </p>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="px-6 py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-bold font-headline text-xs tracking-wider uppercase shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-75"
          >
            <span className={`material-symbols-outlined text-[16px] ${(loading || refreshing) ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {loading || refreshing ? 'Cargando...' : 'Actualizar Catálogo'}
          </button>
        </div>
      </section>

      {/* Bento Grid Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Lotes Procesados Card */}
        <div className="bg-[#2C3E50] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-slate-900/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">LOTES PROCESADOS</span>
            <span className="material-symbols-outlined text-lg">content_copy</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">{totalLotesProcesados}</span>
        </div>

        {/* Cantidad Total Card */}
        <div className="bg-[#1B2A4A] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">CANTIDAD EN PROCESO</span>
            <span className="material-symbols-outlined text-lg">donut_large</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">
            {totalCantidadProcesada.toLocaleString()}
          </span>
        </div>

        {/* PC Principal Card */}
        <div className="bg-[#003B46] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">ORDEN PC PRINCIPAL</span>
            <span className="material-symbols-outlined text-lg">tag</span>
          </div>
          <span className="text-xl font-black text-white font-headline uppercase leading-none truncate" title={getDominantPc()}>
            {getDominantPc()}
          </span>
        </div>

        {/* SKUs en Proceso Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between h-32 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">PRODUCTOS DIFERENTES</span>
            <span className="material-symbols-outlined text-lg text-primary/70">inventory_2</span>
          </div>
          <span className="text-4xl font-black text-primary font-headline leading-none">{uniqueSkusProcesados}</span>
        </div>

      </div>

      {/* SECTION 1: Catálogo de Materiales Color (Supabase) */}
      <div className="flex flex-col gap-4">
        
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">folder_open</span>
            Catálogo de Materiales Color (Supabase)
          </h3>
        </div>

        {/* Search Bar Catalog */}
        <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20">
          <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
          <input 
            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-600 placeholder:text-slate-400" 
            placeholder="Buscar material en el catálogo de Supabase..." 
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

        {/* Catalog Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[300px] max-h-[450px] flex flex-col">
          <div className="overflow-y-auto flex-grow custom-scrollbar">
            {loading && filteredCatalog.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Consultando Catálogo...</p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <span className="material-symbols-outlined text-4xl opacity-30">database_off</span>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Catálogo Vacío o sin coincidencias</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    {catalogColumns.map((colName) => (
                      <th key={colName} className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {formatHeader(colName)}
                      </th>
                    ))}
                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((item, rowIndex) => (
                    <tr key={item.id || rowIndex} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      {catalogColumns.map((colName) => (
                        <td key={colName} className="p-4 whitespace-nowrap">
                          {renderCellContent(item[colName], colName)}
                        </td>
                      ))}
                      {/* Action button + */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleOpenDuplicationModal(item)}
                          className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-90 transition-all flex items-center justify-center"
                          title="Duplicar y Agregar PC, Cantidad y Fecha"
                        >
                          <span className="material-symbols-outlined text-lg font-bold">add</span>
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

      {/* SECTION 2: Registro de Lotes de Producción (Procesados) */}
      <div className="flex flex-col gap-4 mt-4">
        
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">inventory</span>
            Bitácora de Lotes de Producción Procesados (Sesión Local)
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {filteredProcessed.length} lotes listos
            </span>
            <button
              onClick={handleSyncToDatabase}
              disabled={loading || lotes_procesados.length === 0}
              className={`px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold font-headline text-[10px] tracking-wider uppercase shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Sincronizar y Guardar registros en la tabla lote_material_color de Supabase"
            >
              <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'sync' : 'cloud_upload'}
              </span>
              {loading ? 'Subiendo...' : 'Actualizar Tabla'}
            </button>
          </div>
        </div>

        {/* Search Bar Processed */}
        <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20">
          <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
          <input 
            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-600 placeholder:text-slate-400" 
            placeholder="Buscar lote procesado por PC, SKU, color..." 
            type="text"
            value={searchQueryProcessed}
            onChange={(e) => setSearchQueryProcessed(e.target.value)}
          />
          {searchQueryProcessed && (
            <button onClick={() => setSearchQueryProcessed('')} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-md">close</span>
            </button>
          )}
        </div>

        {/* Processed Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[300px] flex flex-col">
          <div className="overflow-x-auto flex-grow custom-scrollbar">
            {filteredProcessed.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <span className="material-symbols-outlined text-4xl opacity-30">layers_clear</span>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Sin Lotes Procesados</p>
                <p className="text-xs text-slate-400">Haz clic en el botón (+) de cualquier fila en el catálogo superior.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {processedColumns.map((colName) => (
                      <th key={colName} className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {formatHeader(colName)}
                      </th>
                    ))}
                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcessed.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      {processedColumns.map((colName) => (
                        <td key={colName} className="p-4 whitespace-nowrap">
                          {renderCellContent(item[colName], colName)}
                        </td>
                      ))}
                      {/* Delete button */}
                      <td className="p-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => removeLoteProcesado(item.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar Registro"
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

      {/* POPUP MODAL (Add PC, Cantidad, Fecha_manu) */}
      {showModal && selectedMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1128]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="bg-[#2C3E50] p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Copiando Datos de Catálogo</span>
                <h4 className="text-lg font-black font-headline uppercase tracking-tight mt-1">Registrar Información Adicional</h4>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Read-Only Details */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-4">
              {catalogColumns.slice(0, 4).map(col => (
                <div key={col}>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{formatHeader(col)}</p>
                  <p className="text-xs font-bold text-slate-700 mt-1 uppercase truncate">
                    {String(selectedMaterial[col] || '—')}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleConfirmDuplication} className="p-6 flex flex-col gap-4">
              
              {/* PC Input */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CÓDIGO PC (PROD. CONTROL) *</label>
                <input 
                  type="text"
                  placeholder="Ej. 105"
                  value={pcCode}
                  onChange={(e) => setPcCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"
                  required
                />
              </div>

              {/* Cantidad Input */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CANTIDAD (UNIDADES/YARDAS) *</label>
                <input 
                  type="number"
                  placeholder="Ej. 150000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"
                  required
                  min="0.01"
                  step="any"
                />
              </div>

              {/* Fecha_manu Input */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">FECHA DE MANUFACTURA (FECHA_MANU)</label>
                <input 
                  type="date"
                  value={fechaManu}
                  onChange={(e) => setFechaManu(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      console.warn("showPicker not supported", err);
                    }
                  }}
                  onFocus={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      console.warn("showPicker not supported", err);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all cursor-pointer"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                >
                  Confirmar y Agregar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Scrollbar Customization */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />

    </div>
  );
}
