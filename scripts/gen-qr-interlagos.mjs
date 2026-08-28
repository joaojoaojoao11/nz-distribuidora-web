// Gera o QR Code do estande do Festival Interlagos 2026.
//   node scripts/gen-qr-interlagos.mjs
// Saída: scripts/output/qr-interlagos.png (2000px) + .svg (vetorial, para a gráfica).
//
// Correção de erro nível H (30%): o código continua legível mesmo com o logo
// sobreposto no centro, sujeira ou dobra no material impresso.
// SEMPRE testar escaneando do papel impresso antes de mandar para produção.

import QRCode from 'qrcode';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_QR =
  'https://www.nzgroup.com.br/interlagos' +
  '?utm_source=qrcode&utm_medium=evento&utm_campaign=festival_interlagos_2026';

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'output');

const options = {
  errorCorrectionLevel: 'H',
  margin: 2,
  color: { dark: '#000000', light: '#FFFFFF' },
};

await mkdir(outDir, { recursive: true });

await QRCode.toFile(join(outDir, 'qr-interlagos.png'), URL_QR, {
  ...options,
  type: 'png',
  width: 2000,
});

const svg = await QRCode.toString(URL_QR, { ...options, type: 'svg' });
await writeFile(join(outDir, 'qr-interlagos.svg'), svg, 'utf8');

console.log('QR gerado em scripts/output/');
console.log('URL:', URL_QR);
console.log('\nAntes da gráfica: imprima e escaneie do papel, não da tela.');
