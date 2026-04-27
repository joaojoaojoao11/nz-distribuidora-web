import { useEffect } from 'react';
import { RectAreaLightUniformsLib } from 'three-stdlib';
import { RectAreaLightHelper } from 'three-stdlib';

export default function Lighting() {
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);

  return (
    <>
      <ambientLight intensity={0.25} />

      {/* Key light — canto superior direito */}
      <rectAreaLight
        position={[5, 6, 4]}
        intensity={12}
        width={6}
        height={3}
        color="#fff5e6"
        rotation={[-Math.PI / 4, Math.PI / 5, 0]}
      />

      {/* Fill light — esquerda, mais suave */}
      <rectAreaLight
        position={[-4, 3.5, 5]}
        intensity={5}
        width={4}
        height={2}
        color="#d9e8ff"
        rotation={[-Math.PI / 5, -Math.PI / 6, 0]}
      />

      {/* Rim light — trás, contorno */}
      <rectAreaLight
        position={[0, 4, -5]}
        intensity={7}
        width={3.5}
        height={2}
        color="#ffd7a0"
        rotation={[-Math.PI / 6, Math.PI, 0]}
      />

      {/* Bounce do chão — fill inferior */}
      <hemisphereLight args={['#ffffff', '#1a1a1a', 0.3]} />
    </>
  );
}

// suppress unused import warning for helper (kept for debug)
void RectAreaLightHelper;
