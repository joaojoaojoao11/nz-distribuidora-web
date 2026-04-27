import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Scene from './scene/Scene';
import CarPicker from './controls/CarPicker';
import ColorPicker from './controls/ColorPicker';
import ScenePicker from './controls/ScenePicker';
import CameraPicker from './controls/CameraPicker';
import AIEnhanceOverlay from './AIEnhanceOverlay';
import { useAIEnhance } from './hooks/useAutoAIEnhance';
import { NZWRAP_COLORS } from '../../../lib/data/nzwrapColors';
import SEO from '../../../components/SEO/SEO';
import styles from './WrapSimulator.module.css';

export default function WrapSimulator() {
  const [params] = useSearchParams();
  const initialSku = params.get('color');
  const validInitial = NZWRAP_COLORS.find((c) => c.sku === initialSku);

  const [carId, setCarId] = useState('bmw-x3');
  const [sku, setSku] = useState(validInitial?.sku || 'NZW201');
  const [sceneId, setSceneId] = useState('studio');
  const [cameraPresetId, setCameraPresetId] = useState('free');
  const [panelOpen, setPanelOpen] = useState(true);
  const [lightsOn, setLightsOn] = useState(false);

  const glRef = useRef<{ domElement: HTMLCanvasElement } | null>(null);

  const active = NZWRAP_COLORS.find((c) => c.sku === sku) ?? NZWRAP_COLORS[0];

  const getFrameDataUrl = useCallback(() => {
    const canvas = glRef.current?.domElement;
    if (!canvas) return null;
    try { return canvas.toDataURL('image/png'); } catch { return null; }
  }, []);

  const ai = useAIEnhance({
    colorName: active.name.replace(/^NZWRAP\s+/i, ''),
    finish: active.finish,
    referenceImageUrl: active.thumbnail,
    getFrameDataUrl,
  });

  // Reset resultado AI quando usuário muda algo
  useEffect(() => {
    ai.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, sku, sceneId, cameraPresetId]);

  useEffect(() => {
    const q = params.get('color');
    const match = NZWRAP_COLORS.find((c) => c.sku === q);
    if (match) setSku(match.sku);
  }, [params]);

  return (
    <div className={styles.page}>
      <SEO
        title="Simulador 3D de Envelopamento NZWRAP"
        description="Simule em tempo real qualquer cor NZWRAP no seu carro. Gire, troque de cenário e gere uma foto realista com IA quando quiser."
        canonicalUrl="/wrap/simulator"
      />

      <div className={styles.canvasRoot}>
        <Scene
          carId={carId}
          hex={active.hex}
          finish={active.finish}
          sceneId={sceneId}
          cameraPresetId={cameraPresetId}
          lightsOn={lightsOn}
          onGLReady={(gl) => { glRef.current = gl; }}
        />

        <AIEnhanceOverlay
          aiImage={ai.aiImage}
          status={ai.status}
          errorMsg={ai.errorMsg}
          onDismiss={ai.reset}
          colorName={active.name.replace(/^NZWRAP\s+/i, '')}
        />

        <div className={styles.hudTop}>
          <Link to="/wrap" className={styles.backLink}>← VOLTAR</Link>
          <div className={styles.brand}>NZWRAP · SIMULADOR 3D</div>
          <div className={styles.hudActions}>
            <button
              type="button"
              onClick={() => setLightsOn((v) => !v)}
              className={`${styles.hudToggle} ${lightsOn ? styles.hudToggleActive : ''}`}
              title="Liga/desliga faróis e luzes internas do carro"
            >
              LUZES {lightsOn ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={ai.trigger}
              disabled={ai.status === 'rendering'}
              className={`${styles.hudToggle} ${styles.hudAIButton}`}
              title="Gera uma foto fotorrealista da configuração atual usando IA"
            >
              {ai.status === 'rendering' ? 'RENDERIZANDO…' : 'FOTO REALISTA IA'}
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className={styles.hudToggle}
            >
              {panelOpen ? 'FECHAR' : 'ABRIR'}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.sku}
            className={styles.colorHud}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.colorHudSku}>{active.sku}</div>
            <div className={styles.colorHudName}>{active.name.replace(/^NZWRAP\s+/i, '')}</div>
            <div className={styles.colorHudFinish}>{active.finish}</div>
          </motion.div>
        </AnimatePresence>

        <div className={styles.cameraBar}>
          <CameraPicker presetId={cameraPresetId} onSelect={setCameraPresetId} />
        </div>

        <AnimatePresence>
          {panelOpen && (
            <motion.aside
              key="panel"
              className={styles.panel}
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <CarPicker carId={carId} onSelect={setCarId} />
              <ColorPicker sku={sku} onSelect={setSku} />
              <ScenePicker sceneId={sceneId} onSelect={setSceneId} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
