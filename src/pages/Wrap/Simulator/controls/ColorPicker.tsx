import { motion } from 'framer-motion';
import { NZWRAP_COLORS } from '../../../../lib/data/nzwrapColors';
import styles from '../WrapSimulator.module.css';

interface ColorPickerProps {
  sku: string;
  onSelect: (sku: string) => void;
}

export default function ColorPicker({ sku, onSelect }: ColorPickerProps) {
  const activeColor = NZWRAP_COLORS.find((c) => c.sku === sku);

  return (
    <div className={styles.pickerGroup}>
      <div className={styles.pickerHeader}>
        <h4 className={styles.pickerLabel}>COR</h4>
        {activeColor && (
          <span className={styles.activeColorName}>
            {activeColor.name.replace(/^NZWRAP\s+/i, '')}
          </span>
        )}
      </div>
      {activeColor && (
        <span className={styles.activeFinish}>{activeColor.finish}</span>
      )}
      <div className={styles.colorGrid}>
        {NZWRAP_COLORS.map((color) => (
          <motion.button
            key={color.sku}
            type="button"
            onClick={() => onSelect(color.sku)}
            className={`${styles.colorSwatch} ${sku === color.sku ? styles.colorSwatchActive : ''}`}
            style={{ backgroundColor: color.hex }}
            whileHover={{ scale: 1.12, zIndex: 2 }}
            whileTap={{ scale: 0.95 }}
            title={`${color.name} — ${color.finish}`}
            aria-label={color.name}
          />
        ))}
      </div>
    </div>
  );
}
