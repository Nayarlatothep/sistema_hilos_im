import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function IngresoLotes() {
  const { materiales_color, fetchMaterialesColor, loading, error } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchMaterialesColor();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMaterialesColor();
    // Subtle delay to show animation
    setTimeout(() => setRefreshing(false), 800);
  };

  // Automatically detect columns based on data
  const getColumns = () => {
    if (!materiales_color || materiales_color.length === 0) return [];
    // We ignore typical internal system columns like 'id', 'created_at', 'updated_at' if they clutter
    return Object.keys(materiales_color[0]).filter(key => 
      !['id', 'created_at', 'updated_at', 'id_color', 'id_material'].includes(key)
    );
  };

  const columns = getColumns();

  // Helper to format column headers nicely
  const formatHeader = (header) => {
    return header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Filter materials based on search query
  const filteredData = (materiales_color || []).filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(val => 
      val !== null && String(val).toLowerCase().includes(query)
    );
  });

  // Smart calculations for Bento Stats Card
  const totalRegistros = filteredData.length;

  // Detect and sum any numeric columns (like 'cantidad', 'stock', 'yardas', 'metros', 'existencia')
  const getNumericStats = () => {
    if (filteredData.length === 0) return { name: 'Existencias', total: 0 };
    
    // Find first column that is frequently a number
    const targetKeys = ['cantidad', 'stock', 'yardas', 'metros', 'existencia', 'conos'];
    const activeKey = Object.keys(filteredData[0]).find(k => 
      targetKeys.includes(k.toLowerCase()) || typeof filteredData[0][k] === 'number'
    );

    if (!activeKey) return null;

    const totalSum = filteredData.reduce((sum, item) => {
      const val = parseFloat(item[activeKey]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      name: formatHeader(activeKey),
      total: totalSum
    };
  };

  const numericStats = getNumericStats();

  // Count unique colors or materials
  const getUniqueCount = (field) => {
    if (filteredData.length === 0) return 0;
    const key = Object.keys(filteredData[0]).find(k => k.toLowerCase().includes(field));
    if (!key) return 0;
    const uniqueVals = new Set(filteredData.map(item => item[key]).filter(Boolean));
    return uniqueVals.size;
  };

  const uniqueColors = getUniqueCount('color');
  const uniqueMaterials = getUniqueCount('material') || getUniqueCount('producto');

  // Render cell content beautifully
  const renderCellContent = (value, colName) => {
    if (value === null || value === undefined) return <span className="text-slate-300">—</span>;

    // Check if the column is a color representation (hex)
    if (typeof value === 'string' && value.startsWith('#') && value.length === 7) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: value }} />
          <span className="font-mono text-xs font-bold text-slate-600">{value}</span>
        </div>
      );
    }

    // Check if value is a date
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return <span className="font-bold text-slate-500">{new Date(value).toLocaleDateString()}</span>;
    }

    // Check if numeric
    if (typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)) && colName.toLowerCase().includes('cant') || colName.toLowerCase().includes('stock'))) {
      return <span className="font-bold font-mono text-slate-800">{parseFloat(value).toLocaleString()}</span>;
    }

    // Text values
    return <span className="font-semibold text-slate-700 uppercase">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-2">
      
      {/* Header Section */}
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] font-headline">Inventario Central</p>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-black font-headline text-primary tracking-tighter uppercase leading-none">Materiales Color</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Conexión directa con la base de datos de Supabase
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
            {loading || refreshing ? 'Cargando...' : 'Actualizar Tabla'}
          </button>
        </div>
      </section>

      {/* Bento Grid Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Registros Card */}
        <div className="bg-primary p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-primary/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">TOTAL REGISTROS</span>
            <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">{totalRegistros}</span>
        </div>

        {/* Total Existencia Sum Card */}
        {numericStats ? (
          <div className="bg-[#1B2A4A] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start text-white/50">
              <span className="text-[10px] font-black uppercase tracking-widest">SUMA {numericStats.name}</span>
              <span className="material-symbols-outlined text-lg">summarize</span>
            </div>
            <span className="text-4xl font-black text-white font-headline leading-none">
              {numericStats.total.toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="bg-[#1B2A4A] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start text-white/50">
              <span className="text-[10px] font-black uppercase tracking-widest">SKUS DISPONIBLES</span>
              <span className="material-symbols-outlined text-lg">inventory_2</span>
            </div>
            <span className="text-4xl font-black text-white font-headline leading-none">
              {filteredData.length}
            </span>
          </div>
        )}

        {/* Unique Colors Card */}
        <div className="bg-[#003B46] p-6 rounded-2xl flex flex-col justify-between h-32 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-white/50">
            <span className="text-[10px] font-black uppercase tracking-widest">COLORES REGISTRADOS</span>
            <span className="material-symbols-outlined text-lg">palette</span>
          </div>
          <span className="text-4xl font-black text-white font-headline leading-none">{uniqueColors}</span>
        </div>

        {/* Unique Materials Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between h-32 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">MATERIALES ÚNICOS</span>
            <span className="material-symbols-outlined text-lg text-primary/70">category</span>
          </div>
          <span className="text-4xl font-black text-primary font-headline leading-none">
            {uniqueMaterials || 'N/D'}
          </span>
        </div>

      </div>

      {/* Main Table Grid Section */}
      <div className="flex flex-col gap-4">
        
        {/* Search Bar */}
        <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/20">
          <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
          <input 
            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-600 placeholder:text-slate-400" 
            placeholder="Filtrar datos de la tabla materiales_color por cualquier columna..." 
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

        {/* Table Datagrid Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest font-headline">Datos en Supabase</h3>
            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {filteredData.length} registros cargados
            </span>
          </div>

          {error && (
            <div className="p-6 m-6 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined">warning</span>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Error al leer Supabase</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto flex-grow">
            {loading && filteredData.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Consultando Supabase...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
                <span className="material-symbols-outlined text-5xl opacity-40">database_off</span>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Sin Registros Encontrados</p>
                <p className="text-xs text-slate-400">La tabla no contiene registros o no coincide con los filtros aplicados.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {columns.map((colName) => (
                      <th key={colName} className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {formatHeader(colName)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, rowIndex) => (
                    <tr key={item.id || rowIndex} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      {columns.map((colName) => (
                        <td key={colName} className="p-4 whitespace-nowrap">
                          {renderCellContent(item[colName], colName)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
