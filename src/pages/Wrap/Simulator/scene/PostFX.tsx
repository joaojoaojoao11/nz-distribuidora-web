import { EffectComposer, Bloom, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

interface PostFXProps {
  highQuality: boolean;
}

export default function PostFX({ highQuality }: PostFXProps) {
  if (!highQuality) {
    // mobile / GPU fraca — só tone mapping + SMAA
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom luminanceThreshold={0.85} intensity={0.32} mipmapBlur radius={0.7} />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
