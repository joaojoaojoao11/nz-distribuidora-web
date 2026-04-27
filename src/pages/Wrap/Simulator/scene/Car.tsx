import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, Material, MeshStandardMaterial } from 'three';
import { buildWrapMaterial, buildWrapMaterialFromBase } from '../../../../lib/3d/finishToMaterial';
import { CARS } from '../../../../lib/3d/cars';

interface CarProps {
  modelPath: string;
  hex: string;
  finish: string;
  scale?: number;
  lightsOn?: boolean;
}

interface BodyTag {
  bodyIndices: number[];
  originals: Material[];
}

export default function Car({ modelPath, hex, finish, scale = 1, lightsOn = true }: CarProps) {
  const { scene } = useGLTF(modelPath);

  const model = useMemo(() => CARS.find((c) => c.modelPath === modelPath), [modelPath]);

  // Toggle das luzes emissivas (faróis, dashboard, interior brilhante).
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const sm = m as MeshStandardMaterial | null;
        if (!sm || !sm.emissiveMap) return;
        // Grava a intensidade original só uma vez
        if (sm.userData.originalEmissiveIntensity === undefined) {
          sm.userData.originalEmissiveIntensity = sm.emissiveIntensity ?? 1;
        }
        sm.emissiveIntensity = lightsOn ? sm.userData.originalEmissiveIntensity : 0;
        sm.needsUpdate = true;
      });
    });
  }, [scene, lightsOn]);

  useEffect(() => {
    const bodyMatcher = model?.bodyMeshMatcher;
    if (!bodyMatcher) return;
    const hasDetailedPBR = model?.id === 'bmw-x3';

    scene.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Primeira vez neste mesh: identifica quais materiais são body e grava refs.
      if (!mesh.userData.bodyTag) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const bodyIndices: number[] = [];
        const originals: Material[] = [];
        mats.forEach((m, i) => {
          originals.push(m as Material);
          if (m && bodyMatcher.test((m.name || '').trim())) {
            bodyIndices.push(i);
          }
        });
        const tag: BodyTag = { bodyIndices, originals };
        mesh.userData.bodyTag = tag;
      }

      const tag = mesh.userData.bodyTag as BodyTag;
      if (tag.bodyIndices.length === 0) return; // nada de body nesse mesh

      // Constrói o array atual de materiais: originais para slots não-body,
      // wrap novo para slots body.
      const nextMats = tag.originals.map((original, i) => {
        if (!tag.bodyIndices.includes(i)) return original;
        if (hasDetailedPBR) {
          return buildWrapMaterialFromBase(finish, hex, original as MeshStandardMaterial);
        }
        return buildWrapMaterial(finish, hex);
      });

      mesh.material = Array.isArray(mesh.material) ? nextMats : nextMats[0];
    });
  }, [scene, finish, hex, model]);

  return <primitive object={scene} scale={scale} />;
}

CARS.forEach((c) => useGLTF.preload(c.modelPath));
