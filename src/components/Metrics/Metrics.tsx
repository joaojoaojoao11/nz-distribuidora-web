import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Metrics.module.css';

interface MetricItem {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
}

const metrics: MetricItem[] = [
  { value: 48, prefix: 'R$', suffix: 'M+', label: 'Faturamento Impulsionado' },
  { value: 1200, prefix: '+', suffix: '', label: 'Lojas Atendidas no Brasil' },
  { value: 180, prefix: '+', suffix: '', label: 'Cores em Estoque' },
  { value: 5, prefix: '+', suffix: '', label: 'Anos de Mercado' }
];

function AnimatedCounter({ value, prefix, suffix, inView }: { value: number; prefix?: string; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span className={styles.metricValue}>
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

export default function Metrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.container}>
        <motion.div
          className={styles.grid}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              className={styles.metricCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <AnimatedCounter value={m.value} prefix={m.prefix} suffix={m.suffix} inView={inView} />
              <span className={styles.metricLabel}>{m.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
