// Barra fixa no rodapé do celular (checkout, registro de garantia).
//
// Marca o <body> com data-nz-barra enquanto a barra existe. É o sinal que o
// CSS do botão flutuante do WhatsApp usa — sem nenhum estado atravessar
// componentes, mesmo padrão do data-nz-modal do useModalLock:
//   - 'subir'   (checkout): o botão sobe acima da barra, para não cobrir o "Pagar";
//   - 'ocultar' (formulário): o botão some — subindo, ele caía em cima dos
//     campos que a pessoa está preenchendo.

import { useEffect } from 'react';

export function useBarraFixa(ativa = true, whatsapp: 'subir' | 'ocultar' = 'subir') {
  useEffect(() => {
    if (!ativa) return;
    document.body.dataset.nzBarra = whatsapp;
    return () => {
      delete document.body.dataset.nzBarra;
    };
  }, [ativa, whatsapp]);
}
