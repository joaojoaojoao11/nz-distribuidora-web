// Título de página com o botão "Como funciona" ao lado (quebra para baixo no
// celular). O título continua sendo o h1/h2 da própria página, com o estilo dela.

import type { ReactNode } from 'react';
import BotaoTutorial from './BotaoTutorial';
import s from './Tutorial.module.css';

export default function TituloComTutorial({ tutorial, children }: { tutorial: string; children: ReactNode }) {
  return (
    <div className={s.tituloLinha}>
      {children}
      <BotaoTutorial id={tutorial} />
    </div>
  );
}
