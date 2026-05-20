-- SQL Script to resolve the Row-Level Security (RLS) policy error in Supabase
-- Error: "new row violates row-level security policy for table lote_material_color"
--
-- INSTRUCTIONS:
-- 1. Copy the SQL commands below.
-- 2. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lmamameujpwsnaymtzgs/sql/new
-- 3. Paste and RUN the SQL commands.

-- =========================================================================
-- OPTION A: Disable RLS completely for 'lote_material_color' (RECOMMENDED & EASIEST)
-- Use this option if this table is public and any client is allowed to insert logs.
-- =========================================================================
ALTER TABLE public.lote_material_color DISABLE ROW LEVEL SECURITY;

-- =========================================================================
-- OPTION B: Keep RLS enabled but create permissive policies for public access (ANON)
-- Use this option if you want to keep RLS active but grant insert/select permissions to anonymous users.
-- =========================================================================
-- 1. Allow anyone to INSERT records (Required for the "ACTUALIZAR TABLA" button to work):
-- CREATE POLICY "Permitir insercion publica anonima" ON public.lote_material_color FOR INSERT TO anon WITH CHECK (true);
--
-- 2. Allow anyone to SELECT records:
-- CREATE POLICY "Permitir seleccion publica anonima" ON public.lote_material_color FOR SELECT TO anon USING (true);
