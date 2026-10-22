// Autoteste do campo "E-mail, CPF ou CNPJ" da tela Entrar — sem rede, sem banco.
//
// src/lib/identificador.ts decide se o que a pessoa digitou é e-mail ou
// documento e aplica a máscara enquanto ela digita. O que não pode quebrar:
//   · e-mail nunca ganha máscara (nem o que começa com números);
//   · CPF e CNPJ, digitados tecla a tecla ou colados, terminam na máscara certa;
//   · apagar com o cursor logo depois de um separador apaga um dígito (senão a
//     tecla parecia morta);
//   · só 11 ou 14 dígitos contam como documento.
//
// Uso: node scripts/test-login-identificador.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-identificador-'));
const build = spawnSync(process.execPath, [join(ROOT, 'node_modules/esbuild/bin/esbuild'), 'src/lib/identificador.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${join(outDir, 'identificador.js')}`, '--log-level=error'], { cwd: ROOT, encoding: 'utf8' });
if (build.status !== 0) {
  console.error(build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}
const { tipoIdentificador, digitarIdentificador, mascaraDocumentoParcial } = await import(pathToFileURL(join(outDir, 'identificador.js')).href);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};
/** Digita tecla a tecla, como o navegador faria (valor anterior + 1 caractere). */
const digitar = (texto, inicio = '') => [...texto].reduce((v, c) => digitarIdentificador(v, v + c), inicio);
/** Backspace no fim do campo. */
const apagar = (v) => digitarIdentificador(v, v.slice(0, -1));

ok('CPF tecla a tecla → 123.456.789-09', digitar('12345678909') === '123.456.789-09', digitar('12345678909'));
ok('CNPJ tecla a tecla → 11.222.333/0001-81', digitar('11222333000181') === '11.222.333/0001-81', digitar('11222333000181'));
ok('máscara parcial do CPF (5 dígitos) → 123.45', mascaraDocumentoParcial('12345') === '123.45');
ok('do 12º dígito em diante vira máscara de CNPJ', digitar('112223330001') === '11.222.333/0001');
ok('não passa de 14 dígitos', digitar('112223330001819') === '11.222.333/0001-81');
ok('colar CNPJ com máscara → fica igual', digitarIdentificador('', '11.222.333/0001-81') === '11.222.333/0001-81');
ok('colar CPF só com números → ganha a máscara', digitarIdentificador('', '12345678909') === '123.456.789-09');
ok('e-mail comum não ganha máscara', digitar('joao@nz.com.br') === 'joao@nz.com.br', digitar('joao@nz.com.br'));
ok('e-mail que começa com números: a máscara sai quando aparece a letra', digitar('1234joao@x.com') === '1234joao@x.com', digitar('1234joao@x.com'));
ok('e-mail com ponto no nome fica intacto', digitar('joao.silva@x.com') === 'joao.silva@x.com');
// Varredura 22/10: o ponto digitado pela pessoa não é da máscara.
ok('e-mail "1234.joao@x.com" tecla a tecla fica intacto', digitar('1234.joao@x.com') === '1234.joao@x.com', digitar('1234.joao@x.com'));
ok('e-mail "12345678.ab@x.com" (CPF parcial + ponto) fica intacto', digitar('12345678.ab@x.com') === '12345678.ab@x.com', digitar('12345678.ab@x.com'));
ok('e-mail "11-22@x.com" com hífen digitado fica intacto', digitar('11-22@x.com') === '11-22@x.com', digitar('11-22@x.com'));
ok('documento digitado COM a pontuação dá o mesmo que a máscara', digitar('123.456.789-09') === '123.456.789-09', digitar('123.456.789-09'));
ok('CNPJ digitado COM a pontuação dá o mesmo que a máscara', digitar('11.222.333/0001-81') === '11.222.333/0001-81', digitar('11.222.333/0001-81'));
ok('e-mail "123.joao@x.com" (ponto no lugar da máscara) fica intacto', digitar('123.joao@x.com') === '123.joao@x.com', digitar('123.joao@x.com'));
ok('livre: apagar o ponto e sobrar só número volta para a máscara', digitarIdentificador('1234.', '1234') === '123.4');
ok('livre: apagar tudo volta ao vazio', [...'1234.joao'].reduce((v) => apagar(v), digitar('1234.joao')) === '');
ok('colar e-mail com números no fim do CPF parcial', digitarIdentificador('123.4', '123.4joao.silva@x.com') === '1234joao.silva@x.com');
ok('apagar logo depois do hífen apaga um dígito', apagar('123.456.789-0') === '123.456.789', apagar('123.456.789-0'));
ok('apagar sobre o separador também anda (123.456.7 → 123.456)', apagar('123.456.7') === '123.456', apagar('123.456.7'));
ok('apagar tudo chega ao vazio', [...'123.456.789-09'].reduce((v) => apagar(v), '123.456.789-09') === '');

ok('tipo: e-mail', tipoIdentificador(' Joao@NZ.com ') === 'email');
ok('tipo: CPF com e sem máscara', tipoIdentificador('123.456.789-09') === 'documento' && tipoIdentificador('12345678909') === 'documento');
ok('tipo: CNPJ com máscara', tipoIdentificador('11.222.333/0001-81') === 'documento');
ok('tipo: 10 ou 12 dígitos não é documento', tipoIdentificador('1234567890') === 'invalido' && tipoIdentificador('123456789012') === 'invalido');
ok('tipo: texto sem @ não é e-mail', tipoIdentificador('joao') === 'invalido');
ok('tipo: vazio é inválido', tipoIdentificador('   ') === 'invalido');

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
