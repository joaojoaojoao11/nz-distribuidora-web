import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('web_catalog_products')
    .select('*')
    .limit(1);
    
  if (error) console.error(error);
  else console.log(Object.keys(data[0] || {}));
}

checkSchema();
