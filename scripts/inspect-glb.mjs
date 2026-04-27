import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = process.argv[2] || 'suv.glb';
// Se for absoluto, usa; senão tenta como nome em public/assets/3d/cars
const glbPath = path.isAbsolute(arg)
  ? arg
  : path.resolve(__dirname, '..', 'public', 'assets', '3d', 'cars', arg);

const buf = fs.readFileSync(glbPath);

const magic = buf.readUInt32LE(0);
if (magic !== 0x46546c67) { console.error('Not a GLB'); process.exit(1); }

const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.slice(20, 20 + jsonLen).toString('utf-8').replace(/\0+$/, '');
const gltf = JSON.parse(jsonStr);

console.log('=== GLB:', path.basename(glbPath), '===\n');

console.log('MESHES:');
(gltf.meshes || []).forEach((m, i) => {
  const prims = (m.primitives || []).map((p) => `mat#${p.material}`).join(', ');
  console.log(`  [${i}] "${m.name || '(unnamed)'}" -> primitives: ${prims}`);
});

console.log('\nMATERIALS:');
(gltf.materials || []).forEach((mat, i) => {
  const pbr = mat.pbrMetallicRoughness || {};
  const c = pbr.baseColorFactor ? pbr.baseColorFactor.map((v, idx) => idx < 3 ? Math.round(v * 255) : v).join(',') : '-';
  const maps = [];
  if (pbr.baseColorTexture) maps.push('base');
  if (pbr.metallicRoughnessTexture) maps.push('mr');
  if (mat.normalTexture) maps.push('normal');
  if (mat.occlusionTexture) maps.push('ao');
  if (mat.emissiveTexture) maps.push('emissive');
  if (mat.extensions?.KHR_materials_clearcoat) maps.push('clearcoat');
  console.log(`  [${i}] "${mat.name || '(unnamed)'}" color=[${c}] metal=${pbr.metallicFactor ?? 1} rough=${pbr.roughnessFactor ?? 1} maps=[${maps.join(',')}]`);
});

console.log('\nNODES (top-level):');
(gltf.scenes?.[0]?.nodes || []).forEach((idx) => {
  const n = gltf.nodes[idx];
  console.log(`  [${idx}] "${n.name || '(unnamed)'}"${n.mesh !== undefined ? ` mesh#${n.mesh}` : ''} children=${(n.children || []).length}`);
});

console.log(`\nTOTALS: ${gltf.meshes?.length || 0} meshes, ${gltf.materials?.length || 0} materials, ${gltf.nodes?.length || 0} nodes`);
console.log(`File size: ${(fs.statSync(glbPath).size / 1024 / 1024).toFixed(2)} MB`);
