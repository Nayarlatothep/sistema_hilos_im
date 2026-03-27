import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useStore = create((set, get) => ({
  planificacion: [],
  transferencias: [],
  meta_diaria: [],
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
      .from('meta_diaria_produccion')
      .select('*');
    if (error) {
      console.error('Error fetching meta_diaria_produccion:', error);
      set({ error: error.message, loading: false });
    } else {
      set({ meta_diaria: data, loading: false });
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
  }
}));
