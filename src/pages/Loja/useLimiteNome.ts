// Quantos caracteres do nome do produto cabem numa coluna do grid da loja.
//
// Por que não um número fixo por breakpoint: o grid é
// `repeat(auto-fill, minmax(212px, 1fr))`, então telas maiores ganham MAIS
// colunas e cada card fica MAIS ESTREITO. A linha do nome mede 284px numa tela
// de 1024px e só 187px numa de 1920px — a coluna mais estreita do desktop está
// na tela maior. Qualquer `@media` erraria justamente onde mais corta.
//
// Medindo a coluna, o limite é um só para todos os cards visíveis (todas as
// colunas do grid têm a mesma largura), que é o "padrão limpo": todo nome é
// cortado na mesma contagem de caracteres, e não num ponto que varia conforme
// a letra seja um "I" ou um "W".

import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';

/** Nenhum nome do catálogo passa disso; acima daqui não há o que cortar. */
const TETO = 60;

/** Amostra com a mistura de letras, dígitos e espaços dos nomes reais do
 *  catálogo ("EBP 001 GLOSS BLACK SUNROOF 12C"). Serve de régua para a largura
 *  média de caractere — usar "0" ou "M" daria um limite torto. */
const REGUA = 'EBP 001 GLOSS BLACK SUNROOF 12C ECC 010 CHAMELEON GALAXY PET DIAMOND SILVER';

let pincel: CanvasRenderingContext2D | null = null;

/** A janela de `n` caracteres mais larga da régua. É a medida certa para
 *  decidir o limite: uma estatística por letra isolada trata o nome como se
 *  fosse só de "W", e uma média simples deixa passar os nomes de letras largas
 *  — que então estouravam a linha e eram cortados pelo CSS num ponto diferente
 *  do resto da fileira. */
function larguraDaPiorJanela(n: number): number {
  let pior = 0;
  for (let i = 0; i + n <= REGUA.length; i++) {
    const w = pincel!.measureText(REGUA.slice(i, i + n)).width;
    if (w > pior) pior = w;
  }
  return pior;
}

/** Maior contagem de caracteres que cabe em `larguraDisponivel`. */
function limitePara(fonte: string, larguraDisponivel: number): number {
  if (!pincel) pincel = document.createElement('canvas').getContext('2d');
  if (!pincel) return 0;
  pincel.font = fonte;
  // O "…" entra no lugar do que sobrar, então ele conta para a largura.
  const reticencias = pincel.measureText('…').width;
  const util = larguraDisponivel - reticencias;
  // Busca binária: a largura cresce com `n`, então dá para ir direto ao maior
  // `n` que ainda cabe, sem medir os 60 tamanhos.
  let baixo = 1;
  let alto = TETO;
  while (baixo < alto) {
    const meio = Math.ceil((baixo + alto) / 2);
    if (larguraDaPiorJanela(meio) <= util) baixo = meio;
    else alto = meio - 1;
  }
  return baixo;
}

/**
 * @param gridRef  O container do grid — é dele que sai a largura da coluna.
 * @returns Número máximo de caracteres, ou `null` antes da primeira medida
 *          (aí o CSS corta com reticências, que continua valendo como rede).
 */
export function useLimiteNome(gridRef: RefObject<HTMLElement | null>): number | null {
  const [limite, setLimite] = useState<number | null>(null);

  const medir = useCallback(() => {
    const grid = gridRef.current;
    // A linha do nome mora dentro do card, não do grid: pegá-la direto evita
    // recalcular padding e borda aqui e no CSS, que sairiam do sincronismo.
    const nome = grid?.querySelector<HTMLElement>('h3');
    if (!nome) return;

    const cs = getComputedStyle(nome);
    const larguraDisponivel = nome.clientWidth;
    if (!larguraDisponivel) return;

    const cabem = limitePara(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, larguraDisponivel);
    if (!cabem) return;
    setLimite(Math.max(8, Math.min(TETO, cabem)));
  }, [gridRef]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    medir();
    // A largura da coluna muda com a janela e com o próprio grid (a sidebar de
    // filtros abre e fecha), então observar o grid cobre os dois casos.
    const ro = new ResizeObserver(medir);
    ro.observe(grid);
    // As fontes chegam depois do primeiro quadro; sem isso o limite ficaria
    // calculado em cima da fonte de fallback.
    document.fonts?.ready.then(medir).catch(() => {});
    return () => ro.disconnect();
  }, [gridRef, medir]);

  return limite;
}

/**
 * Corta na contagem exata. Sem respeitar palavra de propósito: parar na última
 * palavra inteira faria cada nome terminar num ponto diferente, que é
 * justamente o que o corte por caractere existe para evitar. Cortando sempre no
 * mesmo caractere, todos os títulos da fileira terminam alinhados.
 */
export function cortarNome(nome: string, limite: number | null): string {
  if (limite == null || nome.length <= limite) return nome;
  return `${nome.slice(0, limite).trimEnd()}…`;
}
