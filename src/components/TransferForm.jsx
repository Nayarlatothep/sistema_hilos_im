import React, { useState, useMemo } from 'react';
import { styled } from '../lib/stitches.config';
import { useStore } from '../store/useStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
});

const Form = styled('form', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$3',
});

const Label = styled('label', {
  fontSize: '$2',
  fontWeight: '500',
  color: '$text',
  display: 'flex',
  flexDirection: 'column',
  gap: '$1',
});

const Select = styled('select', {
  width: '100%',
  height: '$inputHeight',
  padding: '0 $3',
  border: '1px solid $border',
  borderRadius: '$1',
  fontSize: '$3',
  outline: 'none',
  backgroundColor: '$surface',
  '&:focus': {
    borderColor: '$primary',
    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
  }
});

const Input = styled('input', {
  width: '100%',
  height: '$inputHeight',
  padding: '0 $3',
  border: '1px solid $border',
  borderRadius: '$1',
  fontSize: '$3',
  outline: 'none',
  '&:focus': {
    borderColor: '$primary',
    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
  }
});

const Button = styled('button', {
  backgroundColor: '$primary',
  color: 'white',
  border: 'none',
  padding: '0 $5',
  height: '$inputHeight',
  borderRadius: '$1',
  cursor: 'pointer',
  fontWeight: '600',
  marginTop: '$2',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '$primaryHover',
  },
  '&:disabled': {
    backgroundColor: '$secondary',
    cursor: 'not-allowed',
  }
});

const Alert = styled('div', {
  padding: '$3',
  borderRadius: '$1',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  fontSize: '$2',
  variants: {
    type: {
      error: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '$error',
      },
      success: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: '$success',
      }
    }
  }
});

export default function TransferForm() {
  const { planificacion, transferencias, addTransferencia, loading } = useStore();
  
  const [sku, setSku] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [msg, setMsg] = useState(null);

  // Group and calculate remaining quantities
  const inventoryData = useMemo(() => {
    const dataMap = {};
    
    // Sum plan
    planificacion.forEach(p => {
      // Using 'producto' as the sku representation, or a combined key
      const key = `${p.producto} - ${p.nombre_color}`;
      if (!dataMap[key]) {
        dataMap[key] = {
          sku: p.producto, // For demo, assuming producto acts as sku or is part of it
          producto: p.producto,
          nombre_color: p.nombre_color,
          planned: 0,
          transferred: 0
        };
      }
      dataMap[key].planned += parseInt(p.cantidad || 0, 10);
    });

    // Sum transfers based on SKU and color
    transferencias.forEach(t => {
      const key = `${t.producto} - ${t.nombre_color}`;
      if (dataMap[key]) {
        dataMap[key].transferred += parseInt(t.cantidad || 0, 10);
      }
    });

    return Object.values(dataMap);
  }, [planificacion, transferencias]);

  const selectedItem = useMemo(() => {
    return inventoryData.find(item => item.sku === sku);
  }, [inventoryData, sku]);

  const maxAllowed = selectedItem ? Math.max(0, selectedItem.planned - selectedItem.transferred) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const qty = parseInt(cantidad, 10);
    if (!sku || !selectedItem) {
      setMsg({ type: 'error', text: 'Seleccione un producto.' });
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setMsg({ type: 'error', text: 'Ingrese una cantidad válida.' });
      return;
    }
    if (qty > maxAllowed) {
      setMsg({ type: 'error', text: `La cantidad supera el máximo disponible (${maxAllowed}).` });
      return;
    }

    const payload = {
      sku: selectedItem.sku,
      producto: selectedItem.producto,
      nombre_color: selectedItem.nombre_color,
      cantidad: qty,
      fecha_transferencia: new Date().toISOString()
    };

    const res = await addTransferencia(payload);
    if (res) {
      setMsg({ type: 'success', text: `Transferencia de ${qty} completada.` });
      setCantidad('');
    } else {
      setMsg({ type: 'error', text: 'Error en la base de datos.' });
    }
  };

  return (
    <Card>
      <Title>Registro de Transferencia</Title>
      <Form onSubmit={handleSubmit}>
        <Label>
          Producto (SKU)
          <Select 
            value={sku} 
            onChange={(e) => {
              setSku(e.target.value);
              setCantidad('');
              setMsg(null);
            }} 
            required
          >
            <option value="">-- Seleccionar --</option>
            {inventoryData.map(item => {
              const remaining = item.planned - item.transferred;
              return (
                <option key={`${item.producto}_${item.nombre_color}`} value={item.sku} disabled={remaining <= 0}>
                  {item.producto} - {item.nombre_color} ({remaining} disp.)
                </option>
              );
            })}
          </Select>
        </Label>

        <Label>
          Cantidad
          <Input 
            type="number" 
            min="1" 
            max={maxAllowed || 1} 
            value={cantidad} 
            onChange={(e) => setCantidad(e.target.value)} 
            placeholder={selectedItem ? `Max: ${maxAllowed}` : '0'}
            disabled={!selectedItem || maxAllowed <= 0}
            required
          />
        </Label>

        {msg && (
          <Alert type={msg.type}>
            {msg.type === 'error' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
            {msg.text}
          </Alert>
        )}

        <Button type="submit" disabled={loading || !selectedItem || maxAllowed <= 0}>
          {loading ? 'Registrando...' : 'Registrar Transferencia'}
        </Button>
      </Form>
    </Card>
  );
}
