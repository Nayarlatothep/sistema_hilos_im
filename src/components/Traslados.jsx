import React from 'react';

export default function Traslados() {
  return (
    <div key="traslados">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-secondary font-bold tracking-widest text-[10px] uppercase mb-2 block">Warehouse Logistics</span>
            <h1 className="text-5xl font-extrabold text-primary tracking-tight font-headline">Textile Inventory</h1>
            <p className="text-on-surface-variant mt-2 max-w-xl">Real-time status of yarn, thread, and finished textile assets across the Intermoda manufacturing floor.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-outline-variant/30 text-on-surface font-semibold rounded-xl hover:bg-surface-container transition-all active:scale-95">
              <span className="material-symbols-outlined text-xl">ios_share</span>
              Export
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95">
              <span className="material-symbols-outlined text-xl">add</span>
              New Entry
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-secondary transition-all">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Total Stock</p>
          <p className="text-4xl font-extrabold text-primary font-headline">12,482</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>4.2% from last week</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl transition-all">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Critical Low</p>
          <p className="text-4xl font-extrabold text-primary font-headline">18</p>
          <p className="text-on-surface-variant/60 text-xs mt-2 font-medium">Items requiring replenishment</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl transition-all">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Monthly Turnover</p>
          <p className="text-4xl font-extrabold text-primary font-headline">84%</p>
          <p className="text-on-surface-variant/60 text-xs mt-2 font-medium">Average movement rate</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl transition-all overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">Top Material</p>
            <p className="text-4xl font-extrabold text-primary font-headline">Cotton 40/1</p>
            <p className="text-on-surface-variant/60 text-xs mt-2 font-medium">Current production focus</p>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <span className="material-symbols-outlined text-8xl -mb-6 -mr-4">texture</span>
          </div>
        </div>
      </section>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-surface-container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Search by yarn, color or date..." type="text"/>
            </div>
            <button className="p-2 bg-surface-container-low rounded-lg text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> High Stock</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Warning</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-[0.15em] font-bold">
                <th className="px-8 py-4">DIA (Day)</th>
                <th className="px-6 py-4">HILO (Yarn/Thread)</th>
                <th className="px-6 py-4">COLOR (Swatch)</th>
                <th className="px-6 py-4">NOMBRE COLOR</th>
                <th className="px-6 py-4 text-right pr-8">CANTIDAD CONOS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              <tr className="hover:bg-surface-container/30 transition-colors group">
                <td className="px-8 py-5 font-semibold text-primary">24 Oct</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold">Cotton 40/1</span>
                    <span className="text-xs text-on-surface-variant">Premium Long Staple</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5" style={{ backgroundColor: '#001731' }}></div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium">Navy Blue</span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                  <span className="text-lg font-extrabold text-primary font-headline">450</span>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-tighter">Units</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-5 font-semibold text-primary">23 Oct</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold">Polyester High Tenacity</span>
                    <span className="text-xs text-on-surface-variant">Industrial Grade</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5" style={{ backgroundColor: '#a53c00' }}></div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium">Intermoda Orange</span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                  <span className="text-lg font-extrabold text-primary font-headline">1,200</span>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-tighter">Units</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-5 font-semibold text-primary">23 Oct</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold">Merino Wool Blend</span>
                    <span className="text-xs text-on-surface-variant">Seasonal Collection</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5" style={{ backgroundColor: '#e2e8f0' }}></div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium">Cloud Grey</span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                  <span className="text-lg font-extrabold text-secondary font-headline">85</span>
                  <span className="text-[10px] text-secondary block uppercase font-bold tracking-tighter">Low Stock</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-5 font-semibold text-primary">22 Oct</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold">Linen 20/2</span>
                    <span className="text-xs text-on-surface-variant">Sustainable Origin</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5" style={{ backgroundColor: '#2D486A' }}></div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium">Steel Blue</span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                  <span className="text-lg font-extrabold text-primary font-headline">820</span>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-tighter">Units</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-5 font-semibold text-primary">21 Oct</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold">Viscose Satin Finish</span>
                    <span className="text-xs text-on-surface-variant">High Luster</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5" style={{ backgroundColor: '#1a1c1e' }}></div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium">Midnight Black</span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                  <span className="text-lg font-extrabold text-primary font-headline">2,150</span>
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-tighter">Units</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-5 font-semibold text-primary">21 Oct</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold">Nylon 6,6</span>
                    <span className="text-xs text-on-surface-variant">Reinforced Fiber</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5" style={{ backgroundColor: '#BA1A1A' }}></div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium">Crimson Alert</span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                  <span className="text-lg font-extrabold text-error font-headline">12</span>
                  <span className="text-[10px] text-error block uppercase font-bold tracking-tighter">Critical</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant font-bold uppercase tracking-widest">
          <div>Showing 6 of 142 items</div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-white transition-all disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-white transition-all">2</button>
            <button className="w-8 h-8 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-white transition-all">3</button>
            <button className="w-8 h-8 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-white transition-all">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      <aside className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-primary-container text-white p-10 rounded-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold font-headline leading-tight">Automated Reordering <br/>System Active</h3>
            <p className="mt-4 text-on-primary-container max-w-md">Intermoda AI is monitoring thread levels. High-tenacity polyester is currently scheduled for replenishment in 48 hours.</p>
          </div>
          <div className="relative z-10">
            <button className="px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:shadow-xl transition-all">Review Schedule</button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none">
            <svg className="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M44.7,-76.4C58.2,-69.2,70.1,-58.5,77.5,-45.5C84.9,-32.5,87.7,-17.2,85.6,-2.4C83.5,12.4,76.5,26.7,68.2,39.8C59.9,52.8,50.3,64.6,38.1,71.7C25.8,78.8,11,81.1,-3.5,85.1C-18.1,89.1,-32.4,94.8,-46,90.5C-59.6,86.2,-72.5,71.9,-79.9,56.5C-87.3,41.1,-89.2,24.6,-87.6,9.1C-86.1,-6.3,-81,-20.7,-73,-33.7C-65,-46.7,-54.1,-58.3,-41.2,-65.7C-28.4,-73.1,-13.6,-76.3,0.8,-77.7C15.2,-79.1,29.4,-78.6,44.7,-76.4Z" fill="#FFFFFF" transform="translate(100 100)"></path>
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-center border-l-4 border-secondary">
            <span className="material-symbols-outlined text-secondary text-4xl mb-4">history</span>
            <h4 className="font-headline font-bold text-xl">Audit Log</h4>
            <p className="text-on-surface-variant text-sm mt-2">Last entry modified by R. Silva at 08:42 AM.</p>
            <a className="text-primary font-bold text-xs uppercase tracking-widest mt-6 hover:underline" href="#">View History</a>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-center">
            <span className="material-symbols-outlined text-primary text-4xl mb-4">analytics</span>
            <h4 className="font-headline font-bold text-xl">Forecasting</h4>
            <p className="text-on-surface-variant text-sm mt-2">Predicted consumption for November: +12%</p>
            <a className="text-primary font-bold text-xs uppercase tracking-widest mt-6 hover:underline" href="#">Analyze Data</a>
          </div>
        </div>
      </aside>
    </div>
  );
}
