// O "plus" das linhas próprias: página de apresentação, catálogo e fotos.
//
// Numa linha de terceiro, o material de apoio é do fabricante e mora no site
// dele — o máximo que damos é o TDS. Na marca própria (NZPPF) a página, o
// catálogo em PDF e a sessão de fotos são nossos, e antes disto o cliente
// chegava na página do rolo sem caminho nenhum para eles.
//
// O bloco é genérico, não "de PPF": aparece em qualquer linha que tenha
// `galeria`, `pagina_url` ou catálogo. Hoje só a NZPPF tem os três.
//
// O catálogo é o portfólio que já existe em src/pages/Ppf — o mesmo PDF que a
// página da linha gera, a partir dos MESMOS dados. Não há segunda cópia de
// ficha técnica em lugar nenhum, então o catálogo nunca diverge do site.
// Tudo entra por import dinâmico: html2canvas, jsPDF e as seis linhas de dados
// da NZPPF não podem cair no chunk da loja por causa de um botão.

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import type { FichaDoProduto } from '../../lib/shop/linhas';
import styles from './BlocoDaLinha.module.css';

type Estado = 'parado' | 'preparando' | 'gerando' | 'erro';

interface Pronto {
  Doc: ComponentType<{ lines: unknown[]; ref?: React.Ref<HTMLDivElement> }>;
  entrada: unknown;
  gerar: (el: HTMLElement, o: { fileName: string; quality: 'alta' | 'compacta' }) => Promise<unknown>;
  arquivo: string;
}

function BotaoCatalogo({ slug, nome }: { slug: string; nome: string }) {
  const [estado, setEstado] = useState<Estado>('parado');
  const [pronto, setPronto] = useState<Pronto | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // O documento imprimível só é montado durante a geração: são até 8 páginas
  // A4 com imagens em tamanho real.
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
        console.error('Falha ao gerar o catálogo da linha:', e);
        if (!cancelado) setEstado('erro');
      } finally {
        if (!cancelado) setPronto(null);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [pronto]);

  const clicar = async () => {
    if (estado === 'preparando' || estado === 'gerando') return;
    setEstado('preparando');
    try {
      // Carrega tudo ANTES de montar. Assim o documento renderiza de uma vez e
      // o efeito acima encontra o ref preenchido — com React.lazy o efeito
      // poderia rodar antes de o filho existir.
      const [registro, doc, gerador] = await Promise.all([
        import('../Ppf/ppfPortfolioRegistry'),
        import('../Ppf/PpfPortfolioDocument'),
        import('../Ppf/generatePpfPortfolioPdf'),
      ]);
      const entrada = registro.getPortfolioLine(slug);
      if (!entrada) throw new Error(`linha "${slug}" não existe no portfólio`);
      setPronto({
        Doc: doc.default as unknown as Pronto['Doc'],
        entrada,
        gerar: gerador.generatePpfPortfolioPdf as unknown as Pronto['gerar'],
        arquivo: entrada.config.fileName,
      });
    } catch (e) {
      console.error('Falha ao preparar o catálogo:', e);
      setEstado('erro');
    }
  };

  const Doc = pronto?.Doc;

  return (
    <>
      <button type="button" className={styles.acaoPrincipal} onClick={() => void clicar()} disabled={estado === 'preparando' || estado === 'gerando'}>
        {estado === 'preparando' && 'Preparando…'}
        {estado === 'gerando' && 'Gerando o PDF…'}
        {estado === 'parado' && `Baixar o catálogo ${nome} (PDF)`}
        {estado === 'erro' && 'Não deu — tentar de novo'}
      </button>
      {Doc && pronto && <Doc ref={docRef} lines={[pronto.entrada]} />}
    </>
  );
}

export default function BlocoDaLinha({ ficha }: { ficha: FichaDoProduto }) {
  const fotos = ficha.galeria;
  const temAlgo = fotos.length > 0 || Boolean(ficha.paginaUrl) || Boolean(ficha.catalogoSlug) || Boolean(ficha.catalogoUrl);
  if (!temAlgo) return null;

  const nome = ficha.linhaLabel ?? 'a linha';
  const capa = fotos[0] ?? null;
  const demais = fotos.slice(1);

  return (
    <section className={styles.bloco}>
      <h2 className={styles.titulo}>
        A linha {nome}
        {ficha.marcaPropria && <span className={styles.selo}>marca própria NZ</span>}
      </h2>

      {capa && (
        <figure className={styles.capa}>
          <img src={capa.url} alt={capa.titulo ?? nome} loading="lazy" />
          {(capa.titulo || capa.sub) && (
            <figcaption>
              {capa.titulo && <strong>{capa.titulo}</strong>}
              {capa.sub && <span>{capa.sub}</span>}
            </figcaption>
          )}
        </figure>
      )}

      {demais.length > 0 && (
        <ul className={styles.acabamentos}>
          {demais.map((f) => (
            <li key={f.url}>
              <img src={f.url} alt={f.titulo ?? ''} loading="lazy" />
              <div>
                {f.titulo && <strong>{f.titulo}</strong>}
                {f.sub && <span>{f.sub}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.acoes}>
        {ficha.catalogoSlug && <BotaoCatalogo slug={ficha.catalogoSlug} nome={nome} />}
        {!ficha.catalogoSlug && ficha.catalogoUrl && (
          <a className={styles.acaoPrincipal} href={ficha.catalogoUrl} target="_blank" rel="noopener noreferrer">
            Baixar o catálogo {nome} (PDF)
          </a>
        )}
        {ficha.paginaUrl && (
          <Link className={styles.acaoSecundaria} to={ficha.paginaUrl}>
            Ver a página da linha
          </Link>
        )}
      </div>
    </section>
  );
}
