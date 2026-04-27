export interface CameraPreset {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'free',   name: 'LIVRE',      position: [5, 2.2, 5],  target: [0, 0.7, 0] },
  { id: 'front',  name: '3/4 FRENTE', position: [3.5, 1.3, 4], target: [0, 0.8, 0] },
  { id: 'side',   name: 'PERFIL',     position: [6, 1.1, 0.1], target: [0, 0.9, 0] },
  { id: 'rear',   name: '3/4 TRÁS',   position: [-3.5, 1.3, -3.5], target: [0, 0.8, 0] },
  { id: 'detail', name: 'DETALHE',    position: [2.2, 0.7, 2.8], target: [1.2, 0.7, 1.2] },
];
