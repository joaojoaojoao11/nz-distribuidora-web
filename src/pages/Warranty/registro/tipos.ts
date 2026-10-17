import type { Erros, Rascunho } from '../../../lib/garantia';

export interface PropsDoPasso {
  r: Rascunho;
  mudar: (patch: Partial<Rascunho>) => void;
  erros: Erros;
  /** A pessoa já tentou avançar neste passo: agora os erros aparecem. */
  mostrar: boolean;
}
