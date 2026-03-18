import React, { useState, useMemo, useEffect } from 'react';
import { styled } from '../lib/stitches.config';
import { useStore } from '../store/useStore';
import { RefreshCw, Plus } from 'lucide-react'; // Removing non-existent icons causing crash

const Container = styled('div', {
  maxWidth: '1024px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '$8',
});

const PageHeader = styled('div', {
  h2: {
    fontSize: '$2xl',
    fontWeight: '700',
    color: '$primary',
    '@md': { fontSize: '1.875rem' },
  },
  p: {
    color: '$gray500',
    marginTop: '$2',
  }
});

const FormCard = styled('div', {
  backgroundColor: 'white',
  borderRadius: '$3',
  boxShadow: '$sm',
  border: '1px solid $border',
  overflow: 'hidden',
});

const Banner = styled('div', {
  height: '12rem',
  width: '100%',
  background: 'linear-gradient(to right, rgba(30, 64, 175, 0.1), rgba(30, 64, 175, 0.05))',
  position: 'relative',
  borderBottom: '1px solid $gray100',
  display: 'flex',
  alignItems: 'center',
  padding: '0 $8',
  zIndex: 1,
});

const BannerIconBox = styled('div', {
  backgroundColor: '#1e40af',
  padding: '$3',
  borderRadius: '$2',
  color: 'white',
  boxShadow: '0 10px 15px -3px rgba(30, 64, 175, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$4',
});

const BannerText = styled('div', {
  h3: {
    fontSize: '$xl',
    fontWeight: '700',
    color: '$text',
  },
  p: {
    color: '$gray500',
    fontSize: '$sm',
  }
});

const AbstractOverlay = styled('div', {
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: '33%',
  opacity: 0.1,
  background: 'radial-gradient(circle at center, #1e40af, transparent)',
  zIndex: -1,
});

const FormContent = styled('form', {
  padding: '$8',
});

const FormGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '$6',
  '@md': {
    gridTemplateColumns: '1fr 1fr',
  }
});

const InputGroup = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$2',
});

const Label = styled('label', {
  fontSize: '$sm',
  fontWeight: '600',
  color: '$gray500',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  span: { color: '#1e40af', fontSize: '1.1rem' }
});

const InputControl = styled('div', {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

const StyledInput = styled('input', {
  width: '100%',
  borderRadius: '$2',
  border: '1px solid $gray200',
  backgroundColor: '$gray50',
  padding: '$3',
  fontSize: '$sm',
  transition: 'all 0.2s',
  '&:focus': {
    borderColor: '#1e40af',
    boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.1)',
    outline: 'none',
  }
});

const StyledSelect = styled('select', {
  width: '100%',
  borderRadius: '$2',
  border: '1px solid $gray200',
  backgroundColor: '$gray50',
  padding: '$3',
  fontSize: '$sm',
  appearance: 'none',
  transition: 'all 0.2s',
  '&:focus': {
    borderColor: '#1e40af',
    boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.1)',
    outline: 'none',
  }
});

const UnitLabel = styled('span', {
  position: 'absolute',
  right: '$3',
  fontSize: '$xs',
  fontWeight: '700',
  color: '$gray500',
});

const FooterActions = styled('div', {
  marginTop: '$10',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '$4',
  borderTop: '1px solid $gray100',
  paddingTop: '$8',
});

const CancelButton = styled('button', {
  padding: '$3 $6',
  borderRadius: '$2',
  fontWeight: '500',
  color: '$gray500',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': { backgroundColor: '$gray100' }
});

const SubmitButton = styled('button', {
  padding: '$3 $10',
  borderRadius: '$2',
  backgroundColor: '#1e40af',
  color: 'white',
  fontWeight: '700',
  border: 'none',
  boxShadow: '0 10px 15px -3px rgba(30, 64, 175, 0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  transition: 'all 0.2s',
  '&:hover': { backgroundColor: '#1d3557', opacity: 0.9 },
  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
});

