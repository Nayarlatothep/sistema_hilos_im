import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function ReporteLotes() {
  const { lotes_material_color, fetchLoteMaterialColor, loading, error } = useStore();

  useEffect(() => {
    fetchLoteMaterialColor();
  }, []);

  if (loading) return <div className="text-center py-4">Cargando datos...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-bold mb-4 text-white">Reporte de Lotes</h2>
      <table className="min-w-full bg-[#001731] text-white border border-white/10 rounded-xl shadow-2xl">
        <thead className="bg-[#00244a]">
          <tr>
            <th className="px-4 py-2">Articulo</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">ID Color</th>
            <th className="px-4 py-2">Color</th>
            <th className="px-4 py-2">PC</th>
            <th className="px-4 py-2">Cantidad</th>
            <th className="px-4 py-2">Fecha Manufactura</th>
          </tr>
        </thead>
        <tbody>
          {lotes_material_color && lotes_material_color.length > 0 ? (
            lotes_material_color.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-[#001d3a]' : ''}>
                <td className="px-4 py-2">{row.articulo}</td>
                <td className="px-4 py-2">{row.nombre}</td>
                <td className="px-4 py-2">{row.idcolor}</td>
                <td className="px-4 py-2">{row.color}</td>
                <td className="px-4 py-2">{row.pc}</td>
                <td className="px-4 py-2">{row.cantidad}</td>
                <td className="px-4 py-2">{row.fecha_manufactura}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-2 text-center">No hay datos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
