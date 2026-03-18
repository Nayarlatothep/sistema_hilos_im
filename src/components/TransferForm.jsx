import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function TransferForm() {
  const { planificacion, transferencias, addTransferencia, fetchTransferencias, loading } = useStore();
  
  const [formData, setFormData] = useState({
    sku: '',
    modulo: '',
    cantidad: ''
  });

  const [msg, setMsg] = useState(null);

  // Group and calculate inventory data from planificacion
  const inventoryData = useMemo(() => {
    const dataMap = {};
    planificacion.forEach(p => {
      const key = \\ - \\;
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
      const key = \\ - \\;
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

    const payload = {
      sku: formData.sku,
      producto: selectedItem.producto,
      color: selectedItem.color,
      nombre_color: selectedItem.nombre_color,
      modulo: formData.modulo,
      cantidad: qty,
      fecha_transferencia: new Date().toISOString()
    };

    const res = await addTransferencia(payload);
    if (res) {
      setMsg({ type: 'success', text: \Transferencia de \ completada.\ });
      setFormData({ sku: '', modulo: '', cantidad: '' });
      setTimeout(() => setMsg(null), 3000);
    } else {
      const dbError = useStore.getState().error;
      alert(\Error al registrar transferencia: \\);
    }
  };

  const handleRefresh = () => {
    fetchTransferencias();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Registro de Material</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Ingrese los detalles del hilo para el control de inventario de Intermoda.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Banner Image inside Card */}
        <div className="h-48 w-full bg-gradient-to-r from-blue-600/10 to-blue-600/5 relative border-b border-slate-100 dark:border-slate-800">
          <div className="absolute inset-0 flex items-center px-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-lg text-white shadow-lg">
                <span className="material-symbols-outlined text-3xl">inventory_2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Detalles de Producción</h3>
                <p className="text-slate-600 dark:text-slate-400">Complete todos los campos requeridos para el ingreso.</p>
              </div>
            </div>
          </div>
          {/* Abstract pattern overlay */}
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600 to-transparent"></div>
        </div>

        {/* Form Content */}
        <form className="p-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">texture</span>
                Hilo-Textura
              </label>
              <select 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 transition-all p-3"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              >
                <option value="" disabled>Seleccione producto (SKU)</option>
                {inventoryData.map(item => (
                  <option key={\\_\\} value={item.sku}>
                    {item.producto} - {item.nombre_color}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">palette</span>
                Nombre Color
              </label>
              <input 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 focus:ring-blue-600 focus:border-blue-600 transition-all p-3 cursor-not-allowed" 
                placeholder="Seleccione un producto" 
                type="text" 
                value={selectedItem?.nombre_color || ''}
                readOnly
              />
            </div>
            {/* Row 2 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">grid_view</span>
                Modulo
              </label>
              <select 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 transition-all p-3 appearance-none"
                value={formData.modulo}
                onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                required
              >
                <option value="" disabled>Seleccione módulo</option>
                <option value="A">Módulo A</option>
                <option value="B">Módulo B</option>
                <option value="C">Módulo C</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">circle</span>
                Cant. Conos
              </label>
              <div className="relative">
                <input 
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 transition-all p-3 pr-10" 
                  placeholder="0" 
                  type="number" 
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">UNS</span>
              </div>
            </div>
          </div>
          {/* Form Footer */}
          <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
            <button 
              className="px-6 py-3 rounded-lg font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
              type="button"
              onClick={() => setFormData({ sku: '', modulo: '', cantidad: '' })}
            >
              Cancelar
            </button>
            <button 
              className="px-10 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={loading || !selectedItem}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
          {msg && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              {msg.text}
            </div>
          )}
        </form>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Materiales Registrados</h3>
          <button 
            className="px-6 py-2.5 rounded-lg bg-white dark:bg-slate-800 text-blue-600 border border-blue-600/20 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Cargar información a la tabla
          </button>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Producto</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Color</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre Color</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Cantidad</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fecha Transferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transferencias.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No hay registros encontrados.
                    </td>
                  </tr>
                ) : (
                  transferencias.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{t.producto}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm border border-slate-200" 
                            style={{ backgroundColor: t.color || '#cccccc' }}
                          ></div>
                          <span>{t.color || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{t.nombre_color}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center font-bold">{t.cantidad} UNS</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">{t.fecha_transferencia?.split('T')[0]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Footer Text */}
      <div className="mt-8 text-center pb-8">
        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
          Sistema de Control de Producción v2.4
        </p>
      </div>
    </div>
  );
}
