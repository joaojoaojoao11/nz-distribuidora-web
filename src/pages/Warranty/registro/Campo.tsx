// Rótulo + campo + dica/erro, no padrão do checkout. O erro só aparece depois
// que a pessoa tentou avançar (`mostrar`), não enquanto ela ainda digita.

import type { ReactNode } from 'react';
import styles from './Registro.module.css';

interface Props {
  id: string;
  rotulo: string;
  opcional?: boolean;
  largo?: boolean;
  dica?: ReactNode;
  erro?: string;
  mostrar?: boolean;
  children: ReactNode;
}

export default function Campo({ id, rotulo, opcional, largo, dica, erro, mostrar, children }: Props) {
  const comErro = Boolean(mostrar && erro);
  const classes = [styles.campo, largo ? styles.campoLargo : '', comErro ? styles.campoErro : ''].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <label className={styles.rotulo} htmlFor={id}>
        {rotulo}
        {opcional && <span className={styles.opcional}>opcional</span>}
      </label>
      {children}
      {comErro ? (
        <p className={styles.erroCampo} id={`${id}-erro`} role="alert">
          {erro}
        </p>
      ) : dica ? (
        <span className={styles.dica} id={`${id}-dica`}>
          {dica}
        </span>
      ) : null}
    </div>
  );
}
