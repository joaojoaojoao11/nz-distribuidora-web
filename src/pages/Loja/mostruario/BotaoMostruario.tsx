// Botão "Baixar mostruário da cor (PDF)" da página do produto.
//
// Mesmo desenho do BotaoCatalogo (BlocoDaLinha.tsx): html2canvas, jsPDF, o
// documento e o qrcode entram por import dinâmico, só no clique — não podem
// pesar no chunk da loja por causa de um botão. O documento só é montado
// durante a geração, fora da tela.

import { useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { useLinhas } from '../../../lib/shop/store';
import { fichaDoItem } from '../../../lib/shop/linhas';
import { COLOR_LABEL } from '../../../lib/shop/color/lexicon';
import type { MidiaPublica, ShopItem } from '../../../lib/shop/types';
import { varianteSintetica } from '../FichaTecnica';
import type { DadosMostruario, Preparado } from './montarMostruario';

type Estado = 'parado' | 'preparando' | 'gerando' | 'erro';

interface Pronto extends Preparado {
  Doc: ComponentType<{ dados: DadosMostruario; ref?: Ref<HTMLDivElement> }>;
  gerar: (el: HTMLElement, o: { fileName: string; quality: 'alta' | 'compacta' }) => Promise<void>;
}

export default function BotaoMostruario({
  item,
  midias,
  className,
}: {
  item: ShopItem;
  midias: MidiaPublica[];
  className?: string;
}) {
  const indice = useLinhas();
  const [estado, setEstado] = useState<Estado>('parado');
  const [pronto, setPronto] = useState<Pronto | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pronto) return;
    let cancelado = false;
    setEstado('gerando');
    (async () => {
      try {
        const el = docRef.current;
        if (!el) throw new Error('documento não montado');
        await pronto.gerar(el, { fileName: pronto.arquivo, quality: 'alta' });
        if (!cancelado) setEstado('parado');
      } catch (e) {
        console.error('Falha ao gerar o mostruário:', e);
        if (!cancelado) setEstado('erro');
      } finally {
        pronto.liberar();
        if (!cancelado) setPronto(null);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [pronto]);

  if (!midias.some((m) => m.tipo === 'imagem')) return null;

  const clicar = async () => {
    if (estado === 'preparando' || estado === 'gerando') return;
    setEstado('preparando');
    try {
      const [montar, doc, gerador] = await Promise.all([
        import('./montarMostruario'),
        import('./MostruarioDocumento'),
        import('../../Ppf/generatePpfPortfolioPdf'),
      ]);
      const base = item.specs.length ? item : { ...item, specs: varianteSintetica(item) };
      const ficha = fichaDoItem(base, indice);
      const familia = item.colorFamilies[0] ? COLOR_LABEL[item.colorFamilies[0]] : null;
      const preparado = await montar.prepararMostruario(item, midias, ficha, { familia });
      setPronto({
        ...preparado,
        Doc: doc.default as unknown as Pronto['Doc'],
        gerar: gerador.generatePpfPortfolioPdf as unknown as Pronto['gerar'],
      });
    } catch (e) {
      console.error('Falha ao preparar o mostruário:', e);
      setEstado('erro');
    }
  };

  const Doc = pronto?.Doc;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => void clicar()}
        disabled={estado === 'preparando' || estado === 'gerando'}
      >
        {estado === 'preparando' && 'Juntando as fotos…'}
        {estado === 'gerando' && 'Gerando o PDF…'}
        {estado === 'parado' && 'Baixar mostruário da cor (PDF)'}
        {estado === 'erro' && 'Não deu — tentar de novo'}
      </button>
      {Doc && pronto && <Doc ref={docRef} dados={pronto.dados} />}
    </>
  );
}
