import { Color, MeshPhysicalMaterial, MeshStandardMaterial, Texture, Vector2 } from 'three';
import { getFlakeNormalTexture } from './flakeTexture';

interface FinishPBR {
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];
  useFlake: boolean;
  flakeIntensity: number;
}

export function getFinishPBR(finish: string): FinishPBR {
  const isMetallic = finish.includes('Metálico') || finish.includes('Camaleão');
  const isMatte = finish.includes('Fosco');
  const isSatin = finish.includes('Acetinado');
  const isChameleon = finish.includes('Camaleão');
  const isGloss = finish.includes('Brilhante') && !isMatte;

  if (isMatte) return {
    metalness: 0.1, roughness: 0.88, clearcoat: 0.25, clearcoatRoughness: 0.9,
    useFlake: false, flakeIntensity: 0,
  };
  if (isSatin) return {
    metalness: 0.55, roughness: 0.55, clearcoat: 0.8, clearcoatRoughness: 0.45,
    useFlake: true, flakeIntensity: 0.05,
  };
  if (isChameleon) return {
    metalness: 0.75, roughness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.05,
    iridescence: 1.0, iridescenceIOR: 1.5, iridescenceThicknessRange: [100, 800],
    useFlake: true, flakeIntensity: 0.08,
  };
  if (isMetallic) return {
    metalness: 0.75, roughness: 0.3, clearcoat: 1.0, clearcoatRoughness: 0.05,
    useFlake: true, flakeIntensity: 0.1,
  };
  return {
    metalness: 0.2, roughness: isGloss ? 0.25 : 0.4, clearcoat: 1.0, clearcoatRoughness: 0.05,
    useFlake: false, flakeIntensity: 0,
  };
}

/**
 * Cria um material novo (usado quando o original NÃO tem texturas PBR — ex: Quaternius).
 */
export function buildWrapMaterial(finish: string, hex: string): MeshPhysicalMaterial {
  const color = new Color(hex);
  const pbr = getFinishPBR(finish);

  const mat = new MeshPhysicalMaterial({
    color,
    metalness: pbr.metalness,
    roughness: pbr.roughness,
    clearcoat: pbr.clearcoat,
    clearcoatRoughness: pbr.clearcoatRoughness,
    envMapIntensity: 1.4,
    ...(pbr.iridescence !== undefined && {
      iridescence: pbr.iridescence,
      iridescenceIOR: pbr.iridescenceIOR,
      iridescenceThicknessRange: pbr.iridescenceThicknessRange,
    }),
  });

  if (pbr.useFlake) {
    mat.normalMap = getFlakeNormalTexture();
    mat.normalScale = new Vector2(pbr.flakeIntensity, pbr.flakeIntensity);
  }

  return mat;
}

/**
 * Cria um material preservando as texturas PBR do material original (normal, AO,
 * roughnessMap, etc) — usado em modelos detalhados tipo BMW X3 que trazem
 * panel lines e detalhes no normal map.
 */
export function buildWrapMaterialFromBase(
  finish: string,
  hex: string,
  base: MeshStandardMaterial | MeshPhysicalMaterial | undefined | null,
): MeshPhysicalMaterial {
  const color = new Color(hex);
  const pbr = getFinishPBR(finish);

  const normalMap: Texture | null = (base as MeshStandardMaterial | null)?.normalMap ?? null;
  const aoMap: Texture | null = (base as MeshStandardMaterial | null)?.aoMap ?? null;
  const roughnessMap: Texture | null = (base as MeshStandardMaterial | null)?.roughnessMap ?? null;

  const mat = new MeshPhysicalMaterial({
    color,
    metalness: pbr.metalness,
    roughness: pbr.roughness,
    clearcoat: pbr.clearcoat,
    clearcoatRoughness: pbr.clearcoatRoughness,
    envMapIntensity: 1.4,
    normalMap: normalMap ?? (pbr.useFlake ? getFlakeNormalTexture() : null),
    normalScale: new Vector2(
      pbr.useFlake && !normalMap ? pbr.flakeIntensity : 1,
      pbr.useFlake && !normalMap ? pbr.flakeIntensity : 1,
    ),
    aoMap: aoMap ?? null,
    roughnessMap: roughnessMap ?? null,
    ...(pbr.iridescence !== undefined && {
      iridescence: pbr.iridescence,
      iridescenceIOR: pbr.iridescenceIOR,
      iridescenceThicknessRange: pbr.iridescenceThicknessRange,
    }),
  });

  return mat;
}
