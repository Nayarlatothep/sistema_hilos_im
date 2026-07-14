import React, { useState } from 'react';

export default function AppLayout({ children, currentTab, onTabChange }) {
  const [openMaterialExpirado, setOpenMaterialExpirado] = useState(true);
  const [openMateriaPrima, setOpenMateriaPrima] = useState(true);
  const [openHilos, setOpenHilos] = useState(true);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const isExpanded = isSidebarPinned || isSidebarHovered;

  return (
    <div className="bg-background font-body text-on-background antialiased min-h-screen flex h-screen overflow-hidden">
      
      {/* Sidebar (Desktop Only) */}
      <aside 
        className={`${isExpanded ? 'w-64' : 'w-20'} bg-[#2C3E50] shadow-2xl flex-col hidden md:flex h-full z-50 overflow-y-auto flex-shrink-0 transition-all duration-300 relative group`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarPinned(!isSidebarPinned)}
          className={`absolute top-3 right-3 text-white/40 hover:text-white transition-opacity z-50 bg-black/20 p-1.5 rounded-full ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title={isSidebarPinned ? "Ocultar menú" : "Fijar menú"}
        >
          <span className="material-symbols-outlined text-[14px]">
            {isSidebarPinned ? 'push_pin' : 'dock_to_right'}
          </span>
        </button>

        {/* Logo Area */}
        <div className={`p-4 flex flex-col items-center border-b border-white/10 gap-3 mt-8 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden py-0 border-transparent mt-2'}`}>
          <img 
            alt="Intermoda Logo" 
            className="h-12 w-auto drop-shadow-md" 
            src="/intermoda_logo.png"
          />
          <h1 className="text-[13px] font-bold tracking-tighter text-white font-headline text-center leading-tight whitespace-nowrap">
            Módulos Externos<br/>Materia Prima
          </h1>
        </div>
        
        {/* Logo Icon when Collapsed */}
        <div className={`p-4 flex flex-col items-center border-b border-white/10 gap-3 mt-4 transition-all duration-300 ${isExpanded ? 'hidden' : 'block'}`}>
          <img 
            alt="Logo Icon" 
            className="h-8 w-auto drop-shadow-md" 
            src="/intermoda_logo.png"
          />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-x-hidden">
          


          {/* Ingreso Archivos */}
          <a 
            href="#"
            className={`flex items-center gap-3 ${isExpanded ? 'px-4' : 'justify-center px-0'} py-3 rounded-lg text-xs font-headline transition-all uppercase tracking-widest font-bold mb-2 ${currentTab === 'upload' ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            onClick={(e) => { e.preventDefault(); onTabChange('upload'); }}
            title="Ingreso Archivos"
          >
            <span className="material-symbols-outlined text-[22px]">upload_file</span>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Ingreso Archivos</span>
          </a>

          {/* Materia Prima Accordion */}
          <div className="flex flex-col mb-2">
            <button 
              onClick={() => { if (isExpanded) setOpenMateriaPrima(!openMateriaPrima); }}
              className={`flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center px-0'} py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-headline text-xs uppercase tracking-widest font-bold`}
              title="Materia Prima"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Materia Prima</span>
              </div>
              {isExpanded && <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${openMateriaPrima ? 'rotate-180' : ''}`}>expand_more</span>}
            </button>
            <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ${openMateriaPrima && isExpanded ? 'max-h-[500px] mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
              
              {/* Nested Accordion: HILOS */}
              <div className="flex flex-col ml-4 border-l border-white/10">
                <button 
                  onClick={() => { if (isExpanded) setOpenHilos(!openHilos); }}
                  className={`flex items-center justify-between pl-6 pr-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors font-headline text-[11px] uppercase tracking-widest font-bold`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">line_weight</span>
                    HILOS
                  </div>
                  <span className={`material-symbols-outlined text-[14px] transition-transform duration-300 ${openHilos ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ${openHilos ? 'max-h-64 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <a 
                    href="#"
                    className={`flex items-center pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-r-lg transition-colors whitespace-nowrap ${currentTab === 'dashboard-monitor' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    onClick={(e) => { e.preventDefault(); onTabChange('dashboard-monitor'); }}
                  >
                    INDICADOR SEMANAL HILOS
                  </a>
                  <a 
                    href="#"
                    className={`flex items-center pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-r-lg transition-colors whitespace-nowrap ${currentTab === 'dashboard-transfer' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    onClick={(e) => { e.preventDefault(); onTabChange('dashboard-transfer'); }}
                  >
                    TRANSFERENCIA
                  </a>
                  <a 
                    href="#"
                    className={`flex items-center pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-r-lg transition-colors whitespace-nowrap ${currentTab === 'traslados' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    onClick={(e) => { e.preventDefault(); onTabChange('traslados'); }}
                  >
                    TRASLADO HILOS
                  </a>
                  <a 
                    href="#"
                    className={`flex items-center pl-10 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-r-lg transition-colors whitespace-nowrap ${currentTab === 'devolucion' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    onClick={(e) => { e.preventDefault(); onTabChange('devolucion'); }}
                  >
                    DEVOLUCION
                  </a>
                </div>
              </div>
              
            </div>
          </div>

          {/* Tejido de Punto */}
          <a 
            href="#"
            className={`flex items-center gap-3 ${isExpanded ? 'px-4' : 'justify-center px-0'} py-3 rounded-lg text-xs font-headline transition-all uppercase tracking-widest font-bold mb-2 ${currentTab === 'tejido-punto' ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            onClick={(e) => { e.preventDefault(); onTabChange('tejido-punto'); }}
            title="Tejido de Punto"
          >
            <span className="material-symbols-outlined text-[22px]">texture</span>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Tejido de Punto</span>
          </a>

          {/* Material Expirado Accordion */}
          <div className="flex flex-col mb-2">
            <button 
              onClick={() => { if (isExpanded) setOpenMaterialExpirado(!openMaterialExpirado); }}
              className={`flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center px-0'} py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-headline text-xs uppercase tracking-widest font-bold`}
              title="Material Expirado"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">warning</span>
                <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Material Expirado</span>
              </div>
              {isExpanded && <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${openMaterialExpirado ? 'rotate-180' : ''}`}>expand_more</span>}
            </button>
            <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ${openMaterialExpirado && isExpanded ? 'max-h-64 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
              <a 
                href="#"
                className={`flex items-center pl-11 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${currentTab === 'dashboard-vencimiento' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                onClick={(e) => { e.preventDefault(); onTabChange('dashboard-vencimiento'); }}
              >
                Indicador de Vencimiento
              </a>
              <a 
                href="#"
                className={`flex items-center pl-11 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${currentTab === 'lotes' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                onClick={(e) => { e.preventDefault(); onTabChange('lotes'); }}
              >
                Ingreso Lotes
              </a>
              <a 
                href="#"
                className={`flex items-center pl-11 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${currentTab === 'reporte-lotes' ? 'text-secondary bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                onClick={(e) => { e.preventDefault(); onTabChange('reporte-lotes'); }}
              >
                Ajuste de Lotes
              </a>
            </div>
          </div>

        </nav>

        {/* User Profile & Footer Area in Sidebar */}
        <div className={`p-4 border-t border-white/10 bg-black/20 flex flex-col gap-4 transition-all duration-300`}>
          <div className={`flex items-center justify-between text-white/60 ${isExpanded ? 'flex-row' : 'flex-col gap-4'}`}>
            <button className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" title="Notificaciones">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" title="Configuración">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
          <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'} relative overflow-hidden`}>
            <div className="h-9 w-9 rounded-full bg-primary-container overflow-hidden flex-shrink-0 ring-2 ring-white/10" title="Victor Rojas (Admin)">
              <img 
                alt="User profile avatar" 
                className="h-full w-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7sQibDyUj4dXe069m68Dx7x_CjcvWzq1MZurjQJP637ApxrL2LdPkwrfY6IS1jz6zNpEiGtwquxyumqnwr65DOC62jAbvytzcdBl4vGTvjAy-_wxOAm1zMbruRRon_Jy8fg7gH_5SDn82o1pjzrVREDbw2Hn5OikI9z679xg_dFoZjNgf1_seun0x3xAGZVfD_fFOfFGHJVxDWHNBd--bg7FB8dkFlFm2oDp4uwVZj4ay3MxtXjl0LykvGfrA-x0ljeQAJ3qVZD0"
              />
            </div>
            <div className={`flex flex-col truncate transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
              <span className="text-white text-xs font-bold truncate">Victor Rojas</span>
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative w-full">
        
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 w-full z-40 bg-[#2C3E50] h-14 flex justify-between items-center px-4 border-b border-white/10">
          <img alt="Intermoda Logo" className="h-7 w-auto drop-shadow-md" src="/intermoda_logo.png" />
          <h1 className="text-sm font-bold tracking-tighter text-white font-headline">Módulos Externos</h1>
          <div className="h-7 w-7 rounded-full bg-primary-container overflow-hidden">
             <img alt="User profile" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7sQibDyUj4dXe069m68Dx7x_CjcvWzq1MZurjQJP637ApxrL2LdPkwrfY6IS1jz6zNpEiGtwquxyumqnwr65DOC62jAbvytzcdBl4vGTvjAy-_wxOAm1zMbruRRon_Jy8fg7gH_5SDn82o1pjzrVREDbw2Hn5OikI9z679xg_dFoZjNgf1_seun0x3xAGZVfD_fFOfFGHJVxDWHNBd--bg7FB8dkFlFm2oDp4uwVZj4ay3MxtXjl0LykvGfrA-x0ljeQAJ3qVZD0" />
          </div>
        </header>

        {/* Main Area */}
        <main className={`flex-grow w-full mx-auto px-4 md:px-8 pb-24 md:pb-12 pt-20 md:pt-8 transition-all duration-300 ${currentTab === 'reporte-lotes' || currentTab === 'lotes' || currentTab === 'dashboard-vencimiento' ? 'max-w-[100vw]' : 'max-w-7xl'}`}>
          {children}
        </main>

        <footer className="bg-surface-container-low text-on-surface-variant py-6 px-8 mt-auto hidden md:flex flex-col md:flex-row justify-between items-center text-xs border-t border-outline-variant">
          <p>&copy; 2024 Intermoda S.A. Sistema de Control de Producción v4.2</p>
          <div className="flex gap-6 mt-4 md:mt-0 font-bold">
            <a href="#" className="hover:text-primary transition-colors">Estado del Sistema</a>
            <a href="#" className="hover:text-primary transition-colors">Soporte Técnico</a>
          </div>
        </footer>
      </div>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#2C3E50] md:hidden flex justify-around items-center border-t border-white/10 z-50 shadow-2xl">
        <div 
          className={`flex flex-col items-center gap-1 w-1/5 ${currentTab === 'dashboard-monitor' || currentTab === 'dashboard-vencimiento' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('dashboard-monitor')}
        >
          <span className="material-symbols-outlined text-2xl">dashboard</span>
          <span className="text-[9px] font-bold uppercase text-center tracking-wider">Dash</span>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 w-1/5 ${currentTab === 'dashboard-transfer' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('dashboard-transfer')}
        >
          <span className="material-symbols-outlined text-2xl">local_shipping</span>
          <span className="text-[9px] font-bold uppercase text-center tracking-wider">Transf</span>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 w-1/5 relative -top-3`}
          onClick={() => onTabChange('upload')}
        >
          <div className={`h-12 w-12 rounded-full shadow-xl flex items-center justify-center border-4 border-background ${currentTab === 'upload' ? 'bg-secondary text-white' : 'bg-[#001731] text-white/80'}`}>
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 w-1/5 ${currentTab === 'devolucion' || currentTab === 'traslados' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('devolucion')}
        >
          <span className="material-symbols-outlined text-2xl">keyboard_return</span>
          <span className="text-[9px] font-bold uppercase text-center tracking-wider">Devol</span>
        </div>
        <div 
          className={`flex flex-col items-center gap-1 w-1/5 ${currentTab === 'lotes' || currentTab === 'reporte-lotes' ? 'text-secondary' : 'text-white/40'}`}
          onClick={() => onTabChange('lotes')}
        >
          <span className="material-symbols-outlined text-2xl">layers</span>
          <span className="text-[9px] font-bold uppercase text-center tracking-wider">Lotes</span>
        </div>
      </nav>

    </div>
  );
}
