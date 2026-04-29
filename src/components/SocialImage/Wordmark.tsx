import styles from './SocialImage.module.css';
import type { SocialImageData } from './socialImageTypes';
import EditableElement from './EditableElement';

/**
 * Renderiza o wordmark do topo dos layouts. Regras:
 *
 *  1. Se o campo wordmark está oculto → não renderiza nada.
 *  2. Senão, se o usuário digitou um valor diferente do brandName default,
 *     renderiza o texto digitado (override explícito tem prioridade).
 *  3. Senão, se há `brandLogoUrl` → renderiza o logo SVG/PNG.
 *  4. Senão → renderiza o texto `brandName`.
 *
 * Em qualquer dos 3 casos visíveis, o conteúdo vai dentro de um
 * EditableElement — assim o usuário pode arrastar e redimensionar o
 * wordmark no edit mode, e o transform persistido vale tanto pro preview
 * quanto pro PNG exportado.
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
      <EditableElement
        fieldKey="wordmark"
        className={styles.wordmarkLogoWrap}
        override={o}
      >
        <img src={data.brandLogoUrl} alt={defaultText} className={styles.wordmarkLogo} />
      </EditableElement>
    );
  }

  if (!value) return null;
  return (
    <EditableElement
      fieldKey="wordmark"
      className={styles.wordmark}
      override={o}
    >
      {value}
    </EditableElement>
  );
}