const TableSection = styled('div', {
  marginTop: '$8',
  display: 'flex',
  flexDirection: 'column',
  gap: '$4',
});

const TableHeader = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '$4',
  '@sm': { flexDirection: 'row', alignItems: 'center' },
  h3: { fontSize: '$xl', fontWeight: '700', color: '$text' }
});

const RefreshButton = styled('button', {
  padding: '$2 $6',
  borderRadius: '$2',
  backgroundColor: 'white',
  color: '#1e40af',
  border: '1px solid rgba(30, 64, 175, 0.2)',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  cursor: 'pointer',
  boxShadow: '$sm',
  transition: 'all 0.2s',
  '&:hover': { backgroundColor: '$gray50' }
});

const TableCard = styled('div', {
  backgroundColor: 'white',
  borderRadius: '$3',
  boxShadow: '$sm',
  border: '1px solid $border',
  overflow: 'hidden',
});

const TableWrapper = styled('div', {
  overflowX: 'auto',
});

const Table = styled('table', {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
});

const Th = styled('th', {
  padding: '$4 $6',
  fontSize: '$xs',
  fontWeight: '700',
  textTransform: 'uppercase',
  color: '$gray500',
  backgroundColor: '$gray50',
  borderBottom: '1px solid $gray100',
});

const Td = styled('td', {
  padding: '$4 $6',
  fontSize: '$sm',
  color: '$text',
  borderBottom: '1px solid $gray100',
});

const StatusDot = styled('div', {
  width: '16px',
  height: '16px',
  borderRadius: '$round',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
});

