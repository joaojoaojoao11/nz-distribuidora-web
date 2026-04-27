import { motion } from 'framer-motion';
import { CAMERA_PRESETS } from '../../../../lib/3d/cameraPresets';
import styles from '../WrapSimulator.module.css';

interface CameraPickerProps {
  presetId: string;
  onSelect: (id: string) => void;
}

export default function CameraPicker({ presetId, onSelect }: CameraPickerProps) {
  return (
    <div className={styles.cameraPills}>
      {CAMERA_PRESETS.map((p) => (
        <motion.button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className={`${styles.cameraPill} ${presetId === p.id ? styles.cameraPillActive : ''}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          {p.name}
        </motion.button>
      ))}
    </div>
  );
}
