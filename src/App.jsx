import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE & STORE (Embedded for maximum reliability) ---
const supabaseUrl = 'https://lmamameujpwsnaymtzgs.supabase.co';
const supabaseAnonKey = 'public-anon-key'; // Assumed from context
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const useStore = create((set, get) => ({
  planificacion: [],
  transferencias: [],
  loading: false,
  error: null,
  fetchPlanificacion: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('planificacion_produccion').select('*');
    if (error) set({ error: error.message, loading: false });
    else set({ planificacion: data, loading: false });
  },
  fetchTransferencias: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('transferencias_realizadas').select('*');
    if (error) set({ error: error.message, loading: false });
    else set({ transferencias: data, loading: false });
  },
  uploadPlanificacion: async (records) => {
    set({ loading: true });
    const { data, error } = await supabase.from('planificacion_produccion').insert(records).select();
    if (error) { set({ error: error.message, loading: false }); return null; }
    set({ planificacion: [...get().planificacion, ...data], loading: false });
    return data;
  },
  addMultipleTransferencias: async (records) => {
    set({ loading: true });
    const { data, error } = await supabase.from('transferencias_realizadas').insert(records).select();
    if (error) { set({ error: error.message, loading: false }); return null; }
    set({ transferencias: [...get().transferencias, ...data], loading: false });
    return data;
  },
  clearPlanificacion: async () => {
    set({ loading: true });
    const { error } = await supabase.from('planificacion_produccion').delete().neq('id', 0);
    if (error) { set({ error: error.message, loading: false }); return false; }
    set({ planificacion: [], loading: false });
    return true;
  },
  clearTransferencias: async () => {
    set({ loading: true });
    const { error } = await supabase.from('transferencias_realizadas').delete().neq('id', 0);
    if (error) { set({ error: error.message, loading: false }); return false; }
    set({ transferencias: [], loading: false });
    return true;
  }
}));

// --- COMPONENTS ---

