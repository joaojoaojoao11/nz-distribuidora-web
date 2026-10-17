// Contagem regressiva até uma data (dias, horas, min, seg).
// Reutilizável: guarda o próprio relógio, então só ela re-renderiza a cada
// segundo — a página em volta não. Para leitor de tela, os dígitos ficam
// escondidos e um rótulo fixo diz para quando é a contagem (anunciar o
// segundo a segundo seria ruído).

import { useEffect, useRef, useState } from 'react';
import styles from './Contagem.module.css';

interface ContagemProps {
  /** Momento-alvo. */
  alvo: Date;
  /** Texto para leitor de tela. Ex.: "Lançamento quinta, 29/10, às 18h". */
  rotulo: string;
  /** Chamado uma vez, quando a contagem chega a zero. */
  onFim?: () => void;
  className?: string;
}

const UNIDADES = [
  { chave: 'dias', rotulo: 'dias' },
  { chave: 'horas', rotulo: 'horas' },
  { chave: 'min', rotulo: 'min' },
  { chave: 'seg', rotulo: 'seg' },
] as const;

function partes(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    min: Math.floor((total % 3600) / 60),
    seg: total % 60,
  };
}

export default function Contagem({ alvo, rotulo, onFim, className }: ContagemProps) {
  const [agora, setAgora] = useState(() => Date.now());
  const fimAvisado = useRef(false);
  const restante = alvo.getTime() - agora;

  useEffect(() => {
    // Alinha o tique na virada do segundo, para os números não "pularem".
    let id: number | undefined;
    const tique = () => {
      setAgora(Date.now());
      id = window.setTimeout(tique, 1000 - (Date.now() % 1000));
    };
    id = window.setTimeout(tique, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (restante <= 0 && !fimAvisado.current) {
      fimAvisado.current = true;
      onFim?.();
    }
  }, [restante, onFim]);

  const p = partes(restante);

  return (
    <div className={`${styles.contagem} ${className ?? ''}`} role="timer" aria-label={rotulo}>
      {UNIDADES.map((u) => (
        <div key={u.chave} className={styles.celula} aria-hidden="true">
          <span className={styles.numero}>{String(p[u.chave]).padStart(2, '0')}</span>
          <span className={styles.rotulo}>{u.rotulo}</span>
        </div>
      ))}
    </div>
  );
}
