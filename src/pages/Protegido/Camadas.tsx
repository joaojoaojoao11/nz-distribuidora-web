// As camadas do PPF em pilha 3D que se abre com a rolagem (a tela trava
// enquanto isso). Parado, a pilha já aparece aberta.

import { useRef } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useProgressoSecao } from './movimento';
import Cabecalho from './Cabecalho';
import { CAMADAS } from './protegidoConfig';
import s from './Protegido.module.css';

// De baixo para cima: a pilha desenha a pintura primeiro.
const PLACAS = [s.placaPintura, s.placaAdesivo, s.placaCorpo, s.placaTop];
// Cor de cada item da lista (de cima para baixo), a mesma da placa.
const MARCAS = ['#f5f5f7', '#9fc4ff', '#8a8a92', '#e02a2a'];

export default function Camadas({ movimento }: { movimento: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const scrollYProgress = useProgressoSecao(ref);
  const abre = useTransform(scrollYProgress, [0.08, 0.6], [0, 1]);

  return (
    <section ref={ref} className={`${s.camadas} ${movimento ? '' : s.camadasParado}`} aria-labelledby="camadas-titulo">
      <div className={s.camadasFixo}>
        <Cabecalho id="camadas-titulo" olho="Por dentro do PPF" titulo="Três camadas entre o mundo e a sua pintura." movimento={movimento} />
        <div className={s.pilhaPalco} aria-hidden="true">
          <div className={s.pilha}>
            {PLACAS.map((classe, i) => (
              <Placa key={i} classe={classe} i={i} abre={abre} movimento={movimento} />
            ))}
          </div>
        </div>
        <ol className={s.camadasLista}>
          {CAMADAS.map((c, i) => (
            <ItemCamada key={c.titulo} i={i} titulo={c.titulo} texto={c.texto} abre={abre} movimento={movimento} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Placa({ classe, i, abre, movimento }: { classe: string; i: number; abre: MotionValue<number>; movimento: boolean }) {
  const z = useTransform(abre, [0, 1], [i * 5, i * 56]);
  return <motion.div className={`${s.placa} ${classe}`} style={{ z: movimento ? z : i * 56 }} />;
}

function ItemCamada({ i, titulo, texto, abre, movimento }: { i: number; titulo: string; texto: string; abre: MotionValue<number>; movimento: boolean }) {
  // A lista vai de cima (top coat) para baixo (pintura); acende na ordem em que a pilha abre.
  const ini = 0.12 + i * 0.2;
  const opacity = useTransform(abre, [ini, ini + 0.18], [0.32, 1]);
  return (
    <motion.li style={movimento ? { opacity } : undefined}>
      <span className={s.camadaMarca} style={{ background: MARCAS[i] }} aria-hidden="true" />
      <strong>{titulo}</strong>
      <span className={s.camadaTexto}>{texto}</span>
    </motion.li>
  );
}
