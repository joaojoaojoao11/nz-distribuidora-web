import styles from './SocialImage.module.css';
import type { SocialImageData } from './socialImageTypes';

/**
 * Renderiza o wordmark do topo dos layouts. Regras:
 *
 *  1. Se o campo wordmark está oculto → não renderiza nada.
 *  2. Senão, se o usuário digitou um valor diferente do brandName default,
 *     renderiza o texto digitado (override explícito tem prioridade).
 *  3. Senão, se há `brandLogoUrl` → renderiza o logo SVG/PNG.
 *  4. Senão → renderiza o texto `brandName`.
 *
 * Centraliza essa lógica num só lugar pra que os 6 layouts não precisem
 * repeti-la — basta chamar <Wordmark data={data} /> no topo.
 */
export default function Wordmark({ data }: { data: SocialImageData }) {
  const o = data.fieldOverrides?.wordmark;
  if (o?.hidden === true) return null;

  const defaultText = data.brandName;
  const value = o?.value ?? defaultText;
  if (!value && !data.brandLogoUrl) return null;

  // Se o usuário digitou texto diferente do default, respeitamos. Caso
  // contrário, preferimos o logo (quando disponível).
  const userOverrode = o?.value !== undefined && o.value !== defaultText;
  const useLogo = !userOverrode && !!data.brandLogoUrl;

  if (useLogo) {
    return (
      <img
        src={data.brandLogoUrl}
        alt={defaultText}
        className={styles.wordmarkLogo}
      />
    );
  }

  if (!value) return null;
  return <div className={styles.wordmark}>{value}</div>;
}
