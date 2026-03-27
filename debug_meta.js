import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://lmamameujpwsnaymtzgs.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMetaDiaria() {
  console.log('--- Checking meta_diaria_plancostura ---');
  const { data, error } = await supabase.from('meta_diaria_plancostura').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
    if (data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    } else {
      console.log('Table is empty');
    }
  }
}

checkMetaDiaria();
