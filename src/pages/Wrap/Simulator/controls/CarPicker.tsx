import { motion } from 'framer-motion';
import { CARS } from '../../../../lib/3d/cars';
import styles from '../WrapSimulator.module.css';

interface CarPickerProps {
  carId: string;
  onSelect: (id: string) => void;
}

export default function CarPicker({ carId, onSelect }: CarPickerProps) {
  return (
    <div className={styles.pickerGroup}>
      <h4 className={styles.pickerLabel}>CARRO</h4>
      <div className={styles.carButtons}>
        {CARS.map((car) => (
          <motion.button
            key={car.id}
            type="button"
            onClick={() => onSelect(car.id)}
            className={`${styles.carButton} ${carId === car.id ? styles.carButtonActive : ''}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            {car.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
