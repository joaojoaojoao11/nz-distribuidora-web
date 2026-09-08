// Arredondamento de dinheiro, num lugar só.
//
// Estava dentro de precificar.ts; saiu quando as seleções (/api/nz/selecoes)
// passaram a precisar da mesma régua para aplicar o acréscimo em %. Duas cópias
// divergem no dia em que uma delas vira `toFixed(2)` e a outra continua
// `Math.round` — e aí o card mostra um centavo e o pedido cobra outro.

/** Duas casas, para cima a partir de .005. É o que o BRL espera. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Preço com o acréscimo de uma seleção. Feito NO SERVIDOR, sempre: o cliente
 * nunca recebe o percentual, só o número final — senão bastaria abrir o
 * DevTools para descobrir de quanto foi o aumento.
 */
export function aplicarAcrescimo(valor: number | null | undefined, pct: number): number | null {
  const base = Number(valor);
  if (!(base > 0)) return null;
  const p = Number(pct);
  if (!Number.isFinite(p) || p <= 0) return r2(base);
  return r2(base * (1 + p / 100));
}
