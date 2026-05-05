import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/**
 * Sistema de overrides do catálogo NZPPF.
 *
 * Permite que o usuário edite/oculte textos e ajuste a escala tipográfica
 * de cada página do catálogo via PageEditor, com persistência local.
 * As páginas leem os overrides via hooks `useEditableText`,
 * `useElementHidden`, `usePageScale` — sempre caindo no default quando
 * não há override registrado.
 *
 * Persistência: localStorage (chave nzppf-catalog-overrides-v1).
 * Migração futura para Supabase mantém a mesma API.
 */

export interface ElementOverride {
  /** Texto customizado. Quando undefined, usa o default do componente. */
  text?: string;
  /** Quando true, o elemento não é renderizado. */
  hidden?: boolean;
  /**
   * Multiplicador de tamanho de fonte do elemento (0.7–1.5).
   * Aplicado via CSS custom property `--field-scale` que se compõe
   * com `--user-scale` da página dentro dos tokens tipográficos.
   */
  fontScale?: number;
  /**
   * Tracking (letter-spacing) do elemento, em em.
   * Faixa prática: −0.02 a +0.05 (Adobe units: −20 a +50).
   * Quando 0/undefined, herda o letter-spacing do CSS da classe pai.
   * Em em pra escalar proporcionalmente com font-size — mesmo ratio
   * visual no preview do editor (transform: scale) e no PDF (escala 1).
   */
  letterSpacing?: number;
}

export interface PageOverrides {
  /** Multiplicador de escala tipográfica (0.8–1.2). Aplicado via --user-scale. */
  scale?: number;
  /** Overrides de elementos específicos da página, indexados por fieldKey. */
  elements?: Record<string, ElementOverride>;
}

export interface CatalogOverridesState {
  pages: Record<string, PageOverrides>;
}

const LS_KEY = 'nzppf-catalog-overrides-v1';

function loadFromLocalStorage(): CatalogOverridesState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { pages: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.pages && typeof parsed.pages === 'object') {
      return parsed as CatalogOverridesState;
    }
    return { pages: {} };
  } catch {
    return { pages: {} };
  }
}

function saveToLocalStorage(state: CatalogOverridesState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponível ou cota excedida — silencia.
  }
}

interface CatalogOverridesContextValue {
  state: CatalogOverridesState;
  getPage: (pageId: string) => PageOverrides;
  setElement: (pageId: string, fieldKey: string, override: ElementOverride) => void;
  setPageScale: (pageId: string, scale: number | undefined) => void;
  resetPage: (pageId: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<CatalogOverridesContextValue | null>(null);

export function CatalogOverridesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogOverridesState>(() => loadFromLocalStorage());

  useEffect(() => {
    saveToLocalStorage(state);
  }, [state]);

  const getPage = useCallback(
    (pageId: string): PageOverrides => state.pages[pageId] || {},
    [state]
  );

  const setElement = useCallback(
    (pageId: string, fieldKey: string, override: ElementOverride) => {
      setState((prev) => {
        const page = { ...(prev.pages[pageId] || {}) };
        const elements = { ...(page.elements || {}) };
        const merged: ElementOverride = { ...elements[fieldKey], ...override };
        // Limpa keys cujo valor virou undefined ou neutro (permite "resetar"
        // um campo individual sem deixar lixo no localStorage).
        if (merged.text === undefined) delete merged.text;
        if (merged.hidden === undefined || merged.hidden === false) delete merged.hidden;
        if (
          merged.fontScale === undefined ||
          merged.fontScale === 1 ||
          Number.isNaN(merged.fontScale)
        ) {
          delete merged.fontScale;
        }
        if (
          merged.letterSpacing === undefined ||
          merged.letterSpacing === 0 ||
          Number.isNaN(merged.letterSpacing)
        ) {
          delete merged.letterSpacing;
        }
        if (Object.keys(merged).length === 0) {
          delete elements[fieldKey];
        } else {
          elements[fieldKey] = merged;
        }
        if (Object.keys(elements).length === 0) {
          delete page.elements;
        } else {
          page.elements = elements;
        }
        const newPages = { ...prev.pages };
        if (Object.keys(page).length === 0) {
          delete newPages[pageId];
        } else {
          newPages[pageId] = page;
        }
        return { ...prev, pages: newPages };
      });
    },
    []
  );

  const setPageScale = useCallback((pageId: string, scale: number | undefined) => {
    setState((prev) => {
      const page = { ...(prev.pages[pageId] || {}) };
      if (scale === undefined || scale === 1) {
        delete page.scale;
      } else {
        page.scale = scale;
      }
      const newPages = { ...prev.pages };
      if (Object.keys(page).length === 0) {
        delete newPages[pageId];
      } else {
        newPages[pageId] = page;
      }
      return { ...prev, pages: newPages };
    });
  }, []);

  const resetPage = useCallback((pageId: string) => {
    setState((prev) => {
      const newPages = { ...prev.pages };
      delete newPages[pageId];
      return { ...prev, pages: newPages };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({ pages: {} });
  }, []);

  return (
    <Ctx.Provider
      value={{ state, getPage, setElement, setPageScale, resetPage, resetAll }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCatalogOverrides(): CatalogOverridesContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useCatalogOverrides deve ser usado dentro de <CatalogOverridesProvider>');
  }
  return ctx;
}

/**
 * Resolve o texto editável: retorna o override do usuário se houver,
 * caso contrário retorna o defaultText. Componentes consomem este
 * hook em vez de hardcodar strings.
 */
export function useEditableText(
  pageId: string,
  fieldKey: string,
  defaultText: string
): string {
  const { getPage } = useCatalogOverrides();
  const override = getPage(pageId).elements?.[fieldKey];
  return override?.text ?? defaultText;
}

/** Retorna true se o usuário marcou o elemento como oculto. */
export function useElementHidden(pageId: string, fieldKey: string): boolean {
  const { getPage } = useCatalogOverrides();
  return getPage(pageId).elements?.[fieldKey]?.hidden === true;
}

/** Multiplicador de escala da página (default 1). */
export function usePageScale(pageId: string): number {
  const { getPage } = useCatalogOverrides();
  return getPage(pageId).scale ?? 1;
}

/** Multiplicador individual de fonte do elemento (default 1). */
export function useElementFontScale(pageId: string, fieldKey: string): number {
  const { getPage } = useCatalogOverrides();
  return getPage(pageId).elements?.[fieldKey]?.fontScale ?? 1;
}

/**
 * Tracking (letter-spacing) individual do elemento, em em (default 0).
 * Componentes consomem e aplicam via inline style — quando 0, o CSS da
 * classe pai (.h1/.h2/.coverHeadline/etc) governa.
 */
export function useElementLetterSpacing(pageId: string, fieldKey: string): number {
  const { getPage } = useCatalogOverrides();
  return getPage(pageId).elements?.[fieldKey]?.letterSpacing ?? 0;
}
