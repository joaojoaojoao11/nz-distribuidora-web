import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import SceneEnvironment from './SceneEnvironment';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { PerspectiveCamera as PerspectiveCameraImpl, Vector3 } from 'three';
import Car from './Car';
import Lighting from './Lighting';
import Floor from './Floor';
import PostFX from './PostFX';
import { CARS } from '../../../../lib/3d/cars';
import { SCENES } from '../../../../lib/3d/scenes';
import { CAMERA_PRESETS } from '../../../../lib/3d/cameraPresets';

interface SceneProps {
  carId: string;
  hex: string;
  finish: string;
  sceneId: string;
  cameraPresetId: string;
  lightsOn?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
  onGLReady?: (gl: WebGLRenderer) => void;
}

type WebGLRenderer = Parameters<NonNullable<Parameters<typeof Canvas>[0]['onCreated']>>[0]['gl'];

function CameraRig({ presetId }: { presetId: string }) {
  const preset = CAMERA_PRESETS.find((p) => p.id === presetId) ?? CAMERA_PRESETS[0];
  const { camera, controls } = useThree() as { camera: PerspectiveCameraImpl; controls: OrbitControlsImpl | null };
  const targetPos = useRef(new Vector3(...preset.position));
  const targetLook = useRef(new Vector3(...preset.target));
  const animating = useRef(false);

  useEffect(() => {
    targetPos.current.set(...preset.position);
    targetLook.current.set(...preset.target);
    animating.current = preset.id !== 'free';
  }, [preset.id, preset.position, preset.target]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(targetPos.current, 0.08);
    if (controls && 'target' in controls) {
      controls.target.lerp(targetLook.current, 0.08);
      controls.update();
    }
    // Stop animating once close enough to target
    if (camera.position.distanceTo(targetPos.current) < 0.02) {
      animating.current = false;
    }
  });

  return null;
}

function InteractionListener({ onInteractionChange }: { onInteractionChange?: (b: boolean) => void }) {
  const { controls } = useThree() as { controls: OrbitControlsImpl | null };
  useEffect(() => {
    if (!controls || !onInteractionChange) return;
    const onStart = () => onInteractionChange(true);
    const onEnd = () => onInteractionChange(false);
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, [controls, onInteractionChange]);
  return null;
}

export default function Scene({ carId, hex, finish, sceneId, cameraPresetId, lightsOn = true, onInteractionChange, onGLReady }: SceneProps) {
  const car = CARS.find((c) => c.id === carId) ?? CARS[0];
  const hdr = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
  const initialPreset = CAMERA_PRESETS.find((p) => p.id === cameraPresetId) ?? CAMERA_PRESETS[0];
  const [highQuality] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return !mobile;
  });

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      gl={{ antialias: false, toneMappingExposure: 1.0, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => onGLReady?.(gl)}
      style={{ width: '100%', height: '100%' }}
    >
      <PerspectiveCamera makeDefault fov={35} position={initialPreset.position} />

      <Lighting />

      <Suspense fallback={null}>
        <SceneEnvironment hdrPath={hdr.hdrPath} showBackground blur={0.35} />
        <Car
          key={car.id}
          modelPath={car.modelPath}
          hex={hex}
          finish={finish}
          scale={car.scale}
          lightsOn={lightsOn}
        />
        <Floor />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.55}
          scale={14}
          blur={2.6}
          far={5}
          resolution={1024}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2.2}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.5}
        target={initialPreset.target}
      />

      <CameraRig presetId={cameraPresetId} />
      <InteractionListener onInteractionChange={onInteractionChange} />

      <PostFX highQuality={highQuality} />
    </Canvas>
  );
}
