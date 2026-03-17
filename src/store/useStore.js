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
  }
}));
