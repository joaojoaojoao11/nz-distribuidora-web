/**
 * Sanitização sistêmica de texto para o catálogo PDF e outros documentos.
 *
 * Esta é a fonte única da verdade. A função é aplicada em duas camadas:
 *  1. DATA-LEVEL (em catalogData.ts via `deepSanitize`) — todo texto da
 *     fonte já sai higienizado. Zero chance de uma render-path bypass-ar.
 *  2. RENDER-LEVEL (em cada componente) — redundante mas idempotente.
 *     Protege textos hardcoded em JSX.
 *
 * Regras em cadeia:
 *  1. Siglas grudadas com palavra seguinte: "PVCde" → "PVC de"
 *  2. Plurais grudados: "PPFsé" → "PPFs é"
 *  3. Singulares grudados (com negative lookahead p/ preservar plurais)
 *  4. Sem espaços antes de pontuação: "palavra ," → "palavra,"
 *  5. Hífens sem espaços: "auto -cura" → "auto-cura"
 *  6. Sem espaços duplos
 *  7. NBSP defensivo: "PPF nasceu" → "PPF nasceu" (evita colapso no
 *     html2canvas, que renderiza NBSP visualmente idêntico a espaço)
 */

const NBSP = ' ';

export function sanitizeCatalogText(text: string | undefined | null): string {
  if (!text) return '';

  let result = text;

  // 1. NZPPF/NZ PPF (com plural opcional) grudado em palavra seguinte
  result = result.replace(/\bNZ ?PPF(s)?([A-Za-zÀ-ÿ ])/g, (_m, plural, nextChar) => {
    const pluralPart = plural || '';
    if (nextChar === ' ') return `NZ PPF${pluralPart} `;
    return `NZ PPF${pluralPart} ${nextChar}`;
  });

  // 2. Plurais de siglas simples grudados: "PPFsé" → "PPFs é"
  result = result.replace(/\b(PPFs|TPUs|PVCs)([A-Za-zÀ-ÿ])/g, '$1 $2');

  // 3. Siglas singulares grudadas a palavra — NUNCA quando seguida por "s"
  //    (caso plural, tratado em step 2).
  result = result.replace(/\b(PPF|TPU|PVC|PSA|ADAS|UV)(?!s)([a-zà-ÿ])/g, '$1 $2');

  // 4. Remove espaços antes de pontuação
  result = result.replace(/\s+([,.;:!?])/g, '$1');

  // 5. Hífens em palavras compostas sem espaços
  result = result.replace(/(\p{L})\s*-\s*(\p{L})/gu, '$1-$2');

  // 6. Normaliza espaços duplos
  result = result.replace(/ {2,}/g, ' ');

  // 7. Defensa final contra html2canvas: troca space por NBSP imediatamente
  //    após siglas (impede colapso visual no render). Ordem: mais longos primeiro.
  result = result.replace(
    /\b(NZ PPFs|NZ PPF|NZPPF|PPFs|PPF|TPUs|TPU|PVCs|PVC|PSA|ADAS) (?=[A-Za-zÀ-ÿ0-9])/g,
    (_m, sigla) => `${sigla}${NBSP}`
  );

  return result.trim();
}

/**
 * Aplica `sanitizeCatalogText` recursivamente em strings dentro de estruturas
 * aninhadas (arrays, objetos). Preserva tipos e chaves.
 *
 * Uso: aplicar em dados no ponto de export, garantindo que nenhum consumidor
 * downstream precise pensar em sanitização.
 */
export function deepSanitize<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeCatalogText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepSanitize(v)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepSanitize(v);
    }
    return out as T;
  }
  return value;
}

/** Alias legado para código existente (textHelpers.ts). */
export const safeSpacing = sanitizeCatalogText;
