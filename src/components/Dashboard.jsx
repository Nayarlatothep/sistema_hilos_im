import React, { useMemo } from 'react';
import { styled } from '../lib/stitches.config';
import { useStore } from '../store/useStore';
import { Layers } from 'lucide-react';

const Card = styled('div', {
  backgroundColor: '$surface',
  borderRadius: '$2',
  padding: '$5',
  boxShadow: '$1',
});

const Title = styled('h2', {
  fontSize: '$4',
  marginBottom: '$4',
  color: '$text',
  display: 'flex',
  alignItems: 'center',
  gap: '$2'
});

const KPIContainer = styled('div', {
  display: 'grid',
  gap: '$4',
  gridTemplateColumns: '1fr',
  '@sm': {
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  }
});

const StationCard = styled('div', {
  padding: '$4',
  border: '1px solid $border',
  borderRadius: '$2',
  backgroundColor: '$background',
});

const StationName = styled('h3', {
  fontSize: '$3',
  marginBottom: '$2',
  display: 'flex',
  justifyContent: 'space-between',
});

const ProgressText = styled('span', {
  fontSize: '$2',
  color: '$textLight',
});

const ProgressBarContainer = styled('div', {
  width: '100%',
  height: '12px',
  backgroundColor: '$border',
  borderRadius: '$round',
  overflow: 'hidden',
  marginTop: '$2',
});

const ProgressBarFill = styled('div', {
  height: '100%',
  backgroundColor: '$primary',
  transition: 'width 0.5s ease-in-out',
  variants: {
    status: {
      success: { backgroundColor: '$success' },
      warning: { backgroundColor: '$warning' },
      danger: { backgroundColor: '$error' }
    }
  }
});