export default function TransferForm() {
  const { planificacion, transferencias, addTransferencia, fetchTransferencias, loading } = useStore();
  
  const [formData, setFormData] = useState({
    sku: '',
    nombre_color: '',
    modulo: '',
    cantidad: ''
  });

  const [msg, setMsg] = useState(null);

  // Group and calculate remaining quantities
  const inventoryData = useMemo(() => {
    const dataMap = {};
    planificacion.forEach(p => {
      const key = `${p.producto} - ${p.nombre_color}`;
      if (!dataMap[key]) {
        dataMap[key] = {
          sku: p.sku || p.producto,
          producto: p.producto,
          color: p.color,
          nombre_color: p.nombre_color,
          planned: 0,
          transferred: 0
        };
      }
      dataMap[key].planned += parseInt(p.cantidad || 0, 10);
    });

    transferencias.forEach(t => {
      const key = `${t.producto} - ${t.nombre_color}`;
      if (dataMap[key]) {
        dataMap[key].transferred += parseInt(t.cantidad || 0, 10);
      }
    });

    return Object.values(dataMap);
  }, [planificacion, transferencias]);

  const selectedItem = useMemo(() => {
    return inventoryData.find(item => item.sku === formData.sku);
  }, [inventoryData, formData.sku]);

  const maxAllowed = selectedItem ? Math.max(0, selectedItem.planned - selectedItem.transferred) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const qty = parseInt(formData.cantidad, 10);
    if (!formData.sku || !selectedItem) {
      alert('Por favor seleccione un producto.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      alert('Ingrese una cantidad válida.');
      return;
    }

    const payload = {
      sku: formData.sku,
      producto: selectedItem.producto,
      color: selectedItem.color,
      nombre_color: selectedItem.nombre_color,
      modulo: formData.modulo,
      cantidad: qty,
      fecha_transferencia: new Date().toISOString()
    };

    const res = await addTransferencia(payload);
    if (res) {
      setMsg({ type: 'success', text: `Transferencia de ${qty} completada.` });
      setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '' });
      setTimeout(() => setMsg(null), 3000);
    } else {
      alert('Error al registrar transferencia.');
    }
  };

  const handleRefresh = () => {
    fetchTransferencias();
  };

  return (
    <Container>
      <PageHeader>
        <h2>Registro de Material</h2>
        <p>Ingrese los detalles del hilo para el control de inventario de Intermoda.</p>
      </PageHeader>

      <FormCard>
        <Banner>
          <BannerIconBox>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>inventory_2</span>
          </BannerIconBox>
          <BannerText>
            <h3>Detalles de Producción</h3>
            <p>Complete todos los campos requeridos para el ingreso.</p>
          </BannerText>
          <AbstractOverlay />
        </Banner>

        <FormContent onSubmit={handleSubmit}>
          <FormGrid>
            <InputGroup>
              <Label>
                <span className="material-symbols-outlined">texture</span>
                Hilo-Color
              </Label>
              <StyledSelect 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                required
              >
                <option value="" disabled>Seleccione producto (SKU)</option>
                {inventoryData.map(item => (
                  <option key={`${item.producto}_${item.nombre_color}`} value={item.sku}>
                    {item.producto} - {item.nombre_color}
                  </option>
                ))}
              </StyledSelect>
            </InputGroup>

            <InputGroup>
              <Label>
                <span className="material-symbols-outlined">palette</span>
                Codigo de color
              </Label>
              <StyledInput 
                value={selectedItem?.color || ''} 
                readOnly 
                placeholder="Seleccione un producto"
              />
            </InputGroup>

            <InputGroup>
              <Label>
                <span className="material-symbols-outlined">grid_view</span>
                modulo
              </Label>
              <StyledSelect 
                value={formData.modulo}
                onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                required
              >
                <option value="" disabled>Seleccione módulo</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </StyledSelect>
            </InputGroup>

            <InputGroup>
              <Label>
                <span className="material-symbols-outlined">circle</span>
                Conos
              </Label>
              <InputControl>
                <StyledInput 
                  type="number" 
                  placeholder="0" 
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  required
                />
                <UnitLabel>UNS</UnitLabel>
              </InputControl>
            </InputGroup>
          </FormGrid>

          <FooterActions>
            <CancelButton type="button" onClick={() => setFormData({ sku: '', nombre_color: '', modulo: '', cantidad: '' })}>
              Cancelar
            </CancelButton>
            <SubmitButton type="submit" disabled={loading || !selectedItem}>
              <span className="material-symbols-outlined">add</span>
              {loading ? 'Agregando...' : 'Agregar'}
            </SubmitButton>
          </FooterActions>
        </FormContent>
      </FormCard>

      <TableSection>
        <TableHeader>
          <h3>Materiales Registrados</h3>
          <RefreshButton onClick={handleRefresh} disabled={loading}>
            <span className="material-symbols-outlined">upload_file</span>
            Cargar información a la tabla
          </RefreshButton>
        </TableHeader>

        <TableCard>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th>Color</Th>
                  <Th>Nombre Color</Th>
                  <Th style={{ textAlign: 'center' }}>Cantidad</Th>
                  <Th>Fecha Transferencia</Th>
                </tr>
              </thead>
              <tbody>
                {transferencias.length === 0 ? (
                  <tr>
                    <Td colSpan="5" style={{ textAlign: 'center', color: '#7a7a7a', padding: '2rem' }}>
                      No hay registros encontrados.
                    </Td>
                  </tr>
                ) : (
                  transferencias.map(t => (
                    <tr key={t.id} style={{ transition: 'background-color 0.2s' }}>
                      <Td style={{ fontWeight: '600' }}>{t.producto}</Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StatusDot style={{ backgroundColor: t.color || '#cccccc' }} />
                          <span>{t.color || 'N/A'}</span>
                        </div>
                      </Td>
                      <Td>{t.nombre_color}</Td>
                      <Td style={{ textAlign: 'center', fontWeight: '700' }}>{t.cantidad} UNS</Td>
                      <Td style={{ color: '#7a7a7a' }}>{t.fecha_transferencia?.split('T')[0]}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </TableCard>
      </TableSection>
    </Container>
  );
}
