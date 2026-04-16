import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = [
  { code: '000', name: 'Transparent', hex: '#DAD9E1' },
  { code: '010', name: 'White', hex: '#E6E9EE' },
  { code: '020', name: 'Golden Yellow', hex: '#FBAA00' },
  { code: '019', name: 'Signal Yellow', hex: '#E6A700' },
  { code: '021', name: 'Yellow', hex: '#FEC500' },
  { code: '022', name: 'Light Yellow', hex: '#F2CA00' },
  { code: '025', name: 'Brimstone Yellow', hex: '#F2E210' },
  { code: '026', name: 'Purple Red', hex: '#5E050E' },
  { code: '312', name: 'Burgundy', hex: '#6F000E' },
  { code: '030', name: 'Dark Red', hex: '#900E16' },
  { code: '031', name: 'Red', hex: '#B0000D' },
  { code: '032', name: 'Light Red', hex: '#C91100' },
  { code: '034', name: 'Orange', hex: '#E1512C' },
  { code: '047', name: 'Orange Red', hex: '#D33100' },
  { code: '036', name: 'Light Orange', hex: '#EA6700' },
  { code: '035', name: 'Pastel Orange', hex: '#FC6C00' },
  { code: '341', name: 'Coral', hex: '#F88873' },
  { code: '404', name: 'Purple', hex: '#412773' },
  { code: '040', name: 'Violet', hex: '#5D2C68' },
  { code: '043', name: 'Lavender', hex: '#775EA0' },
  { code: '042', name: 'Lilac', hex: '#B893BC' },
  { code: '041', name: 'Pink', hex: '#C22B6B' },
  { code: '045', name: 'Soft Pink', hex: '#ED84B6' },
  { code: '562', name: 'Deep Sea Blue', hex: '#131E3A' },
  { code: '518', name: 'Steel Blue', hex: '#13133E' },
  { code: '050', name: 'Dark Blue', hex: '#1B2E5D' },
  { code: '065', name: 'Cobalt Blue', hex: '#12226C' },
  { code: '049', name: 'King Blue', hex: '#152A78' },
  { code: '086', name: 'Brilliant Blue', hex: '#1930AB' },
  { code: '067', name: 'Blue', hex: '#003A79' },
  { code: '057', name: 'Traffic Blue', hex: '#00408C' },
  { code: '051', name: 'Gentian Blue', hex: '#004684' },
  { code: '098', name: 'Gentian', hex: '#0050A2' },
  { code: '052', name: 'Azure Blue', hex: '#005DAB' },
  { code: '084', name: 'Sky Blue', hex: '#0075BB' },
  { code: '053', name: 'Light Blue', hex: '#0089C3' },
  { code: '056', name: 'Ice Blue', hex: '#3DA1D2' },
  { code: '066', name: 'Turquoise Blue', hex: '#00818C' },
  { code: '054', name: 'Turquoise', hex: '#009B97' },
  { code: '055', name: 'Mint', hex: '#5FCDB7' },
  { code: '060', name: 'Dark Green', hex: '#004028' },
  { code: '613', name: 'Forest Green', hex: '#005236' },
  { code: '061', name: 'Green', hex: '#00784B' },
  { code: '068', name: 'Grass Green', hex: '#007A42' },
  { code: '062', name: 'Light Green', hex: '#00873C' },
  { code: '064', name: 'Yellow Green', hex: '#289901' },
  { code: '063', name: 'Lime-Tree Green', hex: '#6AA72D' },
  { code: '080', name: 'Brown', hex: '#432F1E' },
  { code: '083', name: 'Nut Brown', hex: '#AF591F' },
  { code: '824', name: 'Imitation Gold', hex: '#D2972F' },
  { code: '081', name: 'Light Brown', hex: '#A8885C' },
  { code: '082', name: 'Beige', hex: '#CEC09F' },
  { code: '023', name: 'Cream', hex: '#EBD494' },
  { code: '070', name: 'Black', hex: '#0D0E11' },
  { code: '073', name: 'Dark Grey', hex: '#4B4C4C' },
  { code: '071', name: 'Grey', hex: '#757D7C' },
  { code: '076', name: 'Telegrey', hex: '#818689' },
  { code: '074', name: 'Middle Grey', hex: '#8A8F8B' },
  { code: '072', name: 'Light Grey', hex: '#BFC2C0' },
  { code: '090', name: 'Silver Grey', hex: '#686A6D' },
  { code: '091', name: 'Gold', hex: '#756232' },
  { code: '092', name: 'Copper', hex: '#6B411D' }
];

import fs from 'fs';

function generateSQL() {
  const brand = 'Oracal 651';
  let sql = `INSERT INTO web_catalog_products (sku, name, slug, technical_name, brand, finish_type, hex_code, durabilidade_anos, garantia_anos, ai_prompt_parameter, is_active) VALUES\n`;
  
  const values = colors.map(c => {
    const slug = `oracal-651-${c.name.toLowerCase().replace(/\s+/g, '-')}`;
    return `('${c.code}', '${c.name.replace(/'/g, "''")}', '${slug}', 'Oracal 651 ${c.name.replace(/'/g, "''")}', '${brand}', 'Gloss', '${c.hex}', 6, 1, 'ORACAL_651_GLOSS', true)`;
  });
  
  sql += values.join(',\n') + `\nON CONFLICT (sku) DO NOTHING;\n`;
  
  fs.writeFileSync('insert_651.sql', sql);
  console.log('SQL file written to insert_651.sql');
}

generateSQL();
