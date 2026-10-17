// O carro visto de cima, com as peças clicáveis. É o espelho visual da lista
// de peças ao lado — a lista é o controle acessível (teclado, leitor de tela);
// o desenho é para o dedo e para o olho, por isso fica aria-hidden.
//
// "Laterais" e "Interno" não têm um lugar claro numa vista de cima: ficam só
// na lista, em vez de um desenho que sugira a peça errada.

import styles from './Registro.module.css';

interface Props {
  areas: string[];
  onAlternar: (area: string) => void;
}

export default function DiagramaCarro({ areas, onAlternar }: Props) {
  const classe = (area: string) => (areas.includes(area) ? `${styles.peca} ${styles.pecaAtiva}` : styles.peca);
  const toque = (area: string) => () => onAlternar(area);

  return (
    <svg className={styles.diagrama} viewBox="0 0 160 320" aria-hidden="true" focusable="false">
      {/* carroceria */}
      <rect className={styles.contorno} x="38" y="10" width="84" height="302" rx="28" />

      <g onClick={toque('Para-choque Dianteiro')}>
        <path className={classe('Para-choque Dianteiro')} d="M46 14 Q80 5 114 14 L119 30 L41 30 Z" />
      </g>
      <g onClick={toque('Faróis')}>
        <rect className={classe('Faróis')} x="44" y="33" width="18" height="8" rx="3" />
        <rect className={classe('Faróis')} x="98" y="33" width="18" height="8" rx="3" />
      </g>
      <g onClick={toque('Capô')}>
        <path className={classe('Capô')} d="M47 45 L113 45 L109 104 L51 104 Z" />
      </g>
      <g onClick={toque('Parabrisa')}>
        <path className={classe('Parabrisa')} d="M51 108 L109 108 L102 138 L58 138 Z" />
      </g>
      <g onClick={toque('Teto')}>
        <rect className={classe('Teto')} x="58" y="142" width="44" height="80" rx="6" />
      </g>

      {/* vidro traseiro e tampa: referência, sem peça na lista */}
      <path className={styles.vidro} d="M58 226 L102 226 L108 248 L52 248 Z" />
      <rect className={styles.contorno} x="50" y="252" width="60" height="34" rx="5" />

      <g onClick={toque('Para-choque Traseiro')}>
        <path className={classe('Para-choque Traseiro')} d="M41 291 L119 291 L114 307 Q80 315 46 307 Z" />
      </g>
      <g onClick={toque('Para-lamas')}>
        <rect className={classe('Para-lamas')} x="33" y="48" width="11" height="50" rx="4" />
        <rect className={classe('Para-lamas')} x="116" y="48" width="11" height="50" rx="4" />
        <rect className={classe('Para-lamas')} x="33" y="228" width="11" height="52" rx="4" />
        <rect className={classe('Para-lamas')} x="116" y="228" width="11" height="52" rx="4" />
      </g>
      <g onClick={toque('Portas')}>
        <rect className={classe('Portas')} x="33" y="104" width="11" height="57" rx="3" />
        <rect className={classe('Portas')} x="33" y="164" width="11" height="57" rx="3" />
        <rect className={classe('Portas')} x="116" y="104" width="11" height="57" rx="3" />
        <rect className={classe('Portas')} x="116" y="164" width="11" height="57" rx="3" />
      </g>
      <g onClick={toque('Retrovisores')}>
        <rect className={classe('Retrovisores')} x="19" y="108" width="13" height="10" rx="4" />
        <rect className={classe('Retrovisores')} x="128" y="108" width="13" height="10" rx="4" />
      </g>
    </svg>
  );
}
