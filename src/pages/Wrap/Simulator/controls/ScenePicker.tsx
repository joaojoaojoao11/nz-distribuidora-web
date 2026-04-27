import { motion } from 'framer-motion';
import { SCENES } from '../../../../lib/3d/scenes';
import styles from '../WrapSimulator.module.css';

interface ScenePickerProps {
  sceneId: string;
  onSelect: (id: string) => void;
}

export default function ScenePicker({ sceneId, onSelect }: ScenePickerProps) {
  const active = SCENES.find((s) => s.id === sceneId);
  return (
    <div className={styles.pickerGroup}>
      <h4 className={styles.pickerLabel}>CENÁRIO</h4>
      <div className={styles.sceneButtons}>
        {SCENES.map((scene) => (
          <motion.button
            key={scene.id}
            type="button"
            onClick={() => onSelect(scene.id)}
            className={`${styles.sceneButton} ${sceneId === scene.id ? styles.sceneButtonActive : ''}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            {scene.name}
          </motion.button>
        ))}
      </div>
      {active && <p className={styles.sceneDescription}>{active.description}</p>}
    </div>
  );
}
