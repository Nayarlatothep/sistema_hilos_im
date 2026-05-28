import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';

export default function IndicadorVencimiento() {
  const { fetchLoteMaterialColor, lotes_material_color, fetchMaterialesColor, materiales_color, loading } = useStore();
  const [showAllAlertsModal, setShowAllAlertsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLoteMaterialColor();
    fetchMaterialesColor();
  }, []);

  const actionRequiredAlerts = useMemo(() => {
    if (!lotes_material_color || !materiales_color) return [];

    const groups = {};

    lotes_material_color.forEach(lote => {
      const key = `${lote.articulo}-${lote.idcolor}`;
      if (!groups[key]) {
        const material = materiales_color.find(m => m.articulo === lote.articulo && String(m.idcolor) === String(lote.idcolor));
        const shelflife = material ? Number(material.shelflife) || 0 : 0;
        
        groups[key] = {
          articulo: lote.articulo,
          nombre: lote.nombre,
          color: lote.color,
          cantidad: 0,
          shelflife: shelflife,
          earliestManufacture: null,
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

    return Object.values(groups).map(group => {
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

      return {
        ...group,
        expirationDate,
        daysRemaining,
        status
      };
    }).filter(g => g.status === 'Obsoleto' || g.status === 'En Riesgo')
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [lotes_material_color, materiales_color]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Inventory Health Dashboard</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Real-time analysis of material obsolescence and financial exposure.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg lg:grid-cols-3">
        {/* Total Inventory */}
        <div className="card-base p-md flex flex-col justify-between h-32 relative overflow-hidden bg-[#2563eb] border-none" style={{ backgroundColor: '#1a365d', border: 'none' }}>
          <div className="flex justify-between items-start">
            <span className="font-label-sm text-label-sm text-white/80">Total Inventory</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm" data-icon="account_balance_wallet">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <div className="font-display-kpi text-display-kpi text-white">$11,820</div>
          </div>
        </div>

        {/* Loss Obsolete */}
        <div className="card-base p-md flex flex-col justify-between h-32 relative overflow-hidden bg-[#dc2626] border-none" style={{ backgroundColor: '#991b1b', border: 'none' }}>
          <div className="flex justify-between items-start">
            <span className="font-label-sm text-label-sm text-white/80">Loss Obsolete</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm" data-icon="trending_down">trending_down</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-display-kpi text-display-kpi text-white">$1,860</div>
            <span className="font-data-mono text-data-mono text-white bg-white/20 px-2 py-0.5 rounded-full">-15.7%</span>
          </div>
        </div>

        {/* At Risk */}
        <div className="card-base p-md flex flex-col justify-between h-32 relative overflow-hidden bg-[#f59e0b] border-none" style={{ backgroundColor: '#d97706', border: 'none' }}>
          <div className="flex justify-between items-start">
            <span className="font-label-sm text-label-sm text-white/80">At Risk</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm" data-icon="error_outline">error_outline</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-display-kpi text-display-kpi text-white">$1,960</div>
            <span className="font-data-mono text-data-mono text-white bg-white/20 px-2 py-0.5 rounded-full">16.6%</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* At Risk by Category (Horizontal Bar Chart) */}
            <div className="card-base p-lg flex flex-col h-80">
              <div className="flex justify-between items-center mb-md border-b border-outline-variant pb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">At Risk by Category</h3>
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-4 mt-2">
                {/* Hilos */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-on-surface-variant font-label-sm truncate text-right">Hilos</span>
                  <div className="flex-1 h-5 bg-warning-bg/50 rounded-r-sm overflow-hidden flex items-center">
                    <div className="h-full bg-warning" style={{ width: '100%' }}></div>
                  </div>
                  <span className="w-12 text-[12px] font-data-mono text-on-surface text-right font-bold">$980</span>
                </div>
                {/* Cueros */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-on-surface-variant font-label-sm truncate text-right">Cueros</span>
                  <div className="flex-1 h-5 bg-warning-bg/50 rounded-r-sm overflow-hidden flex items-center">
                    <div className="h-full bg-warning" style={{ width: '65%' }}></div>
                  </div>
                  <span className="w-12 text-[12px] font-data-mono text-on-surface text-right font-bold">$640</span>
                </div>
                {/* Heat Transfer */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-on-surface-variant font-label-sm truncate text-right">Heat Trans.</span>
                  <div className="flex-1 h-5 bg-warning-bg/50 rounded-r-sm overflow-hidden flex items-center">
                    <div className="h-full bg-warning" style={{ width: '29%' }}></div>
                  </div>
                  <span className="w-12 text-[12px] font-data-mono text-on-surface text-right font-bold">$280</span>
                </div>
                {/* Telas */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-on-surface-variant font-label-sm truncate text-right">Telas</span>
                  <div className="flex-1 h-5 bg-warning-bg/50 rounded-r-sm overflow-hidden flex items-center">
                    <div className="h-full bg-warning" style={{ width: '12%' }}></div>
                  </div>
                  <span className="w-12 text-[12px] font-data-mono text-on-surface text-right font-bold">$120</span>
                </div>
                {/* Cierres */}
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-on-surface-variant font-label-sm truncate text-right">Cierres</span>
                  <div className="flex-1 h-5 bg-warning-bg/50 rounded-r-sm overflow-hidden flex items-center">
                    <div className="h-full bg-warning" style={{ width: '6%' }}></div>
                  </div>
                  <span className="w-12 text-[12px] font-data-mono text-on-surface text-right font-bold">$60</span>
                </div>
              </div>
            </div>

            {/* Loss by Category (Vertical Bar Chart) */}
            <div className="card-base p-lg flex flex-col h-80">
              <div className="flex justify-between items-center mb-md border-b border-outline-variant pb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">Loss by Category</h3>
              </div>
              <div className="flex-1 flex items-end justify-around pb-4 relative pt-6">
                {/* Y Axis markers */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant font-data-mono border-r border-outline-variant pr-2 w-10">
                  <span>$1k</span><span>$500</span><span>$0</span>
                </div>
                {/* Bars */}
                <div className="flex flex-col items-center ml-10 gap-1 group">
                  <div className="w-8 bg-danger rounded-t-sm h-[120px] transition-all group-hover:opacity-80 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] group-hover:opacity-100 opacity-100">$850</span>
                  </div>
                  <span className="font-label-sm text-[9px] text-on-surface-variant">Cueros</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-8 bg-danger rounded-t-sm h-[59px] transition-all group-hover:opacity-80 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] group-hover:opacity-100 opacity-100">$420</span>
                  </div>
                  <span className="font-label-sm text-[9px] text-on-surface-variant">Hilos</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-8 bg-danger rounded-t-sm h-[40px] transition-all group-hover:opacity-80 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] group-hover:opacity-100 opacity-100">$280</span>
                  </div>
                  <span className="font-label-sm text-[9px] text-on-surface-variant">Heat Tr.</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-8 bg-danger rounded-t-sm h-[27px] transition-all group-hover:opacity-80 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] group-hover:opacity-100 opacity-100">$190</span>
                  </div>
                  <span className="font-label-sm text-[9px] text-on-surface-variant">Telas</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-8 bg-danger rounded-t-sm h-[17px] transition-all group-hover:opacity-80 relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] group-hover:opacity-100 opacity-100">$120</span>
                  </div>
                  <span className="font-label-sm text-[9px] text-on-surface-variant">Cierres</span>
                </div>
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
                <div key={idx} className={`p-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer flex justify-between items-start ${alert.status === 'Obsoleto' ? 'bg-danger/5' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">{alert.nombre || 'N/A'}</span>
                      <span className={`${alert.status === 'Obsoleto' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="font-body-md text-[12px] text-on-surface-variant">Art: {alert.articulo} | Color: {alert.color}</p>
                    <div className={`mt-2 font-data-mono text-[12px] ${alert.status === 'Obsoleto' ? 'text-danger' : 'text-warning'} flex items-center gap-1`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {alert.status === 'Obsoleto' ? 'event_busy' : 'schedule'}
                      </span> 
                      {alert.status === 'Obsoleto' ? 'Vencido:' : 'Vence:'} {alert.expirationDate ? alert.expirationDate.toISOString().split('T')[0] : 'N/A'} ({alert.daysRemaining} días)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono text-data-mono font-bold text-lg">{alert.cantidad.toLocaleString()}</div>
                    <div className="font-label-sm text-[10px] text-on-surface-variant">Cant.</div>
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
          <h3 className="font-headline-md text-headline-md text-on-surface">Inventory Detailed Analysis</h3>
          <div className="flex gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" data-icon="search">search</span>
              <input className="pl-8 pr-3 py-1.5 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-64" placeholder="Search SKU..." type="text" />
            </div>
            <button className="border border-outline-variant text-on-surface-variant px-3 py-1.5 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2 font-label-sm">
              <span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span> Filter
            </button>
            <button className="bg-primary-container text-on-primary px-3 py-1.5 rounded hover:bg-primary transition-colors flex items-center gap-2 font-label-sm font-bold">
              <span className="material-symbols-outlined text-sm" data-icon="download">download</span> Export
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
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Qty</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Value</th>
                <th className="py-3 px-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="font-data-mono text-sm">
              <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors bg-danger-bg/10">
                <td className="py-3 px-4 text-on-surface font-bold">CUE-001</td>
                <td className="py-3 px-4 text-on-surface-variant">Cueros</td>
                <td className="py-3 px-4 text-on-surface-variant font-body-md">Cuero Sintético Azul</td>
                <td className="py-3 px-4 text-right text-on-surface">500</td>
                <td className="py-3 px-4 text-right text-on-surface font-bold">$850.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-danger/10 text-danger px-2 py-1 rounded-full text-[10px] font-bold uppercase">Obsolete</span>
                </td>
              </tr>
              <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors bg-danger-bg/5">
                <td className="py-3 px-4 text-on-surface font-bold">HIL-002</td>
                <td className="py-3 px-4 text-on-surface-variant">Hilos</td>
                <td className="py-3 px-4 text-on-surface-variant font-body-md">Hilo Poliéster Negro</td>
                <td className="py-3 px-4 text-right text-on-surface">1200</td>
                <td className="py-3 px-4 text-right text-on-surface font-bold">$420.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-danger/10 text-danger px-2 py-1 rounded-full text-[10px] font-bold uppercase">Obsolete</span>
                </td>
              </tr>
              <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors bg-warning-bg/10">
                <td className="py-3 px-4 text-on-surface font-bold">HT-501</td>
                <td className="py-3 px-4 text-on-surface-variant">Heat Transfer</td>
                <td className="py-3 px-4 text-on-surface-variant font-body-md">Heat Transfer Logo</td>
                <td className="py-3 px-4 text-right text-on-surface">800</td>
                <td className="py-3 px-4 text-right text-on-surface font-bold">$280.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-warning/10 text-warning px-2 py-1 rounded-full text-[10px] font-bold uppercase">In Risk</span>
                </td>
              </tr>
              <tr className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                <td className="py-3 px-4 text-on-surface font-bold">TEL-105</td>
                <td className="py-3 px-4 text-on-surface-variant">Telas</td>
                <td className="py-3 px-4 text-on-surface-variant font-body-md">Tela Algodón Blanca</td>
                <td className="py-3 px-4 text-right text-on-surface">2500</td>
                <td className="py-3 px-4 text-right text-on-surface font-bold">$3,500.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-success/10 text-success px-2 py-1 rounded-full text-[10px] font-bold uppercase">Available</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-lowest transition-colors">
                <td className="py-3 px-4 text-on-surface font-bold">CIE-302</td>
                <td className="py-3 px-4 text-on-surface-variant">Cierres</td>
                <td className="py-3 px-4 text-on-surface-variant font-body-md">Cierre Metálico 15cm</td>
                <td className="py-3 px-4 text-right text-on-surface">5000</td>
                <td className="py-3 px-4 text-right text-on-surface font-bold">$1,250.00</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-success/10 text-success px-2 py-1 rounded-full text-[10px] font-bold uppercase">Available</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
              <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input 
                  className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
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
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-label-sm text-label-sm font-bold text-on-surface truncate flex-1">{alert.nombre || 'N/A'}</span>
                          <span className={`${alert.status === 'Obsoleto' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'} text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0`}>
                            {alert.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-surface-container-low p-2 rounded text-[12px] font-data-mono">
                          <div><span className="text-on-surface-variant">Art:</span> {alert.articulo}</div>
                          <div><span className="text-on-surface-variant">Color:</span> {alert.color}</div>
                          <div><span className="text-on-surface-variant">Vida útil:</span> {alert.shelflife} días</div>
                          <div><span className="text-on-surface-variant">Manu:</span> {alert.earliestManufacture ? alert.earliestManufacture.toISOString().split('T')[0] : 'N/A'}</div>
                        </div>

                        <div className={`mt-2 font-data-mono text-[13px] font-bold ${alert.status === 'Obsoleto' ? 'text-danger' : 'text-warning'} flex items-center gap-1`}>
                          <span className="material-symbols-outlined text-[16px]">
                            {alert.status === 'Obsoleto' ? 'event_busy' : 'schedule'}
                          </span> 
                          {alert.status === 'Obsoleto' ? 'Vencido:' : 'Vence:'} {alert.expirationDate ? alert.expirationDate.toISOString().split('T')[0] : 'N/A'} 
                          <span className="ml-1 opacity-80">({alert.daysRemaining} días)</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-outline-variant flex justify-between items-end">
                        <span className="font-label-sm text-on-surface-variant">Cantidad Total</span>
                        <div className="font-data-mono font-bold text-xl text-primary">{alert.cantidad.toLocaleString()}</div>
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
    </div>
  );
}
