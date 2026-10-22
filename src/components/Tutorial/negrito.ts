// `**trecho**` vira negrito; o resto é texto puro. Usado pela janela do
// tutorial e pela vitrine (arquivo .ts à parte: o Fast Refresh quer arquivo de
// componente exportando só componentes).

import { createElement, type ReactNode } from 'react';

export function comNegrito(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? createElement('strong', { key: i }, parte.slice(2, -2)) : parte
  );
}
