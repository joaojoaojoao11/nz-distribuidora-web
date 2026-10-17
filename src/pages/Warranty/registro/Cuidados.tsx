// Cuidados depois da aplicação — por tipo de serviço. Antes era um texto só,
// de PPF em carro, mostrado também para envelopamento e para móvel.
//
// O texto de envelopamento e o de móvel são rascunho (D3 do plano
// PLANO_REGISTRO_GARANTIA.md), à espera da aprovação do João.

import { ChevronDown } from 'lucide-react';
import styles from './Registro.module.css';

interface Cuidado {
  titulo: string;
  regra: string;
  motivo: string;
}

const PPF: Cuidado[] = [
  {
    titulo: 'Os primeiros 7 dias',
    regra: 'Não lave o carro nos primeiros 7 dias depois da aplicação.',
    motivo: 'O filme ainda está assentando e soltando a umidade da aplicação. Pequenas bolhas de água nesse período são normais e somem sozinhas com o sol.',
  },
  {
    titulo: 'Lavagem',
    regra: 'Use shampoo neutro e evite água de reuso.',
    motivo: 'Produtos ácidos ou alcalinos mancham e ressecam o TPU. A água de reuso traz partículas que riscam como lixa durante a esfregação.',
  },
  {
    titulo: 'Alta pressão',
    regra: 'Prefira lavadores acostumados com PPF. Em casa, mantenha o jato a mais de 50 cm e longe das bordas.',
    motivo: 'Jato forte e próximo, principalmente nas emendas, força a cola e pode descolar o filme. Escovas ásperas danificam o top coat regenerativo.',
  },
  {
    titulo: 'Resíduos orgânicos',
    regra: 'Evite estacionar sob árvores e remova seiva, insetos e fezes de pássaros o quanto antes.',
    motivo: 'Esses resíduos são ácidos. O PPF protege a pintura, mas o próprio filme pode manchar se o resíduo ficar horas no sol.',
  },
];

const ENVELOPAMENTO: Cuidado[] = [
  {
    titulo: 'Os primeiros 7 dias',
    regra: 'Não lave o carro nos primeiros 7 dias depois da aplicação.',
    motivo: 'A cola do vinil ainda está chegando à aderência final, principalmente nas bordas e nas curvas.',
  },
  {
    titulo: 'Lavagem',
    regra: 'Lave à mão, com shampoo neutro e pano de microfibra.',
    motivo: 'Rolos e escovas de lava-rápido riscam o vinil e levantam as bordas. Seiva, fezes de pássaros e combustível mancham: remova o quanto antes.',
  },
  {
    titulo: 'Alta pressão',
    regra: 'Mantenha o jato a mais de 30 cm e nunca direto nas bordas.',
    motivo: 'A água sob pressão entra por baixo da borda e descola o vinil.',
  },
  {
    titulo: 'Fosco e acetinado',
    regra: 'Não use cera, polidor nem massa de polir.',
    motivo: 'Esses produtos deixam manchas brilhantes que não saem do vinil fosco. Use só produtos próprios para vinil.',
  },
];

const MOVEL: Cuidado[] = [
  {
    titulo: 'Os primeiros 7 dias',
    regra: 'Evite limpar a superfície nos primeiros 7 dias.',
    motivo: 'O filme ainda está assentando e soltando a umidade da aplicação. Pequenas bolhas nesse período somem sozinhas.',
  },
  {
    titulo: 'Limpeza do dia a dia',
    regra: 'Pano macio de microfibra com água e detergente neutro.',
    motivo: 'Solventes, álcool em excesso, palha de aço e esponjas abrasivas riscam ou mancham o TPU.',
  },
  {
    titulo: 'Calor direto',
    regra: 'Não apoie panelas quentes nem aproxime fontes de calor intenso.',
    motivo: 'Panela, ferro de passar e chama direta deformam o filme.',
  },
  {
    titulo: 'Bordas',
    regra: 'Não puxe nem raspe as bordas do filme.',
    motivo: 'É por elas que a película começa a descolar. Ao limpar, passe o pano de dentro para fora.',
  },
];

interface Props {
  tipo: 'PPF' | 'NZWrap' | '';
  movel?: boolean;
  /** Aberto e com título (tela final); fechado, num acordeão (formulário). */
  aberto?: boolean;
}

export default function Cuidados({ tipo, movel = false, aberto = false }: Props) {
  const lista = movel ? MOVEL : tipo === 'NZWrap' ? ENVELOPAMENTO : PPF;
  const assunto = movel ? 'da proteção do seu item' : tipo === 'NZWrap' ? 'do envelopamento' : 'da proteção de pintura';

  const itens = (
    <ul className={styles.cuidadosLista}>
      {lista.map((c) => (
        <li key={c.titulo} className={styles.cuidado}>
          <p className={styles.cuidadoTitulo}>{c.titulo}</p>
          <p className={styles.cuidadoRegra}>{c.regra}</p>
          <p className={styles.cuidadoMotivo}>{c.motivo}</p>
        </li>
      ))}
    </ul>
  );

  if (aberto) {
    return (
      <section className={styles.cuidados} aria-labelledby="titulo-cuidados">
        <h2 className={styles.cuidadosTitulo} id="titulo-cuidados">
          Cuidados {assunto}
        </h2>
        {itens}
      </section>
    );
  }

  return (
    <details className={styles.cuidados}>
      <summary className={styles.cuidadosResumo}>
        Cuidados depois da aplicação
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      {itens}
    </details>
  );
}
