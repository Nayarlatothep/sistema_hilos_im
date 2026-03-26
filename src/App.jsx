import React, { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout';
import DataIngestion from './components/DataIngestion';
import { useStore } from './store/useStore';
import Dashboard from './components/Dashboard';
import TransferForm from './components/TransferForm';
import Traslados from './components/Traslados';

function App() {
  const { fetchPlanificacion, fetchTransferencias, loading, error } = useStore();
  const [currentTab, setCurrentTab] = useState('dashboard-monitor');

  useEffect(() => {
    fetchPlanificacion();
    fetchTransferencias();
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard-monitor': return <Dashboard />;
      case 'dashboard-transfer': return <TransferForm />;
      case 'traslados': return <Traslados />;
      case 'upload': return <DataIngestion />;
      default: return <Dashboard />;
    }
  };

  return (
    <div key="app-contex">
      {error && (
        <div className="fixed top-24 right-10 z-[100] bg-rose-500 text-white p-6 rounded-2xl shadow-2xl animate-bounce font-black flex items-center gap-4">
          <span className="material-symbols-outlined">warning</span>
          <p className="font-headline uppercase text-[10px] tracking-widest">System Warning: {error}</p>
        </div>
      )}
      <AppLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          {renderContent()}
        </div>
      </AppLayout>
    </div>
  );
}

export default App;
