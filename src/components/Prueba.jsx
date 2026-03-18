import React, { useState } from 'react';

export default function Prueba() {
  const [formData, setFormData] = useState({
    hilo: '',
    color: '',
    modulo: '',
    cantidad: ''
  });

  const [registros, setRegistros] = useState([
    { id: 1, producto: 'Poliéster 20/2', color: '#1e3a8a', nombre_color: 'Azul Marino', cantidad: 24, fecha: '2023-10-25' },
    { id: 2, producto: 'Hilo de Algodón', color: '#ffffff', nombre_color: 'Blanco Óptico', cantidad: 12, fecha: '2023-10-25' }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevoRegistro = {
      id: Date.now(),
      producto: formData.hilo,
      color: '#cccccc',
      nombre_color: formData.color,
      cantidad: parseInt(formData.cantidad, 10),
      fecha: new Date().toISOString().split('T')[0]
    };
    setRegistros([nuevoRegistro, ...registros]);
    setFormData({ hilo: '', color: '', modulo: '', cantidad: '' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Registro de Material (Prueba)</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Ingrese los detalles del hilo para el control de inventario de Intermoda.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Banner */}
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
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600 to-transparent"></div>
        </div>

        {/* Form Content */}
        <form className="p-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">texture</span>
                Hilo-Textura
              </label>
              <input 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 transition-all p-3" 
                placeholder="Ej. Poliéster 20/2" 
                type="text"
                value={formData.hilo}
                onChange={(e) => setFormData({...formData, hilo: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">palette</span>
                Nombre Color
              </label>
              <input 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 transition-all p-3" 
                placeholder="Ej. Azul Marino" 
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">grid_view</span>
                Modulo
              </label>
              <select 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 transition-all p-3 appearance-none"
                value={formData.modulo}
                onChange={(e) => setFormData({...formData, modulo: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
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
              onClick={() => setFormData({ hilo: '', color: '', modulo: '', cantidad: '' })}
            >
              Cancelar
            </button>
            <button className="px-10 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2" type="submit">
              <span className="material-symbols-outlined text-lg">add</span>
              Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Materiales Registrados</h3>
          <button className="px-6 py-2.5 rounded-lg bg-white dark:bg-slate-800 text-blue-600 border border-blue-600/20 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm">
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
                {registros.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{r.producto}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm border border-slate-200" style={{ backgroundColor: r.color }}></div>
                        <span>{r.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{r.nombre_color}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 text-center font-bold">{r.cantidad} UNS</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">{r.fecha}</td>
                  </tr>
                ))}
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
