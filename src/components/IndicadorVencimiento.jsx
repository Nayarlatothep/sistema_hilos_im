import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';

export default function IndicadorVencimiento() {
  const { fetchLotesConCosto, lotes_con_costo, fetchMaterialesColor, materiales_color, fetchLoteMaterialColor, lotes_material_color, loading } = useStore();
  const [showAllAlertsModal, setShowAllAlertsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailedSearchQuery, setDetailedSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [urgencyCategory, setUrgencyCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [detailedSearchQuery, filterStatus, filterCategory]);

  useEffect(() => {
    fetchLotesConCosto();
    fetchMaterialesColor();
    fetchLoteMaterialColor();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchLotesConCosto(),
      fetchMaterialesColor(),
      fetchLoteMaterialColor()
    ]);
    setIsRefreshing(false);
  };

  const inventoryData = useMemo(() => {
    if (!lotes_con_costo || !materiales_color || !lotes_material_color) return { alerts: [], items: [], stats: { total: 0, obsolete: 0, atRisk: 0 } };

    const groups = {};
    let totalCosto = 0;
    let obsoleteCosto = 0;
    let atRiskCosto = 0;
    let totalQty = 0;
    let obsoleteQty = 0;
    let atRiskQty = 0;

    lotes_con_costo.forEach(lote => {
      const key = `${lote.articulo}-${lote.idcolor}-${lote.pc}`;
      if (!groups[key]) {
        const material = materiales_color.find(m => m.articulo === lote.articulo && String(m.idcolor) === String(lote.idcolor));
        const shelflife = material ? Number(material.shelflife) || 0 : 0;
        
        const originalLote = lotes_material_color.find(l => l.pc === lote.pc && l.articulo === lote.articulo);
        const categoria = originalLote?.categoria || lote.categoria || 'Sin Categoría';
        const lote_total = originalLote?.total ? parseFloat(originalLote.total) : null;

        // El costo ya viene del servidor (JOIN hecho en PostgreSQL)
        const costoU = parseFloat(lote.costo) || 0;

        groups[key] = {
          pc: lote.pc,
          articulo: lote.articulo,
          categoria: categoria,
          nombre: lote.nombre,
          color: lote.color,
          idcolor: lote.idcolor,
          fecha_manufactura: lote.fecha_manufactura,
          cantidad: 0,
          shelflife: shelflife,
          earliestManufacture: null,
          costo_unitario: costoU,
          lote_total: lote_total
        };
      }
      
      groups[key].cantidad += Number(lote.cantidad || 0);

      if (lote.fecha_manufactura) {
        const date = new Date(lote.fecha_manufactura);
        if (!groups[key].earliestManufacture || date < groups[key].earliestManufacture) {
          groups[key].earliestManufacture = date;
        }
      }
    });

    const allGroups = Object.values(groups).map(group => {
      let expirationDate = null;
      let daysRemaining = null;
      let status = 'Desconocido';
      
      if (group.earliestManufacture && group.shelflife > 0) {
        expirationDate = new Date(group.earliestManufacture);
        expirationDate.setDate(expirationDate.getDate() + group.shelflife);
        
        const today = new Date();
        const diffTime = expirationDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          status = 'Obsoleto';
        } else if (daysRemaining <= group.shelflife * 0.3) {
          status = 'En Riesgo';
        } else {
          status = 'Disponible';
        }
      }

      const costo_total = group.lote_total !== null ? group.lote_total : (group.cantidad * (group.costo_unitario || 0));
      
      totalCosto += costo_total;
      totalQty += group.cantidad;

      if (status === 'Obsoleto') {
        obsoleteCosto += costo_total;
        obsoleteQty += group.cantidad;
      }
      if (status === 'En Riesgo') {
        atRiskCosto += costo_total;
        atRiskQty += group.cantidad;
      }

      return {
        ...group,
        expirationDate,
        daysRemaining,
        status,
        costo_total
      };
    });

    const alerts = allGroups.filter(g => g.status === 'Obsoleto' || g.status === 'En Riesgo')
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      alerts,
      items: allGroups,
      stats: {
        total: totalCosto,
        totalQty: totalQty,
        obsolete: obsoleteCosto,
        obsoleteQty: obsoleteQty,
        atRisk: atRiskCosto,
        atRiskQty: atRiskQty
      }
    };
  }, [lotes_con_costo, materiales_color, lotes_material_color]);

  const { alerts: actionRequiredAlerts, stats, items } = inventoryData;

  const riskByCategory = useMemo(() => {
    if (!items) return [];
    const riskItems = items.filter(item => item.status === 'En Riesgo');
    const categories = {
      'Heat Transfers': 0,
      'Quimicos': 0,
      'Stickers': 0
    };
    riskItems.forEach(item => {
      categories[item.categoria] = (categories[item.categoria] || 0) + (item.costo_total || 0);
    });
    return Object.entries(categories)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  const urgencyHistogram = useMemo(() => {
    if (!items) return [];
    
    // Solo incluir items que están 'En Riesgo'
    let riskItems = items.filter(item => item.status === 'En Riesgo');
    if (urgencyCategory !== 'All') {
      riskItems = riskItems.filter(item => item.categoria === urgencyCategory);
    }
    
    const buckets = {
      '91+ días': 0,
      '61-90 días': 0,
      '31-60 días': 0,
      '0-30 días': 0
    };
    
    riskItems.forEach(item => {
      const days = item.daysRemaining;
      const val = item.costo_total || 0;
      if (days === null || days === undefined) return;
      
      // Excluir días negativos (vencidos) ya que solo queremos 'En Riesgo'
      if (days >= 0 && days <= 30) {
        buckets['0-30 días'] += val;
      } else if (days > 30 && days <= 60) {
        buckets['31-60 días'] += val;
      } else if (days > 60 && days <= 90) {
        buckets['61-90 días'] += val;
      } else if (days > 90) {
        buckets['91+ días'] += val;
      }
    });

    return [
      { label: '0-30 días', total: buckets['0-30 días'], color: 'bg-orange-600' },
      { label: '31-60 días', total: buckets['31-60 días'], color: 'bg-orange-500' },
      { label: '61-90 días', total: buckets['61-90 días'], color: 'bg-orange-400' },
      { label: '91+ días', total: buckets['91+ días'], color: 'bg-orange-300' }
    ];
  }, [items, urgencyCategory]);

  const obsoletePercentage = stats.total > 0 ? (stats.obsolete / stats.total) * 100 : 0;
  const atRiskPercentage = stats.total > 0 ? (stats.atRisk / stats.total) * 100 : 0;

  const formatCurrency = (val) => 'L. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(inventoryData.items.map(item => item.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [inventoryData.items]);

  const filteredDetailedItems = useMemo(() => {
    let items = inventoryData.items.filter(item => {
      // SKU/Name Search
      const q = detailedSearchQuery.toLowerCase();
      const matchesSearch = !q || 
             (item.articulo && item.articulo.toLowerCase().includes(q)) ||
             (item.nombre && item.nombre.toLowerCase().includes(q)) ||
             (item.color && item.color.toLowerCase().includes(q));
      
      // Status Filter
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      
      // Category Filter
      const matchesCategory = filterCategory === 'All' || item.categoria === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    const statusOrder = { 'Obsoleto': 1, 'En Riesgo': 2, 'Disponible': 3 };
    items.sort((a, b) => {
      const sA = statusOrder[a.status] || 99;
      const sB = statusOrder[b.status] || 99;
      if (sA !== sB) return sA - sB;
      return (b.costo_total || 0) - (a.costo_total || 0);
    });

    return items;
  }, [inventoryData.items, detailedSearchQuery, filterStatus, filterCategory]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredDetailedItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredDetailedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return; // In case popup blocker is enabled
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Inventario</title>
          <style>
            body { font-family: sans-serif; padding: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Reporte de Inventario Detallado</h2>
          <p>Total Registros (SKUs): <strong>${filteredDetailedItems.length}</strong></p>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Color</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Costo Total</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDetailedItems.map(item => `
                <tr>
                  <td>${item.articulo}</td>
                  <td>${item.categoria}</td>
                  <td>${item.nombre || '-'}</td>
                  <td>${item.color} (${item.idcolor})</td>
                  <td class="text-right">${item.cantidad.toLocaleString()}</td>
                  <td class="text-right">${formatCurrency(item.costo_total || 0)}</td>
                  <td>${item.status}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="font-bold">
                <td colspan="4" class="text-right">Totales:</td>
                <td class="text-right">${filteredDetailedItems.reduce((acc, item) => acc + item.cantidad, 0).toLocaleString()}</td>
                <td class="text-right">${formatCurrency(filteredDetailedItems.reduce((acc, item) => acc + (item.costo_total || 0), 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Categoria', 'Descripcion', 'Color', 'Cantidad', 'Costo Total', 'Estatus'];
    const csvData = filteredDetailedItems.map(item => [
      item.articulo,
      item.categoria,
      '"' + (item.nombre || '').replace(/"/g, '""') + '"',
      '"' + item.color + ' (' + item.idcolor + ')"',
      item.cantidad,
      item.costo_total || 0,
      item.status
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventario_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="mb-lg flex justify-between items-start">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-black text-on-surface mb-2">CONTROL MATERIALES EXPIRADOS - MATERIA PRIMA</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Análisis en tiempo real de la obsolescencia de materiales y exposición financiera.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-surface-container-low border border-outline-variant hover:border-primary text-primary px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-label-sm shadow-sm hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>sync</span>
          Actualizar
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg lg:grid-cols-3">
        {/* Inventario Total */}
        <div className="card-base p-md flex flex-col justify-between h-32 relative overflow-hidden bg-blue-900 border-none rounded-3xl">
          <div className="flex justify-between items-start">
            <span className="font-label-sm text-label-sm text-white/80 uppercase tracking-wider font-bold">INVENTARIO TOTAL</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm" data-icon="account_balance_wallet">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <div className="font-display-kpi text-display-kpi text-white text-4xl font-black">{formatCurrency(stats.total)}</div>
            <div className="text-white/80 text-sm font-medium mt-1">{new Intl.NumberFormat('en-US').format(stats.totalQty)} und</div>
          </div>
        </div>

        {/* Inventario Vencido */}
        <div className="card-base p-md flex flex-col justify-between h-32 relative overflow-hidden bg-rose-600 border-none rounded-3xl">
          <div className="flex justify-between items-start">
            <span className="font-label-sm text-label-sm text-white/80 uppercase tracking-wider font-bold">INVENTARIO VENCIDO</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm" data-icon="trending_down">trending_down</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="font-display-kpi text-display-kpi text-white text-4xl font-black">{formatCurrency(stats.obsolete)}</div>
              <span className="font-data-mono text-data-mono text-white bg-white/20 px-2 py-0.5 rounded-full">{obsoletePercentage.toFixed(1)}%</span>
            </div>
            <div className="text-white/80 text-sm font-medium mt-1">{new Intl.NumberFormat('en-US').format(stats.obsoleteQty)} und</div>
          </div>
        </div>

        {/* Inventario en Riesgo */}
        <div className="card-base p-md flex flex-col justify-between h-32 relative overflow-hidden bg-amber-600 border-none rounded-3xl">
          <div className="flex justify-between items-start">
            <span className="font-label-sm text-label-sm text-white/80 uppercase tracking-wider font-bold">INVENTARIO EN RIESGO</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm" data-icon="error_outline">error_outline</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="font-display-kpi text-display-kpi text-white text-4xl font-black">{formatCurrency(stats.atRisk)}</div>
              <span className="font-data-mono text-data-mono text-white bg-white/20 px-2 py-0.5 rounded-full">{atRiskPercentage.toFixed(1)}%</span>
            </div>
            <div className="text-white/80 text-sm font-medium mt-1">{new Intl.NumberFormat('en-US').format(stats.atRiskQty)} und</div>
          </div>
        </div>
      </div>

      {/* Bento Grid Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Inventario en Riesgo by Category (Horizontal Bar Chart) */}
            <div className="card-base p-lg flex flex-col h-80">
              <div className="flex justify-between items-center mb-md border-b border-outline-variant pb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">Inventario en Riesgo por Categoría</h3>
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-4 mt-2">
                {riskByCategory.length === 0 ? (
                  <div className="text-center text-on-surface-variant text-sm py-4">Sin datos</div>
                ) : (
                  riskByCategory.slice(0, 5).map((cat, idx) => {
                    const maxRisk = riskByCategory[0].total || 1;
                    const percentage = Math.max(1, (cat.total / maxRisk) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-20 text-[11px] text-on-surface-variant font-label-sm truncate text-right" title={cat.categoria}>{cat.categoria}</span>
                        <div className="flex-1 h-5 bg-warning-bg/50 rounded-r-sm overflow-hidden flex items-center">
                          <div className="h-full bg-warning" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="w-20 text-[12px] font-data-mono text-on-surface text-right font-bold">{formatCurrency(cat.total)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Urgency Histogram (Aging / Time-to-Expiry) */}
            <div className="card-base p-lg flex flex-col h-80">
              <div className="flex justify-between items-center mb-md border-b border-outline-variant pb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">Histograma Material en Riesgo</h3>
                <select 
                  className="pl-2 pr-6 py-1 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-xs focus:border-primary outline-none max-w-[150px]"
                  value={urgencyCategory}
                  onChange={(e) => setUrgencyCategory(e.target.value)}
                >
                  <option value="All">Todas</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex items-end justify-around pb-4 relative pt-6">
                {/* Y Axis markers */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant font-data-mono border-r border-outline-variant pr-2 w-10">
                  <span>Max</span><span>Med</span><span>Min</span>
                </div>
                {/* Bars */}
                {urgencyHistogram.map((bucket, idx) => {
                  const maxVal = Math.max(...urgencyHistogram.map(b => b.total), 1);
                  const height = Math.max(10, (bucket.total / maxVal) * 120); // max height ~ 120px
                  return (
                    <div key={idx} className={`flex flex-col items-center gap-1 group ${idx === 0 ? 'ml-10' : ''}`}>
                      <div className={`w-10 ${bucket.color} rounded-t-sm transition-all group-hover:opacity-80 relative flex items-end justify-center`} style={{ height: `${height}px` }}>
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] group-hover:opacity-100 opacity-0 bg-surface-container shadow-sm px-1 rounded z-10 whitespace-nowrap">{formatCurrency(bucket.total)}</span>
                      </div>
                      <span className="font-label-sm text-[9px] text-on-surface-variant w-14 text-center leading-tight">{bucket.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Inventory Aging Timeline */}
          <div className="card-base p-lg flex flex-col h-72">
            <div className="flex justify-between items-center mb-md border-b border-outline-variant pb-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">Inventory Aging Timeline (Next 6 Months)</h3>
            </div>
            <div className="flex-1 relative mt-4">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between z-0">
                <div className="border-t border-surface-container-highest w-full h-0"></div>
                <div className="border-t border-surface-container-highest w-full h-0"></div>
                <div className="border-t border-surface-container-highest w-full h-0"></div>
                <div className="border-t border-surface-container-highest w-full h-0"></div>
              </div>
              {/* SVG Line Chart Mockup */}
              <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 400 100">
                <path d="M0,90 Q50,85 100,70 T200,40 T300,60 T400,20" fill="none" stroke="currentColor" className="text-warning" strokeWidth="3"></path>
                <path d="M0,90 Q50,85 100,70 T200,40 T300,60 T400,20 L400,100 L0,100 Z" fill="url(#grad1)" opacity="0.2"></path>
                <defs>
                  <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'currentColor', stopOpacity: 1 }} className="text-warning"></stop>
                    <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }}></stop>
                  </linearGradient>
                </defs>
                {/* Data points */}
                <circle cx="100" cy="70" fill="white" r="4" stroke="currentColor" className="text-warning" strokeWidth="2"></circle>
                <circle cx="200" cy="40" fill="white" r="4" stroke="currentColor" className="text-warning" strokeWidth="2"></circle>
                <circle cx="300" cy="60" fill="white" r="4" stroke="currentColor" className="text-warning" strokeWidth="2"></circle>
                <circle cx="400" cy="20" fill="white" r="4" stroke="currentColor" className="text-warning" strokeWidth="2"></circle>
              </svg>
              {/* X Axis */}
              <div className="absolute -bottom-6 w-full flex justify-between text-[10px] font-data-mono text-on-surface-variant px-2">
                <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Alerts & Actions) */}
        <div className="lg:col-span-1 space-y-lg flex flex-col">
          {/* Action Required Panel */}
          <div className="card-base flex flex-col h-auto overflow-hidden flex-1">
            <div className="bg-error-container p-4 border-b border-error/20 flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-error-container flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> Acción Requerida
              </h3>
              <span className="bg-error text-on-error text-[10px] font-bold px-2 py-1 rounded-full">{actionRequiredAlerts.length} Alertas</span>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              {actionRequiredAlerts.length === 0 && (
                <div className="p-8 text-center text-on-surface-variant font-body-md">
                  No hay alertas de vencimiento en este momento.
                </div>
              )}
              {actionRequiredAlerts.slice(0, 5).map((alert, idx) => (
                <div key={idx} className={`p-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col justify-between items-start ${alert.status === 'Obsoleto' ? 'bg-danger/5' : ''}`}>
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-1 w-full">
                      <span className="font-label-sm text-label-sm font-bold text-on-surface flex-1 truncate">{alert.nombre || 'N/A'}</span>
                      <span className={`${alert.status === 'Obsoleto' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'} text-[12px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 w-24 text-center`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="font-body-md text-[12px] text-on-surface-variant">Art: {alert.articulo} | Color: {alert.color}</p>
                    <p className="font-body-md text-[12px] text-on-surface-variant mt-0.5">Lote: {alert.pc} | Manu: {alert.fecha_manufactura ? new Date(alert.fecha_manufactura).toISOString().split('T')[0] : 'N/A'}</p>
                    <div className={`mt-2 font-data-mono text-[12px] ${alert.status === 'Obsoleto' ? 'text-danger' : 'text-warning'} flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {alert.status === 'Obsoleto' ? 'event_busy' : 'schedule'}
                      </span> 
                      {alert.status === 'Obsoleto' ? 'Vencido:' : 'Vence:'} {alert.expirationDate ? alert.expirationDate.toISOString().split('T')[0] : 'N/A'} ({alert.daysRemaining} días)
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-end w-full">
                      <span className="font-label-sm text-on-surface-variant">Cantidad Total</span>
                      <div className="font-data-mono font-bold text-lg text-primary">{alert.cantidad.toLocaleString()}</div>
                    </div>
                    <div className="flex justify-between items-end w-full">
                      <span className="font-label-sm text-on-surface-variant">Costo Total</span>
                      <div className="font-data-mono font-bold text-lg text-error">
                        {'L. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(alert.costo_total || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center">
              <button 
                className="font-label-sm text-primary hover:underline"
                onClick={() => setShowAllAlertsModal(true)}
              >
                Ver todas las alertas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="card-base overflow-hidden">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-md text-headline-md text-on-surface">Análisis Detallado de Inventario</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category Filter */}
            <div className="relative">
              <select 
                className="pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">Categoría: Todas</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select 
                className="pl-3 pr-8 py-1.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Estatus: Todos</option>
                <option value="Obsoleto">Obsoleto</option>
                <option value="En Riesgo">En Riesgo</option>
                <option value="Disponible">Disponible</option>
              </select>
            </div>

            {/* SKU Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" data-icon="search">search</span>
              <input 
                className="pl-8 pr-3 py-1.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-48 lg:w-64" 
                placeholder="Buscar SKU..." 
                type="text" 
                value={detailedSearchQuery}
                onChange={(e) => setDetailedSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-primary-container text-on-primary px-3 py-1.5 rounded hover:bg-primary transition-colors flex items-center gap-2 font-label-sm font-bold ml-2"
            >
              <span className="material-symbols-outlined text-sm" data-icon="download">download</span> Exportar
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">SKU</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Color</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Quantity</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Value</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="font-data-mono text-sm">
              {filteredDetailedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-on-surface-variant font-body-md">
                    {detailedSearchQuery ? 'No se encontraron resultados.' : 'No hay datos de inventario disponibles.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  let rowBg = '';
                  let badgeClass = 'bg-success/10 text-success';
                  
                  if (item.status === 'Obsoleto') {
                    rowBg = 'bg-danger-bg/10';
                    badgeClass = 'bg-danger/10 text-danger';
                  } else if (item.status === 'En Riesgo') {
                    rowBg = 'bg-warning-bg/10';
                    badgeClass = 'bg-warning/10 text-warning';
                  }

                  return (
                    <tr key={idx} className={`border-b border-outline-variant hover:bg-surface-container-lowest transition-colors ${rowBg}`}>
                      <td className="py-3 px-4 text-on-surface font-bold">{item.articulo}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{item.categoria}</td>
                      <td className="py-3 px-4 text-on-surface-variant font-body-md">{item.nombre || '-'}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{item.color} ({item.idcolor})</td>
                      <td className="py-3 px-4 text-right text-on-surface">{item.cantidad.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-on-surface font-bold">
                        {formatCurrency(item.costo_total || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`${badgeClass} px-2 py-1 rounded-full text-[10px] font-bold uppercase`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {filteredDetailedItems.length > 0 && (
          <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <span className="font-label-sm text-on-surface-variant">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredDetailedItems.length)} de {filteredDetailedItems.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed font-label-sm flex items-center gap-1 text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span> Anterior
              </button>
              <span className="font-label-sm font-bold text-on-surface px-2">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed font-label-sm flex items-center gap-1 text-on-surface"
              >
                Siguiente <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All Alerts Modal */}
      {showAllAlertsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-xl shadow-modal w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-lg border-b border-outline-variant bg-surface-container-low rounded-t-xl flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-warning">warning</span> Todas las Alertas de Vencimiento
                  </h3>
                  <p className="font-body-md text-on-surface-variant mt-1">Mostrando el detalle de todos los artículos obsoletos o en riesgo.</p>
                </div>
                <button onClick={() => setShowAllAlertsModal(false)} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-highest">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-md bg-white text-on-surface font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm" 
                  placeholder="Buscar por artículo o nombre..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-md flex-1 overflow-y-auto bg-surface">
              {(() => {
                const filteredAlerts = actionRequiredAlerts.filter(alert => {
                  const q = searchQuery.toLowerCase();
                  return (alert.nombre && alert.nombre.toLowerCase().includes(q)) || 
                         (alert.articulo && alert.articulo.toLowerCase().includes(q));
                });

                if (filteredAlerts.length === 0) {
                  return (
                    <div className="p-8 text-center text-on-surface-variant font-body-md">
                      {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'No hay alertas de vencimiento en este momento.'}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAlerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 border border-outline-variant rounded-lg hover:shadow-md transition-shadow bg-surface-container-lowest flex flex-col justify-between ${alert.status === 'Obsoleto' ? 'border-danger/30 bg-danger/5' : ''}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-2 w-full">
                          <span className="font-label-sm text-label-sm font-bold text-on-surface truncate flex-1">{alert.nombre || 'N/A'}</span>
                          <span className={`${alert.status === 'Obsoleto' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'} text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 w-20 text-center`}>
                            {alert.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-surface-container-low p-2 rounded text-[12px] font-data-mono">
                          <div><span className="text-on-surface-variant">Art:</span> {alert.articulo}</div>
                          <div><span className="text-on-surface-variant">Color:</span> {alert.color}</div>
                          <div><span className="text-on-surface-variant">Lote:</span> {alert.pc}</div>
                          <div><span className="text-on-surface-variant">Vida útil:</span> {alert.shelflife} días</div>
                          <div className="col-span-2"><span className="text-on-surface-variant">Manufacturado:</span> {alert.fecha_manufactura ? new Date(alert.fecha_manufactura).toISOString().split('T')[0] : 'N/A'}</div>
                        </div>

                        <div className={`mt-2 font-data-mono text-[13px] font-bold ${alert.status === 'Obsoleto' ? 'text-danger' : 'text-warning'} flex items-center gap-1`}>
                          <span className="material-symbols-outlined text-[16px]">
                            {alert.status === 'Obsoleto' ? 'event_busy' : 'schedule'}
                          </span> 
                          {alert.status === 'Obsoleto' ? 'Vencido:' : 'Vence:'} {alert.expirationDate ? alert.expirationDate.toISOString().split('T')[0] : 'N/A'} 
                          <span className="ml-1 opacity-80">({alert.daysRemaining} días)</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-outline-variant flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                          <span className="font-label-sm text-on-surface-variant">Cantidad Total</span>
                          <div className="font-data-mono font-bold text-lg text-primary">{alert.cantidad.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="font-label-sm text-on-surface-variant">Costo Total</span>
                          <div className="font-data-mono font-bold text-lg text-error">
                            {'L. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(alert.costo_total || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-xl shadow-modal w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-lg border-b border-outline-variant bg-surface-container-low rounded-t-xl flex justify-between items-start">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">table</span> Vista de Exportación
                </h3>
                <p className="font-body-md text-on-surface-variant mt-1">Mostrando {filteredDetailedItems.length} registros según los filtros actuales.</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-highest">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-surface">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10 shadow-sm">
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">SKU</th>
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Categoría</th>
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Descripción</th>
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Color</th>
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Cantidad</th>
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Costo Total</th>
                    <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody className="font-data-mono text-sm">
                  {filteredDetailedItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-on-surface-variant font-body-md">
                        No hay datos para mostrar con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredDetailedItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                        <td className="py-2 px-4 text-on-surface font-bold">{item.articulo}</td>
                        <td className="py-2 px-4 text-on-surface-variant">{item.categoria}</td>
                        <td className="py-2 px-4 text-on-surface-variant font-body-md">{item.nombre || '-'}</td>
                        <td className="py-2 px-4 text-on-surface-variant">{item.color} ({item.idcolor})</td>
                        <td className="py-2 px-4 text-right text-on-surface">{item.cantidad.toLocaleString()}</td>
                        <td className="py-2 px-4 text-right text-on-surface font-bold">
                          {formatCurrency(item.costo_total || 0)}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {item.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredDetailedItems.length > 0 && (
                  <tfoot className="bg-surface-container-low font-bold text-on-surface border-t-2 border-outline-variant">
                    <tr>
                      <td colSpan="4" className="py-3 px-4 text-right">
                        <span className="mr-6 bg-primary/10 text-primary px-3 py-1 rounded-full text-[12px]">Total SKUs: {filteredDetailedItems.length}</span>
                        Totales:
                      </td>
                      <td className="py-3 px-4 text-right">{filteredDetailedItems.reduce((acc, item) => acc + item.cantidad, 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-error">{formatCurrency(filteredDetailedItems.reduce((acc, item) => acc + (item.costo_total || 0), 0))}</td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            
            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={handlePrint}
                className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg hover:bg-surface-variant transition-colors flex items-center gap-2 font-label-sm font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">print</span> Imprimir
              </button>
              <button 
                onClick={handleExportCSV}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-label-sm font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">download</span> Exportar a CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




