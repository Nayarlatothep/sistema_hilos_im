import React from 'react';

export default function AppLayout({ children, currentTab, onTabChange }) {
  return (
    <div className="bg-background font-body text-on-background antialiased min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#001731] shadow-2xl h-16 flex justify-between items-center px-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <img 
            alt="Intermoda Logo" 
            className="h-8 w-auto" 
            src="https://lh3.googleusercontent.com/aida/ADBb0ujjnX_BfJjQ0SUWgHpqJ1gv1wmTgUCBZCN_ggtke6FlYCk-MZ7J5KkSne154r2BVcQziUDav-AM6IE3DGP0aiioI_UNXbSyDSh2-KbE09X0j44oYU5tQgMgVM733Mt8aLE3wFcipBxlLpig-5novUVMO3RQ_9L-fOoJu-rpNyVjO1FGNeeH51ymkVGl3D33iyPgbLrHeze8a2yVkOBym3Za5xDwQcLiMxKnYyY59gzNFBKz655-TT9siSPxI259Agf9HyXpZBcRUw"
          />
          <h1 className="text-xl font-bold tracking-tighter text-white font-headline">Intermoda Monitor</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-8">
              <div className="relative group">
                <button 
                  className={`${(currentTab === 'dashboard' || currentTab === 'dashboard-monitor' || currentTab === 'dashboard-transfer') ? 'text-white font-bold bg-white/10 px-4 py-2 rounded-lg' : 'text-white/60 font-medium px-4 py-2 hover:text-white'} text-xs font-headline transition-all uppercase tracking-widest flex items-center gap-2`}
                >
                  DASHBOARDS
                  <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#001731] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] py-2">
                  <a 
                    href="#"
                    className={`block px-6 py-3 text-[10px] font-black uppercase tracking-widest ${currentTab === 'dashboard-monitor' ? 'text-secondary bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'} transition-colors`}
                    onClick={(e) => { e.preventDefault(); onTabChange('dashboard-monitor'); }}
                  >
                    KPI Produccion
                  </a>
                  <a 
                    href="#"
                    className={`block px-6 py-3 text-[10px] font-black uppercase tracking-widest ${currentTab === 'dashboard-transfer' ? 'text-secondary bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'} transition-colors`}
                    onClick={(e) => { e.preventDefault(); onTabChange('dashboard-transfer'); }}
                  >
                    Traslado a Almacen Producción
                  </a>
                </div>
              </div>
              <a 
                className={`${currentTab === 'upload' ? 'text-white font-bold bg-white/10 px-4 py-2 rounded-lg' : 'text-white/60 font-medium px-4 py-2 hover:text-white'} text-xs font-headline transition-all uppercase tracking-widest`} 
                href="#"
                onClick={(e) => { e.preventDefault(); onTabChange('upload'); }}
              >
                Production Data
              </a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <button className="text-slate-500 hover:text-[#a53c00] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-slate-500 hover:text-[#a53c00] transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary-container overflow-hidden">
              <img 
                alt="User profile avatar" 
                className="h-full w-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7sQibDyUj4dXe069m68Dx7x_CjcvWzq1MZurjQJP637ApxrL2LdPkwrfY6IS1jz6zNpEiGtwquxyumqnwr65DOC62jAbvytzcdBl4vGTvjAy-_wxOAm1zMbruRRon_Jy8fg7gH_5SDn82o1pjzrVREDbw2Hn5OikI9z679xg_dFoZjNgf1_seun0x3xAGZVfD_fFOfFGHJVxDWHNBd--bg7FB8dkFlFm2oDp4uwVZj4ay3MxtXjl0LykvGfrA-x0ljeQAJ3qVZD0"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 min-h-screen max-w-7xl mx-auto px-8 pb-12 w-full flex-grow">
        {children}
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#001731] md:hidden flex justify-around items-center border-t border-white/5 z-50">
        <div 
          className={`flex flex-col items-center gap-1 ${currentTab === 'dashboard-monitor' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('dashboard-monitor')}
        >
          <span className="material-symbols-outlined text-2xl">monitoring</span>
          <span className="text-[10px] font-bold uppercase text-center">KPI</span>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 ${currentTab === 'dashboard-transfer' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('dashboard-transfer')}
        >
          <span className="material-symbols-outlined text-2xl">local_shipping</span>
          <span className="text-[10px] font-bold uppercase text-center">Traslado</span>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 ${currentTab === 'upload' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('upload')}
        >
          <span className="material-symbols-outlined text-2xl">factory</span>
          <span className="text-[10px] font-bold uppercase text-center">Data</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/20">
          <span className="material-symbols-outlined text-2xl">monitoring</span>
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </div>
      </nav>

      <footer className="bg-primary text-white py-8 px-8 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-80">
          <p className="text-xs">&copy; 2024 Intermoda S.A. Sistema de Control de Producción v3.0</p>
          <div className="flex gap-6 text-xs mt-4 md:mt-0">
            <a href="#" className="hover:text-secondary-container">System Status</a>
            <a href="#" className="hover:text-secondary-container">Technical Support</a>
            <a href="#" className="hover:text-secondary-container">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

