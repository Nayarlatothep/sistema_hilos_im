import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useStore } from '../store/useStore';

export default function DataIngestion() {
  const [planData, setPlanData] = useState([]);
  const [maestroData, setMaestroData] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const { 
    uploadPlanificacion, 
    clearPlanificacion, 
    uploadMaestroHilos, 
    clearMaestroHilos,
    loading 
  } = useStore();

  const processPlanFile = (json) => {
    // User confirms CSV headers match Supabase table columns exactly
    const processed = json.map(row => {
      const entry = { ...row };
      // Fix quantity type just in case
      const qtyKey = Object.keys(entry).find(k => k.toLowerCase() === 'cantidad');
      if (qtyKey) entry[qtyKey] = parseInt(entry[qtyKey], 10);
      return entry;
    }).filter(row => Object.values(row).some(v => v !== null && v !== ''));

    setPlanData(processed);
    if (processed.length > 0) {
      setSuccessMsg(`Planificación: ${processed.length} registros listos para subir.`);
    } else {
      setErrorMsg('El archivo de planificación está vacío o no es válido.');
    }
  };

  const processMaestroFile = (json) => {
    // User confirms CSV headers match Supabase table columns exactly
    const processed = json.filter(row => Object.values(row).some(v => v !== null && v !== ''));
    setMaestroData(processed);
    if (processed.length > 0) {
      setSuccessMsg(`Maestro Hilos: ${processed.length} registros detectados.`);
    } else {
      setErrorMsg('El archivo de maestro de hilos está vacío.');
    }
  };

  const handleUploadPlan = async () => {
    if (planData.length === 0) return;
    const res = await uploadPlanificacion(planData);
    if (res) {
      setPlanData([]);
      setSuccessMsg('Planificación guardada en la base de datos.');
    } else {
      setErrorMsg('Error al guardar planificación. Revise los nombres de columnas.');
    }
  };

  const handleUploadMaestro = async () => {
    if (maestroData.length === 0) return;
    const res = await uploadMaestroHilos(maestroData);
    if (res) {
      setMaestroData([]);
      setSuccessMsg('Maestro de hilos actualizado correctamente.');
    } else {
      setErrorMsg('Error al actualizar maestro. Revise los nombres de columnas.');
    }
  };

  const handleClearPlan = async () => {
    const password = window.prompt("Ingrese la contraseña de seguridad para borrar la planificación:");
    if (password !== "shim2022+") {
      alert("Contraseña incorrecta.");
      return;
    }
    if (window.confirm('¿Está seguro de que desea borrar TODA la planificación? Esta acción es irreversible.')) {
      await clearPlanificacion();
      setSuccessMsg('Planificación borrada.');
    }
  };

  const handleClearMaestro = async () => {
    const password = window.prompt("Ingrese la contraseña de seguridad para borrar el maestro de hilos:");
    if (password !== "shim2022+") {
      alert("Contraseña incorrecta.");
      return;
    }
    if (window.confirm('¿Está seguro de que desea borrar TODO el maestro de hilos?')) {
      await clearMaestroHilos();
      setSuccessMsg('Maestro de hilos borrado.');
    }
  };

  return (
    <div className="flex flex-col gap-12 max-w-[1600px] mx-auto p-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-5xl font-black text-primary font-headline tracking-tighter uppercase leading-none">Carga de Datos Directa</h1>
        <p className="text-secondary font-bold text-xs uppercase tracking-[0.3em]">Sincronización Campo por Campo con la Base de Datos</p>
      </header>

      {(successMsg || errorMsg) && (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 ${
          successMsg ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-rose-50 border-rose-500 text-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">{successMsg ? 'check_circle' : 'error'}</span>
              <p className="text-sm font-bold uppercase tracking-tight">{successMsg || errorMsg}</p>
            </div>
            <button onClick={() => { setSuccessMsg(null); setErrorMsg(null); }} className="opacity-50 hover:opacity-100">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Section Planificación */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-primary font-headline uppercase tracking-tight">Plan Costura</h2>
              <button onClick={handleClearPlan} title="Borrar Tabla" className="text-rose-400 hover:text-rose-600 transition-colors">
                <span className="material-symbols-outlined">delete_forever</span>
              </button>
            </div>
            <div className="p-8">
              <DropzoneSection onDataParsed={processPlanFile} icon="table_chart" color="bg-primary" label="Plan de Costura" />
            </div>
          </div>
          {planData.length > 0 && (
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-black text-primary uppercase">{planData.length} Registros listos</p>
                <button onClick={handleUploadPlan} disabled={loading} className="px-6 py-2 bg-primary text-white text-xs font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                  {loading ? 'Subiendo...' : 'Confirmar Carga'}
                </button>
              </div>
              <div className="max-h-60 overflow-auto custom-scrollbar">
                <table className="w-full text-[10px] text-left">
                  <thead className="sticky top-0 bg-white shadow-sm">
                    <tr>
                      {Object.keys(planData[0] || {}).slice(0, 5).map(k => (
                        <th key={k} className="p-2 border-b uppercase text-slate-400">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-primary/5 hover:bg-white">
                        {Object.values(row).slice(0, 5).map((v, j) => (
                          <td key={j} className="p-2 whitespace-nowrap">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Section Maestro Hilos */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-secondary font-headline uppercase tracking-tight">Maestro de Hilos</h2>
              <button onClick={handleClearMaestro} title="Borrar Maestro" className="text-rose-400 hover:text-rose-600 transition-colors">
                <span className="material-symbols-outlined">delete_forever</span>
              </button>
            </div>
            <div className="p-8">
              <DropzoneSection onDataParsed={processMaestroFile} icon="inventory_2" color="bg-secondary" label="Maestro de Hilos" />
            </div>
          </div>
          {maestroData.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-black text-amber-900 uppercase">{maestroData.length} SKUs detectados</p>
                <button onClick={handleUploadMaestro} disabled={loading} className="px-6 py-2 bg-secondary text-white text-xs font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                  {loading ? 'Actualizando...' : 'Procesar Maestro'}
                </button>
              </div>
              <div className="max-h-60 overflow-auto custom-scrollbar">
                <table className="w-full text-[10px] text-left">
                  <thead className="sticky top-0 bg-amber-100 shadow-sm">
                    <tr>
                      {Object.keys(maestroData[0] || {}).slice(0, 5).map(k => (
                        <th key={k} className="p-2 border-b uppercase text-amber-700">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maestroData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-amber-200/30 hover:bg-white">
                        {Object.values(row).slice(0, 5).map((v, j) => (
                          <td key={j} className="p-2 whitespace-nowrap">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

function DropzoneSection({ onDataParsed, icon, color, label }) {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const JSONData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        onDataParsed(JSONData);
      } catch (err) { console.error(err); }
    };
    reader.readAsBinaryString(file);
  }, [onDataParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] }, maxFiles: 1
  });

  return (
    <div {...getRootProps()} className={`h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-200 hover:border-primary/30 hover:bg-slate-50'}`}>
      <input {...getInputProps()} />
      <div className={`mb-4 p-4 rounded-full ${color} text-white shadow-xl`}>
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <p className="text-sm font-black text-slate-800 uppercase">Cargar archivo de {label}</p>
      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest text-center px-4">Asegúrese que los nombres de las columnas coincidan con la base de datos</p>
    </div>
  );
}
