import React from 'react';
import AppLayout from './components/AppLayout';
import DataIngestion from './components/DataIngestion';
import { useStore } from './store/useStore';

import Dashboard from './components/Dashboard';
import TransferForm from './components/TransferForm';
import Prueba from './components/Prueba';

function App() {
  const { fetchPlanificacion, fetchTransferencias } = useStore();
  const [currentTab, setCurrentTab] = React.useState('dashboard');

  React.useEffect(() => {
    fetchPlanificacion();
    fetchTransferencias();
  }, [fetchPlanificacion, fetchTransferencias]);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <DataIngestion />;
      case 'transfer':
        return <TransferForm />;
      case 'prueba':
        return <Prueba />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
}

export default App;