export default function Dashboard() {
  const { planificacion, transferencias } = useStore();

  const stationsData = useMemo(() => {
    const stations = {
      '1': { planned: 0, transferred: 0 },
      '2': { planned: 0, transferred: 0 },
      '3': { planned: 0, transferred: 0 }
    };

    // Calculate planned by module
    planificacion.forEach(p => {
      const mod = p.modulo;
      if (stations[mod]) {
        stations[mod].planned += parseInt(p.cantidad || 0, 10);
      }
    });

    // Calculate transferred by module
    transferencias.forEach(t => {
      const mod = t.modulo;
      if (stations[mod]) {
        stations[mod].transferred += parseInt(t.cantidad || 0, 10);
      }
    });

    return Object.entries(stations).map(([name, data]) => {
      const percent = data.planned > 0 ? Math.min(100, (data.transferred / data.planned) * 100) : 0;
      let status = 'danger';
      if (percent >= 100) status = 'success';
      else if (percent >= 50) status = 'warning';

      return {
        name,
        planned: data.planned,
        transferred: data.transferred,
        percent,
        status
      };
    });
  }, [planificacion, transferencias]);

  if (stationsData.length === 0) {
    return (
      <Card>
        <Title>
          <Layers size={24} color="var(--colors-primary)" />
          Dashboard KPI - Carga por Modulos
        </Title>
        <p style={{ color: 'var(--colors-textLight)' }}>No hay datos disponibles para mostrar el progreso por módulos.</p>
      </Card>
    );
  }

  const productionData = useMemo(() => {
    const products = {};

    // First pass: group planned data by product+color
    planificacion.forEach(p => {
      const key = `${p.producto}_${p.color}`;
      if (!products[key]) {
        products[key] = {
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          mod1_planned: 0,
          mod1_transferred: 0,
          mod2_planned: 0,
          mod2_transferred: 0,
          mod3_planned: 0,
          mod3_transferred: 0,
        };
      }
      if (p.modulo === '1') products[key].mod1_planned += parseInt(p.cantidad || 0, 10);
      if (p.modulo === '2') products[key].mod2_planned += parseInt(p.cantidad || 0, 10);
      if (p.modulo === '3') products[key].mod3_planned += parseInt(p.cantidad || 0, 10);
    });

    // Second pass: add actual transfer data (yardas calculated mapping)
    transferencias.forEach(t => {
      const key = `${t.producto}_${t.color}`;
      if (products[key]) {
        const qty = parseInt(t.cantidad || 0, 10);
        if (t.modulo === '1') products[key].mod1_transferred += qty;
        if (t.modulo === '2') products[key].mod2_transferred += qty;
        if (t.modulo === '3') products[key].mod3_transferred += qty;
      }
    });

    return Object.values(products).map(p => {
      const totalTransferred = p.mod1_transferred + p.mod2_transferred + p.mod3_transferred;
      const totalPlanned = p.mod1_planned + p.mod2_planned + p.mod3_planned;
      const percent = totalPlanned > 0 ? Math.min(100, (totalTransferred / totalPlanned) * 100) : 0;
      return { ...p, totalTransferred, totalPlanned, percent };
    });
  }, [planificacion, transferencias]);

  const now = new Date();
  const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} | ${now.toLocaleDateString()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Card>
        <Title>
          <Layers size={24} color="var(--colors-primary)" />
          Dashboard KPI - Carga por Modulos
        </Title>
        
        <KPIContainer>
          {stationsData.map(st => (
            <StationCard key={st.name}>
              <StationName>
                Módulo {st.name}
                <ProgressText>{Math.round(st.percent)}%</ProgressText>
              </StationName>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>{st.transferred.toLocaleString()}</strong> / {st.planned.toLocaleString()} Transferidos
              </div>
              <ProgressBarContainer>
                <ProgressBarFill 
                  style={{ width: `${st.percent}%` }} 
                  status={st.status} 
                />
              </ProgressBarContainer>
            </StationCard>
          ))}
        </KPIContainer>
      </Card>


      {/* Production Monitor - Advanced Implementation */}
      <section className="bg-white p-8 shadow-sm border border-slate-100" style={{ borderRadius: '0.125rem' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
          .font-headline { font-family: 'Manrope', sans-serif !important; }
          .font-body { font-family: 'Inter', sans-serif !important; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}} />

        <div className="mb-12">
          <p className="text-sm font-bold text-[#a53c00] uppercase tracking-[0.2em] mb-2 font-headline">Real-Time Performance</p>
          <div className="flex justify-between items-end">
            <h2 className="text-5xl font-black text-[#001731] tracking-tighter font-headline">Production Monitor</h2>
            <div className="text-right">
              <p className="text-slate-500 text-[10px] font-bold uppercase font-headline">Last Update</p>
              <p className="font-bold text-[#001731] font-body">{timestamp}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              className="w-full bg-slate-50 border-none border-b-2 border-slate-200 focus:border-[#001731] focus:ring-0 text-sm py-3 pl-10 rounded-t-lg" 
              placeholder="Search product or module..." 
              type="text"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-[#001731] text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-[#001731] text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-sm">download</span> Export
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-[#a53c00] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#8f3400] transition-colors">
              Run Optimization
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar max-h-[600px] border border-slate-100">
          <table className="w-full border-collapse sticky-header">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-left text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 font-headline">
                <th className="py-4 px-4 bg-white">Producto</th>
                <th className="py-4 px-4 text-center bg-white">Color</th>
                <th className="py-4 px-4 bg-white">Nombre Color</th>
                <th className="py-4 px-4 text-right bg-white">Módulo 1</th>
                <th className="py-4 px-4 text-right bg-white">Módulo 2</th>
                <th className="py-4 px-4 text-right bg-white">Módulo 3</th>
                <th className="py-4 px-4 text-right bg-white">Cant. Transferida</th>
                <th className="py-4 px-4 text-right bg-white">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {productionData.map((row, idx) => (
                <tr key={idx} className="group hover:bg-slate-50 transition-colors font-body">
                  <td className="py-6 px-4">
                    <p className="text-sm font-black text-[#001731] font-headline">{row.producto}</p>
                    <p className="text-[10px] text-slate-400 font-body">Line Active | Production ID: {idx + 101}</p>
                  </td>
                  <td className="py-6 px-4">
                    <div 
                      className="w-6 h-6 rounded-full mx-auto border-2 border-white shadow-sm" 
                      style={{ backgroundColor: row.color }}
                    ></div>
                  </td>
                  <td className="py-6 px-4"><span className="text-xs font-semibold text-slate-700">{row.nombre_color}</span></td>
                  <td className="py-6 px-4 text-right text-xs font-medium">{row.mod1_transferred.toLocaleString()} / {row.mod1_planned.toLocaleString()}</td>
                  <td className="py-6 px-4 text-right text-xs font-medium">{row.mod2_transferred.toLocaleString()} / {row.mod2_planned.toLocaleString()}</td>
                  <td className="py-6 px-4 text-right text-xs font-medium">{row.mod3_transferred.toLocaleString()} / {row.mod3_planned.toLocaleString()}</td>
                  <td className="py-6 px-4 text-right text-sm font-bold text-[#001731]">{row.totalTransferred.toLocaleString()}</td>
                  <td className="py-6 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-black text-[#a53c00]">{Math.round(row.percent)}%</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${row.percent >= 100 ? 'bg-emerald-500' : row.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-6 font-headline">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Production Overview | {productionData.length} lines active</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Optimal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Watchlist</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Critical</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
