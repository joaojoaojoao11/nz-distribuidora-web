import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Prefixo das posições salvas por página (a Loja grava em nz:scroll:<path><search>). */
export const SCROLL_KEY_PREFIX = 'nz:scroll:';

function temPosicaoSalva(chave: string): boolean {
  try {
    return sessionStorage.getItem(chave) !== null;
  } catch {
    return false;
  }
}

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Quem restaura posição somos nós (a Loja, ao voltar de um produto). O
    // navegador tentando fazer o mesmo por conta própria só briga com isso.
    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    // Voltar (POP) para uma página que guardou a própria posição: ela restaura
    // sozinha. Subir ao topo aqui jogaria o usuário no início da lista — era o
    // que tornava cada toque errado na loja tão caro.
    if (navType === 'POP' && temPosicaoSalva(`${SCROLL_KEY_PREFIX}${pathname}${search}`)) return;
    window.scrollTo(0, 0);
    // Dispara só por pathname, como sempre foi: trocar filtro (?q=) na loja
    // não pode subir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
