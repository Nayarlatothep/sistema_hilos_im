import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useStore = create((set, get) => ({
  planificacion: [],
  transferencias: [],
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
  }
}));
