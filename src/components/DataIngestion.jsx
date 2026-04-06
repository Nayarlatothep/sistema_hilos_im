import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useStore } from '../store/useStore';

export default function DataIngestion() {
  const [dataToUpload, setDataToUpload] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const { uploadPlanificacion, clearPlanificacion, loading } = useStore();

  const onDrop = useCallback((acceptedFiles) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDataToUpload([]);
    setErrorRows([]);
    
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const validData = [];
        const invalidData = [];

        json.forEach((row, index) => {
          const parsedRow = {
            sku: row.SKU || row.sku || '',
            semana: row.Semana || row.semana || '',
            producto: row.Producto || row.producto || '',
            color: row.Color || row.color || '',
            nombre_color: row.Nombre_Color || row.nombre_color || row.NombreColor || '',
            modulo: row.Modulo || row.modulo || row.Modulos || row.modulos || '',
            cantidad: parseInt(row.Cantidad || row.cantidad, 10),
          };

          if (parsedRow.producto && parsedRow.nombre_color && !isNaN(parsedRow.cantidad)) {
            validData.push(parsedRow);
          } else {
            invalidData.push(parsedRow);
          }
        });

        if (validData.length === 0) {
          setErrorMsg('No se encontraron registros válidos. Revise las columnas del Excel.');
        } else {
          setDataToUpload(validData);
          setSuccessMsg(`Validación exitosa. ${validData.length} registros listos.`);
        }
        
        setErrorRows(invalidData);
      } catch (err) {
        setErrorMsg('Error leyendo el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleProcessAll = async () => {
    if (dataToUpload.length === 0) return;
    const res = await uploadPlanificacion(dataToUpload);
    if (res) {
      setDataToUpload([]);
      setErrorRows([]);
      setSuccessMsg('Datos cargados exitosamente.');
      setErrorMsg(null);
    } else {
      setErrorMsg('Error de base de datos. Verifique conexión y RLS');
    }
  };

  const handleClearTable = async () => {
    if (window.confirm('¿Desea BORRAR TODA la planificación de la base de datos?')) {
      const success = await clearPlanificacion();
      if (success) setSuccessMsg('Tabla de planificación limpiada.');
    }
  };

  const totalRecords = dataToUpload.length + errorRows.length;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="flex justify-between items-center mb-6">
          <div className="font-headline">
            <h1 className="text-4xl font-black text-primary tracking-tighter uppercase">Ingreso de Planificación</h1>
            <p className="text-on-surface-variant font-medium mt-2 text-xs uppercase tracking-widest">Carga de archivos semanales y sincronización de datos.</p>
          </div>
          <button 
            onClick={handleClearTable}
            className="px-6 py-2 bg-rose-500/10 text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all rounded-full shadow-sm"
          >
            Clear Database
          </button>
        </div>

        <div 
          {...getRootProps()} 
          className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer ${
            isDragActive ? 'border-secondary bg-secondary-container/10' : 'border-outline-variant/30 bg-surface-container-lowest hover:border-secondary hover:bg-surface-container-low'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mb-4 inline-flex p-5 rounded-full bg-primary-fixed-dim/20 text-primary">
            <span className="material-symbols-outlined text-5xl">cloud_upload</span>
          </div>
          <h2 className="text-xl font-bold text-primary font-headline">Arrastre y suelte archivos de producción</h2>
          <p className="text-on-surface-variant mt-2 mb-6 font-body text-sm">Formatos soportados: .xlsx, .xls, .csv</p>
          <div className="inline-block px-8 py-3 bg-primary text-white text-sm font-bold rounded-lg shadow-lg hover:bg-[#0a1a2e] transition-all uppercase tracking-widest">
            Buscar en mi equipo
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-lg border-l-4 border-emerald-500 shadow-sm font-medium">
              <span className="material-symbols-outlined">check_circle</span>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-lg border-l-4 border-rose-500 shadow-sm font-medium">
              <span className="material-symbols-outlined">error</span>
              {errorMsg}
            </div>
          )}
        </div>
      </section>

      {(dataToUpload.length > 0 || errorRows.length > 0) && (
        <section className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-surface-container-low/50 px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="text-lg font-black font-headline text-primary uppercase tracking-tight">Data Preview</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => { setDataToUpload([]); setErrorRows([]); }}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-widest"
              >
                Clear Preview
              </button>
              <button 
                disabled={loading || dataToUpload.length === 0}
                onClick={handleProcessAll}
                className="px-8 py-2 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-secondary/30 hover:bg-[#8f3400] active:scale-95 transition-all"
              >
                {loading ? 'Processing...' : 'Upload to Supabase'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-outline-variant/20 font-headline">
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">HILO</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">PRODUCTO</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">COLOR / DESC</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant">MÓDULO</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">CANTIDAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body">
                {dataToUpload.map((row, i) => (
                  <tr key={`valid-${i}`} className="hover:bg-primary-fixed/5 transition-colors">
                    <td className="px-8 py-4 text-sm font-medium text-slate-400 tabular-nums">{row.sku || '-'}</td>
                    <td className="px-8 py-4 text-sm font-black text-primary font-headline">{row.producto}</td>
                    <td className="px-8 py-4 text-sm text-on-surface-variant">{row.color} - {row.nombre_color}</td>
                    <td className="px-8 py-4 text-sm text-slate-500">{row.modulo || 'N/A'}</td>
                    <td className="px-8 py-4 text-sm font-black text-primary text-right tabular-nums">{row.cantidad.toLocaleString()}</td>
                  </tr>
                ))}
                {errorRows.map((row, i) => (
                  <tr key={`error-${i}`} className="bg-rose-50/50">
                    <td className="px-8 py-4 text-sm font-medium text-rose-400 italic" colSpan="4">
                      Invalid record found: {row.producto || 'Missing data'}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-rose-600 text-right uppercase tracking-widest">Error</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-surface-container-low/30 px-8 py-4 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest font-headline">
            <span>Scan detected {totalRecords} entries</span>
            <span className="text-secondary">{dataToUpload.length} ready for upload</span>
          </div>
        </section>
      )}
    </div>
  );
}

