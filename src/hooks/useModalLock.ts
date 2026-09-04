// Trava de painel modal para o celular — extraída do quiz do Interlagos
// (commits 50373f7 e e25ac52), onde o mesmo problema já tinha sido resolvido.
//
// Faz três coisas que `document.body.style.overflow = 'hidden'` sozinho não faz:
//   1. Segura a página atrás do painel no Safari do iPhone. O iOS ignora
//      overflow:hidden no body; o que ele respeita é position:fixed. A posição
//      é guardada e devolvida ao fechar, então o usuário volta onde estava.
//   2. Faz o botão Voltar do Android FECHAR o painel em vez de sair da página.
//      Empilha uma entrada sentinela no histórico; o popstate dela chama onClose.
//   3. Marca o <body> com data-nz-modal enquanto está aberto. É o sinal que o
//      CSS do botão flutuante do WhatsApp usa para sumir — sem nenhum estado
//      precisar atravessar componentes.
//
// `useEffectEvent` mantém [open] como a única dependência: o onClose que o pai
// passa muda a cada render, e sem isso o efeito re-executaria (e empilharia
// outra entrada sentinela) a cada troca de filtro.

import { useEffect, useEffectEvent } from 'react';

const MARK = 'nzModal';

export function useModalLock(open: boolean, onClose: () => void) {
  const fechar = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;

    const y = window.scrollY;
    const b = document.body.style;
    const antes = { position: b.position, top: b.top, width: b.width, overflow: b.overflow };
    b.position = 'fixed';
    b.top = `-${y}px`;
    b.width = '100%';
    b.overflow = 'hidden';
    document.body.dataset.nzModal = '1';

    // O spread preserva o estado que o react-router guarda na entrada atual
    // (usr/key/idx); a sentinela é a mesma URL com a marca a mais.
    window.history.pushState({ ...window.history.state, [MARK]: true }, '');
    const onPop = () => fechar();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal(fechar);
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);

    return () => {
      Object.assign(b, antes);
      delete document.body.dataset.nzModal;
      window.scrollTo(0, y);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
}

/**
 * Fecha pelo histórico quando fomos nós que empilhamos a entrada — assim o
 * "voltar" seguinte não cai numa sentinela morta. Sem sentinela (o painel foi
 * aberto sem passar pelo hook), fecha direto.
 */
export function closeModal(onClose: () => void) {
  if ((window.history.state as { [MARK]?: boolean } | null)?.[MARK]) window.history.back();
  else onClose();
}
