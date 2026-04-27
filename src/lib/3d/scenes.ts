export interface HdrScene {
  id: string;
  name: string;
  hdrPath: string;
  description: string;
}

export const SCENES: HdrScene[] = [
  {
    id: 'studio',
    name: 'STUDIO',
    hdrPath: '/assets/3d/hdri/studio.hdr',
    description: 'Iluminação neutra para análise precisa da cor',
  },
  {
    id: 'mountain',
    name: 'MONTANHA',
    hdrPath: '/assets/3d/hdri/mountain.hdr',
    description: 'Luz dourada de manhã em céu aberto',
  },
  {
    id: 'rooftop',
    name: 'ROOFTOP',
    hdrPath: '/assets/3d/hdri/rooftop.hdr',
    description: 'Concreto urbano sob sol do meio-dia',
  },
  {
    id: 'night',
    name: 'NOITE NEON',
    hdrPath: '/assets/3d/hdri/night.hdr',
    description: 'Rua molhada com refletores neon',
  },
];