const Dashboard = () => {
  const { planificacion, transferencias } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const normalizeModule = (m) => {
    if (!m) return null;
    const str = String(m).toLowerCase();
    if (str.includes('1')) return '1';
    if (str.includes('2')) return '2';
    if (str.includes('3')) return '3';
    return null;
  };

  const stationsData = useMemo(() => {
    const stations = { '1': { pl: 0, tr: 0 }, '2': { pl: 0, tr: 0 }, '3': { pl: 0, tr: 0 } };
    planificacion.forEach(p => { const k = normalizeModule(p.modulo); if (k && stations[k]) stations[k].pl += parseInt(p.cantidad || 0, 10); });
    transferencias.forEach(t => { const k = normalizeModule(t.modulo); if (k && stations[k]) stations[k].tr += parseInt(t.cantidad || 0, 10); });
    return Object.entries(stations).map(([name, data]) => {
      const p = data.pl > 0 ? Math.min(100, (data.tr / data.pl) * 100) : 0;
      const c = p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-400' : 'bg-rose-500';
      return { name, pl: data.pl, tr: data.tr, p, c };
    });
  }, [planificacion, transferencias]);

  const productionData = useMemo(() => {
    const prods = {};
    planificacion.forEach(p => {
      const key = `${p.producto}_${p.color}`.toLowerCase().trim();
      if (!prods[key]) prods[key] = { p: p.producto, c: p.color, n: p.nombre_color, m1p: 0, m1t: 0, m2p: 0, m2t: 0, m3p: 0, m3t: 0 };
      const mk = normalizeModule(p.modulo);
      if (mk === '1') prods[key].m1p += parseInt(p.cantidad || 0, 10);
      else if (mk === '2') prods[key].m2p += parseInt(p.cantidad || 0, 10);
      else if (mk === '3') prods[key].m3p += parseInt(p.cantidad || 0, 10);
    });
    transferencias.forEach(t => {
      const key = `${t.producto}_${t.color}`.toLowerCase().trim();
      if (prods[key]) {
        const mk = normalizeModule(t.modulo);
        const qty = parseInt(t.cantidad || 0, 10);
        if (mk === '1') prods[key].m1t += qty;
        else if (mk === '2') prods[key].m2t += qty;
        else if (mk === '3') prods[key].m3t += qty;
      }
    });
    const base = Object.values(prods).map(item => {
      const totalTr = item.m1t + item.m2t + item.m3t;
      const totalPl = item.m1p + item.m2p + item.m3p;
      const pct = totalPl > 0 ? Math.min(100, (totalTr / totalPl) * 100) : 0;
      return { ...item, totalTr, totalPl, pct };
    });
    if (!searchQuery) return base;
    const term = searchQuery.toLowerCase();
    return base.filter(i => i.p.toLowerCase().includes(term) || i.n.toLowerCase().includes(term));
  }, [planificacion, transferencias, searchQuery]);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b-2 border-primary/5 pb-8">
        <div>
          <p className="text-[10px] font-black uppercase text-secondary tracking-[0.3em] mb-1 font-headline">Enterprise Monitor</p>
          <h2 className="text-5xl font-black text-primary tracking-tighter font-headline">Production Status</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-black text-slate-400 font-headline">Live Intelligence</p>
          <p className="text-sm font-bold text-primary font-body">{new Date().toLocaleTimeString()} Real-Time</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stationsData.map(st => (
          <div key={st.name} className="bg-white p-6 shadow-2xl shadow-slate-200/50 rounded-2xl border border-primary/5 group hover:border-secondary/20 transition-all">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-headline">Module {st.name}</span>
              <span className={`text-xs font-black font-headline ${st.p >= 100 ? 'text-emerald-500' : 'text-slate-900'}`}>{Math.round(st.p)}%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6 uppercase">
              <span className="text-3xl font-black text-primary font-headline">{st.tr.toLocaleString()}</span>
              <span className="text-[10px] font-black text-slate-400">/ {st.pl.toLocaleString()} yds</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${st.c}`} style={{ width: `${st.p}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-primary/5 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/10 transition-all font-body"
              placeholder="Filter by product or color signature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span> Filter
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">download</span> Export Matrix
            </button>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-outline-variant/10">
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6 text-center">Chrome</th>
                <th className="px-8 py-6">Color Name</th>
                <th className="px-8 py-6 text-right">M1 Plan</th>
                <th className="px-8 py-6 text-right">M2 Plan</th>
                <th className="px-8 py-6 text-right">M3 Plan</th>
                <th className="px-8 py-6 text-right text-primary">Yield</th>
                <th className="px-8 py-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {productionData.map((r, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-primary font-headline uppercase">{r.p}</p>
                    <p className="text-[10px] text-slate-400 font-bold">L-CODE: {i + 101}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-6 h-6 rounded-full mx-auto ring-4 ring-white shadow-sm" style={{ backgroundColor: r.c }}></div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-600 font-headline uppercase">{r.n}</td>
                  <td className="px-8 py-6 text-right text-xs font-medium tabular-nums">{r.m1t.toLocaleString()} / <span className="text-slate-400">{r.m1p.toLocaleString()}</span></td>
                  <td className="px-8 py-6 text-right text-xs font-medium tabular-nums">{r.m2t.toLocaleString()} / <span className="text-slate-400">{r.m2p.toLocaleString()}</span></td>
                  <td className="px-8 py-6 text-right text-xs font-medium tabular-nums">{r.m3t.toLocaleString()} / <span className="text-slate-400">{r.m3p.toLocaleString()}</span></td>
                  <td className="px-8 py-6 text-right text-sm font-black text-primary tabular-nums">{r.totalTr.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] font-black text-secondary tabular-nums">{Math.round(r.pct)}%</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${r.pct >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const DataIngestion = () => {
  const { uploadPlanificacion, clearPlanificacion, loading, error } = useStore();
  const [success, setSuccess] = useState(null);
  
  const onDrop = useCallback((files) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b = e.target.result;
      const wb = XLSX.read(b, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const valid = data.map(r => ({
        sku: r.SKU || r.sku || '',
        semana: r.Semana || r.semana || '',
        producto: r.Producto || r.producto || '',
        color: r.Color || r.color || '',
        nombre_color: r.Nombre_Color || r.nombre_color || r.NombreColor || '',
        modulo: r.Modulo || r.modulo || '',
        cantidad: parseInt(r.Cantidad || r.cantidad, 10)
      })).filter(r => r.producto && !isNaN(r.cantidad));
      
      if (valid.length > 0) {
        uploadPlanificacion(valid).then(r => { if (r) setSuccess(`Successfully synced ${valid.length} lines.`); });
      }
    };
    reader.readAsBinaryString(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      <header className="font-headline">
        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">Data Stream</h2>
        <p className="text-on-surface-variant font-medium mt-2">Inject external production schedules into the core database.</p>
      </header>

      {error && <div className="p-4 bg-rose-500 text-white rounded-xl font-bold">Matrix Error: {error}</div>}
      {success && <div className="p-4 bg-emerald-500 text-white rounded-xl font-bold">Stream Sync: {success}</div>}

      <div {...getRootProps()} className={`border-2 border-dashed rounded-3xl p-20 text-center transition-all cursor-pointer ${isDragActive ? 'bg-primary/5 border-primary' : 'bg-white border-primary/5 hover:border-primary/20'}`}>
        <input {...getInputProps()} />
        <span className="material-symbols-outlined text-6xl text-primary/20 mb-6">cloud_upload</span>
        <h3 className="text-xl font-black text-primary font-headline uppercase mb-2">Drop Production Manifest</h3>
        <p className="text-slate-400 font-medium mb-10">Supports XLXS, XLS and CSV standards.</p>
        <button className="px-10 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20">Open Local File</button>
      </div>

      <div className="flex justify-end">
        <button onClick={() => { if(window.confirm('Wipe DB?')) clearPlanificacion(); }} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-700 transition-colors">Recursive Wipe Database</button>
      </div>
    </div>
  );
};

// Main App Component (Nuclear Consolidation)
export default function App() {
  const { fetchPlanificacion, fetchTransferencias, loading } = useStore();
  const [tab, setTab] = useState('dashboard');

  useEffect(() => { fetchPlanificacion(); fetchTransferencias(); }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-body text-primary antialiased flex flex-col">
      {/* Dynamic Navigation Shell */}
      <nav className="fixed top-0 w-full z-50 bg-[#001731] h-20 px-10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setTab('dashboard')}>
          <div className="p-2 bg-white/10 rounded-lg group-hover:bg-secondary transition-colors">
             <span className="material-symbols-outlined text-white">monitoring</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase font-headline">Intermoda Monitor <span className="text-[8px] text-slate-400 font-normal">v11.0 CONSUL</span></h1>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => setTab('dashboard')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${tab==='dashboard'?'text-secondary':'text-white/60 hover:text-white'}`}>Intelligence Matrix</button>
          <button onClick={() => setTab('upload')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${tab==='upload'?'text-secondary':'text-white/60 hover:text-white'}`}>Data Ingestion</button>
          <button onClick={() => setTab('transfer')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${tab==='transfer'?'text-secondary':'text-white/60 hover:text-white'}`}>Execution Log</button>
        </div>

        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-white/40 cursor-pointer hover:text-white transition-colors">notifications</span>
          <div className="w-10 h-10 rounded-full bg-slate-800 p-[2px] ring-2 ring-secondary/50">
             <div className="w-full h-full rounded-full bg-slate-700"></div>
          </div>
        </div>
      </nav>

      {/* Main Execution Canvas */}
      <main className="pt-32 pb-20 px-10 max-w-7xl mx-auto w-full flex-grow">
        {loading && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-widest text-primary animate-bounce border border-primary/5">Syncing External Matrix...</div>}
        
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'upload' && <DataIngestion />}
        {tab === 'transfer' && <div className="p-20 text-center opacity-20 uppercase font-black text-4xl tracking-tighter">Execution Log Ready</div>}
      </main>

      {/* Persistence Controls (Mobile) */}
      <footer className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#001731] rounded-full px-8 py-4 flex gap-10 shadow-2xl shadow-primary/40">
           <button onClick={() => setTab('dashboard')} className={`material-symbols-outlined ${tab==='dashboard'?'text-secondary':'text-white/40'}`}>dashboard</button>
           <button onClick={() => setTab('upload')} className={`material-symbols-outlined ${tab==='upload'?'text-secondary':'text-white/40'}`}>factory</button>
           <button onClick={() => setTab('transfer')} className={`material-symbols-outlined ${tab==='transfer'?'text-secondary':'text-white/40'}`}>inventory_2</button>
      </footer>
    </div>
  );
}
