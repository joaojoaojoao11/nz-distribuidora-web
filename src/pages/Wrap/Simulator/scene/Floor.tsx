import { MeshReflectorMaterial } from '@react-three/drei';

export default function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        blur={[320, 120]}
        resolution={1024}
        mixBlur={1}
        mixStrength={38}
        roughness={0.85}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#080808"
        metalness={0.5}
        mirror={0}
      />
    </mesh>
  );
}
