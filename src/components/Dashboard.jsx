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
    const stations = {};

    // Map plans by station
    planificacion.forEach(p => {
      const station = p.modulo || 'Sin Asignar';
      if (!stations[station]) {
        stations[station] = {
          planned: 0,
          transferred: 0,
          items: {}
        };
      }
      stations[station].planned += parseInt(p.cantidad || 0, 10);
      
      const key = `${p.producto}_${p.nombre_color}`;
      stations[station].items[key] = true;
    });

    // Match transfers to stations
    transferencias.forEach(t => {
      const key = `${t.producto}_${t.nombre_color}`;
      const qty = parseInt(t.cantidad || 0, 10);
      
      // Find which station this item belongs to
      for (const [sName, sData] of Object.entries(stations)) {
        if (sData.items[key]) {
          sData.transferred += qty;
        }
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
          Dashboard KPI - Progreso
        </Title>
        <p style={{ color: 'var(--colors-textLight)' }}>No hay datos de planificación disponibles.</p>
      </Card>
    );
  }

  return (
    <Card>
      <Title>
        <Layers size={24} color="var(--colors-primary)" />
        Dashboard KPI - Carga por Estación
      </Title>
      
      <KPIContainer>
        {stationsData.map(st => (
          <StationCard key={st.name}>
            <StationName>
              {st.name}
              <ProgressText>{Math.round(st.percent)}%</ProgressText>
            </StationName>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>{st.transferred}</strong> / {st.planned} Transferidos
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
  );
}
