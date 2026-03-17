import React from 'react';
import AppLayout from './components/AppLayout';
import DataIngestion from './components/DataIngestion';
import { useStore } from './store/useStore';

function App() {
  const { fetchPlanificacion, fetchTransferencias } = useStore();

  React.useEffect(() => {
    fetchPlanificacion();
    fetchTransferencias();
  }, [fetchPlanificacion, fetchTransferencias]);

  return (
    <AppLayout>
      <DataIngestion />
    </AppLayout>
  );
}

export default App;
