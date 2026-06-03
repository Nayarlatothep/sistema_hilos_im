import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';


export const useStore = create((set, get) => ({
  planificacion: [],
  transferencias: [],
  meta_diaria: [],
  maestro_hilos: [],
  lotes: [],
  materiales_color: [],
  lotes_material_color: [],
  lotes_procesados: [],
  costo_unitario: [],
  lotes_con_costo: [],
  disponible_vencimiento: [],
  loading: false,
  error: null,

  fetchPlanificacion: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('planificacion_produccion')
      .select('*');
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ planificacion: data, loading: false });
    }
  },

  fetchTransferencias: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('transferencias_realizadas')
      .select('*');
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ transferencias: data, loading: false });
    }
  },

  fetchMetaDiaria: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('meta_diaria_plancostura')
      .select('*');
    if (error) {
      console.error('Error fetching meta_diaria_plancostura:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ meta_diaria: data, loading: false });
    }
  },

  fetchMaestroHilos: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('maestro_hilos')
      .select('*');
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ maestro_hilos: data, loading: false });
    }
  },

  fetchMaterialesColor: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('materiales_color')
      .select('*');
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ materiales_color: data, loading: false });
    }
  },

  fetchCostoUnitario: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('costo_unitario')
      .select('*');
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ costo_unitario: data, loading: false });
    }
  },

  fetchLotesConCosto: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.rpc('get_lotes_con_costo');
    if (error) {
      console.error('Error fetching lotes_con_costo:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ lotes_con_costo: data, loading: false });
    }
  },

  fetchDisponibleVencimiento: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('disponible_vencimiento')
      .select('*');
    if (error) {
      console.error('Error fetching disponible_vencimiento:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ disponible_vencimiento: data, loading: false });
    }
  },

  uploadPlanificacion: async (records) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('planificacion_produccion')
      .insert(records)
      .select();
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      set({ planificacion: [...get().planificacion, ...data], loading: false });
      return data;
    }
  },

  uploadMaestroHilos: async (records) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('maestro_hilos')
      .insert(records)
      .select();
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      set({ maestro_hilos: [...get().maestro_hilos, ...data], loading: false });
      return data;
    }
  },

  addTransferencia: async (record) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('transferencias_realizadas')
      .insert([record])
      .select();
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      set({ transferencias: [...get().transferencias, ...data], loading: false });
      return data;
    }
  },

  addMultipleTransferencias: async (records) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('transferencias_realizadas')
      .insert(records)
      .select();
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      set({ transferencias: [...get().transferencias, ...data], loading: false });
      return data;
    }
  },

  clearPlanificacion: async () => {
    set({ loading: true, error: null });
    // In Supabase, to delete all, we usually use a filter that matches all or a direct SQL call.
    // Here we assume RLS allows deleting based on presence of ID.
    const { error } = await supabase
      .from('planificacion_produccion')
      .delete()
      .neq('id', 0); // This is a common way to target all records if ID > 0
    
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    } else {
      set({ planificacion: [], loading: false });
      return true;
    }
  },

  clearMaestroHilos: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('maestro_hilos')
      .delete()
      .neq('id', 0);
    
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    } else {
      set({ maestro_hilos: [], loading: false });
      return true;
    }
  },

  clearTransferencias: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('transferencias_realizadas')
      .delete()
      .neq('id', 0);
    
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    } else {
      set({ transferencias: [], loading: false });
      return true;
    }
  },

  updateTransferenciaEstado: async (id, estado) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('transferencias_realizadas')
      .update({ estado_transferencia: estado })
      .eq('id', id)
      .select();
    
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      const updatedTransferencias = get().transferencias.map(t => 
        t.id === id ? { ...t, estado_transferencia: estado } : t
      );
      set({ transferencias: updatedTransferencias, loading: false });
      return data;
    }
  },

  markAllTransferenciasAsDone: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('transferencias_realizadas')
      .update({ estado_transferencia: 1 })
      .neq('id', 0)
      .select();
    
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      const updated = get().transferencias.map(t => ({ ...t, estado_transferencia: 1 }));
      set({ transferencias: updated, loading: false });
      return data;
    }
  },

  getAvailableModules: () => {
    // Restringido a solo módulos 1, 2, 3 y 4 por requerimiento
    return ['1', '2', '3', '4'];
  },

  updateMultipleTransferenciasEstado: async (ids, estado) => {
    if (!ids || ids.length === 0) return true;
    set({ loading: true, error: null });
    
    const { data, error } = await supabase
      .from('transferencias_realizadas')
      .update({ estado_transferencia: estado })
      .in('id', ids)
      .select();
    
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      const updatedTransferencias = get().transferencias.map(t => 
        ids.includes(t.id) ? { ...t, estado_transferencia: estado } : t
      );
      set({ transferencias: updatedTransferencias, loading: false });
      return data;
    }
  },

  addLote: (lote) => {
    const currentLotes = get().lotes || [];
    const updatedLotes = [lote, ...currentLotes];
    set({ lotes: updatedLotes });
    localStorage.setItem('sistema_hilos_lotes', JSON.stringify(updatedLotes));
  },

  removeLote: (id) => {
    const currentLotes = get().lotes || [];
    const updatedLotes = currentLotes.filter(l => l.id !== id);
    set({ lotes: updatedLotes });
    localStorage.setItem('sistema_hilos_lotes', JSON.stringify(updatedLotes));
  },

  loadLotes: () => {
    try {
      const stored = localStorage.getItem('sistema_hilos_lotes');
      if (stored) {
        set({ lotes: JSON.parse(stored) });
      } else {
        const mockLotes = [
          { id: '1', codigo_lote: 'LOT-260520-01', sku: '60 03 045', color: 'BLACK A&E', proveedor: 'A&E Threads', conos: 150, yardas_por_cono: 3000, total_yardas: 450000, fecha_ingreso: '2026-05-20', observaciones: 'Ingreso inicial para lote de producción principal.' },
          { id: '2', codigo_lote: 'LOT-260520-02', sku: '60 08 180', color: 'NAVY 2026', proveedor: 'Coats Cadena', conos: 80, yardas_por_cono: 1225, total_yardas: 98000, fecha_ingreso: '2026-05-20', observaciones: 'Hilaza de textura especial.' }
        ];
        set({ lotes: mockLotes });
        localStorage.setItem('sistema_hilos_lotes', JSON.stringify(mockLotes));
      }
    } catch (e) {
      console.error("Error loading lotes", e);
    }
  },

  addLoteProcesado: (lote) => {
    const current = get().lotes_procesados || [];
    const updated = [lote, ...current];
    set({ lotes_procesados: updated });
    localStorage.setItem('sistema_hilos_lotes_procesados', JSON.stringify(updated));
  },

  removeLoteProcesado: (id) => {
    const current = get().lotes_procesados || [];
    const updated = current.filter(l => l.id !== id);
    set({ lotes_procesados: updated });
    localStorage.setItem('sistema_hilos_lotes_procesados', JSON.stringify(updated));
  },

  // Fetch lotes_material_color data
  fetchLoteMaterialColor: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('lote_material_color')
      .select('*');
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ lotes_material_color: data, loading: false });
    }
  },

  updateLoteMaterialColorCantidad: async (id, nuevaCantidad) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('lote_material_color')
      .update({ cantidad: nuevaCantidad })
      .eq('id', id)
      .select();
    
    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      const updated = get().lotes_material_color.map(t => 
        t.id === id ? { ...t, cantidad: nuevaCantidad } : t
      );
      set({ lotes_material_color: updated, loading: false });
      return data;
    }
  },

  deleteLoteMaterialColor: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('lote_material_color')
      .delete()
      .eq('id', id);
    
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    } else {
      const updated = get().lotes_material_color.filter(t => t.id !== id);
      set({ lotes_material_color: updated, loading: false });
      return true;
    }
  },

  deleteMultipleLoteMaterialColor: async (ids) => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('lote_material_color')
      .delete()
      .in('id', ids);
    
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    } else {
      const updated = get().lotes_material_color.filter(t => !ids.includes(t.id));
      set({ lotes_material_color: updated, loading: false });
      return true;
    }
  },

  loadLotesProcesados: () => {
    try {
      const stored = localStorage.getItem('sistema_hilos_lotes_procesados');
      if (stored) {
        set({ lotes_procesados: JSON.parse(stored) });
      } else {
        set({ lotes_procesados: [] });
      }
    } catch (e) {
      console.error("Error loading lotes procesados", e);
    }
  },

  uploadLoteMaterialColor: async (records) => {
    set({ loading: true, error: null });
    
    // Map records to match Supabase's lote_material_color schema precisely
    const recordsToInsert = records.map(record => {
      const rawPc = String(record.pc || record.PC || '').trim();
      const formattedPc = rawPc ? (rawPc.toUpperCase().startsWith('PC-') ? rawPc : `PC-000${rawPc}`) : '';
      
      return {
        articulo: record.articulo || record.ARTICULO || record.sku || record.SKU || record.producto || record.cod_articulo || '',
        nombre: record.nombre || record.NOMBRE || record.nombre_color || '',
        idcolor: record.idcolor || record.IDCOLOR || record.id_color || record.color_code || '',
        color: record.color || record.COLOR || '',
        pc: formattedPc,
        cantidad: parseFloat(record.cantidad) || parseFloat(record.CANTIDAD) || parseFloat(record.Cantidad) || 0,
        fecha_manufactura: record.fecha_manufactura || record.Fecha_manufactura || record.Fecha_manu || record.fecha_manu || record['FECHA MANU'] || null,
        categoria: record.categoria || record.Categoria || record.CATEGORIA || null
      };
    });

    const { data, error } = await supabase
      .from('lote_material_color')
      .insert(recordsToInsert)
      .select();

    if (error) {
      set({ error: error.message, loading: false });
      return null;
    } else {
      set({ lotes_procesados: [], loading: false });
      localStorage.removeItem('sistema_hilos_lotes_procesados');
      return data;
    }
  }
}));
