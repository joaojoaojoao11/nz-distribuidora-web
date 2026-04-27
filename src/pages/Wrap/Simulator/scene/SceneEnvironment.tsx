import { useEffect, useMemo } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import { RGBELoader } from 'three-stdlib';
import { EquirectangularReflectionMapping, PMREMGenerator, Texture } from 'three';

interface Props {
  hdrPath: string;
  showBackground?: boolean;
  blur?: number;
}

/**
 * Carrega um .hdr do disco e aplica em scene.environment e (opcionalmente)
 * scene.background. Diferente do <Environment> do drei, este remonta limpo
 * toda vez que hdrPath muda porque useLoader invalida a entry quando o key
 * do primeiro argumento (a URL) muda.
 */
export default function SceneEnvironment({ hdrPath, showBackground = true, blur = 0.35 }: Props) {
  const { gl, scene } = useThree();
  const raw = useLoader(RGBELoader, hdrPath);

  const envMap = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    raw.mapping = EquirectangularReflectionMapping;
    const target = pmrem.fromEquirectangular(raw);
    pmrem.dispose();
    return target.texture as Texture;
  }, [gl, raw]);

  useEffect(() => {
    scene.environment = envMap;
    if (showBackground) {
      scene.background = envMap;
      scene.backgroundBlurriness = blur;
    } else {
      scene.background = null;
    }
    return () => {
      scene.environment = null;
      if (showBackground) scene.background = null;
    };
  }, [scene, envMap, showBackground, blur]);

  return null;
}
