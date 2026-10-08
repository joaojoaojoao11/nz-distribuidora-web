// Bloco "Mostruário da cor (PDF)" da página do produto, com duas saídas:
// COM o contato da NZ e SEM contato (o instalador repassa ao dono do carro
// sem mostrar de onde comprou — pedido do João, 08/10/2026).
//
// Mesmo desenho do BotaoCatalogo (BlocoDaLinha.tsx): html2canvas, jsPDF, o
// documento e o qrcode entram por import dinâmico, só no clique — não podem
// pesar no chunk da loja por causa de um botão. O documento só é montado
// durante a geração, fora da tela.

import { useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { useLinhas } from '../../../lib/shop/store';
import { fichaDoItem } from '../../../lib/shop/linhas';
import { COLOR_LABEL } from '../../../lib/shop/color/lexicon';
import { FINISH_LABEL } from '../../../lib/shop/finish/tree';
import type { MidiaPublica, ShopItem } from '../../../lib/shop/types';
import { varianteSintetica } from '../FichaTecnica';
import type { DadosMostruario, Preparado } from './montarMostruario';
import styles from './BotaoMostruario.module.css';

type Versao = 'nz' | 'neutro';
type Estado = { fase: 'parado' } | { fase: 'preparando' | 'gerando'; versao: Versao } | { fase: 'erro' };

interface Pronto extends Preparado {
  versao: Versao;
  Doc: ComponentType<{ dados: DadosMostruario; ref?: Ref<HTMLDivElement> }>;
  gerar: (el: HTMLElement, o: { fileName: string; quality: 'alta' | 'compacta' }) => Promise<void>;
}

export default function BotaoMostruario({ item, midias }: { item: ShopItem; midias: MidiaPublica[] }) {
  const indice = useLinhas();
  const [estado, setEstado] = useState<Estado>({ fase: 'parado' });
  const [pronto, setPronto] = useState<Pronto | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pronto) return;
    let cancelado = false;
    setEstado({ fase: 'gerando', versao: pronto.versao });
    (async () => {
      try {
        const el = docRef.current;
        if (!el) throw new Error('documento não montado');
        await pronto.gerar(el, { fileName: pronto.arquivo, quality: 'alta' });
        if (!cancelado) setEstado({ fase: 'parado' });
      } catch (e) {
        console.error('Falha ao gerar o mostruário:', e);
        if (!cancelado) setEstado({ fase: 'erro' });
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

  const ocupado = estado.fase === 'preparando' || estado.fase === 'gerando';

  const gerar = async (versao: Versao) => {
    if (ocupado) return;
    setEstado({ fase: 'preparando', versao });
    try {
      const [montar, doc, gerador] = await Promise.all([
        import('./montarMostruario'),
        import('./MostruarioDocumento'),
        import('../../Ppf/generatePpfPortfolioPdf'),
      ]);
      const base = item.specs.length ? item : { ...item, specs: varianteSintetica(item) };
      const ficha = fichaDoItem(base, indice);
      const familia = item.colorFamilies[0] ? COLOR_LABEL[item.colorFamilies[0]] : null;
      const acabamento = item.finishLabel ?? (item.finishes.length ? item.finishes.map((f) => FINISH_LABEL[f]).join(' ') : null);
      const preparado = await montar.prepararMostruario(item, midias, ficha, { familia, acabamento }, versao === 'nz');
      setPronto({
        ...preparado,
        versao,
        Doc: doc.default as unknown as Pronto['Doc'],
        gerar: gerador.generatePpfPortfolioPdf as unknown as Pronto['gerar'],
      });
    } catch (e) {
      console.error('Falha ao preparar o mostruário:', e);
      setEstado({ fase: 'erro' });
    }
  };

  const rotulo = (versao: Versao, texto: string) => {
    if (estado.fase === 'preparando' && estado.versao === versao) return 'Juntando as fotos…';
    if (estado.fase === 'gerando' && estado.versao === versao) return 'Gerando o PDF…';
    return texto;
  };

  const Doc = pronto?.Doc;

  return (
    <div className={styles.bloco}>
      <p className={styles.titulo}>Mostruário da cor em PDF</p>
      <div className={styles.opcoes}>
        <button type="button" className={styles.opcao} onClick={() => void gerar('nz')} disabled={ocupado}>
          {rotulo('nz', 'Com contato NZ')}
        </button>
        <button type="button" className={styles.opcao} onClick={() => void gerar('neutro')} disabled={ocupado}>
          {rotulo('neutro', 'Sem contato')}
        </button>
      </div>
      <p className={styles.nota}>
        {estado.fase === 'erro'
          ? 'Não deu para gerar o arquivo. Tente de novo.'
          : 'Todas as fotos da cor num arquivo. "Sem contato" sai sem marca nem contato da NZ, para repassar ao seu cliente.'}
      </p>
      {Doc && pronto && <Doc ref={docRef} dados={pronto.dados} />}
    </div>
  );
}
