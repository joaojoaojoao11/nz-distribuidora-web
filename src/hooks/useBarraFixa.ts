// Barra fixa no rodapé do celular (checkout, registro de garantia).
//
// Marca o <body> com data-nz-barra enquanto a barra existe. É o sinal que o
// CSS do botão flutuante do WhatsApp usa para subir acima dela — sem isso o
// botão verde ficava em cima do "Pagar"/"Continuar". Mesmo padrão do
// data-nz-modal do useModalLock.

import { useEffect } from 'react';

export function useBarraFixa(ativa = true) {
  useEffect(() => {
    if (!ativa) return;
    document.body.dataset.nzBarra = '1';
    return () => {
      delete document.body.dataset.nzBarra;
    };
  }, [ativa]);
}
