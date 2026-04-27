export interface CarModel {
  id: string;
  name: string;
  modelPath: string;
  cameraPosition: [number, number, number];
  scale: number;
  /**
   * Se null, detecção automática de body por nome de mesh. Se string ou regex,
   * aplica override específico ao modelo.
   */
  bodyMeshMatcher?: RegExp;
  bodyMeshExclude?: RegExp;
}

// BMW X3 — o body paint real é "X3MI_1347060001_015" (mat#7 do GLB, color branco,
// metal 0.07, rough 0.06 — setup clássico de car paint). Usado em: capô, portas,
// trunk, teto, fenders e partes grandes dos para-choques. Grades/frestas usam outro
// material (mat#15) e ficam pretas fixas, como nos BMWs reais.
const BMW_BODY_MAT = /^X3MI_1347060001_015$/;

// Quaternius — material body chamado de "White"/"Orange"/"Blue"
const QUATERNIUS_BODY = /^(white|orange|blue|red|green|yellow|pink|purple|body|paint|main|base)$/i;

export const CARS: CarModel[] = [
  {
    id: 'bmw-x3',
    name: 'BMW X3',
    modelPath: '/assets/3d/cars/bmw-x3.glb',
    cameraPosition: [4.8, 1.9, 4.8],
    scale: 1,
    bodyMeshMatcher: BMW_BODY_MAT,
  },
  {
    id: 'sedan',
    name: 'SEDAN',
    modelPath: '/assets/3d/cars/sedan.glb',
    cameraPosition: [4.5, 2, 4.5],
    scale: 1,
    bodyMeshMatcher: QUATERNIUS_BODY,
  },
  {
    id: 'supercar',
    name: 'SUPERCAR',
    modelPath: '/assets/3d/cars/supercar.glb',
    cameraPosition: [4.5, 1.8, 4.5],
    scale: 1,
    bodyMeshMatcher: QUATERNIUS_BODY,
  },
];
