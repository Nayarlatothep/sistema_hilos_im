import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmamameujpwsnaymtzgs.supabase.co';
const supabaseAnonKey = 'public-anon-key'; // I'll check the main src/lib/supabaseClient.js or just use what I know

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data: pData, error: pErr } = await supabase.from('planificacion_produccion').select('*').limit(5);
  const { data: tData, error: tErr } = await supabase.from('transferencias_realizadas').select('*').limit(5);
  console.log('--- Planificacion Samples ---');
  console.log(pData);
  console.log('--- Transferencias Samples ---');
  console.log(tData);
}

checkData();
