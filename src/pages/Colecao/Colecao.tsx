// /colecao — Coleção NZPPF 2026 · Os Clãs (alias /clas, no vercel.json).
// Cinco camisetas pretas, cada uma um clã. Até o lançamento (LANCAMENTO, em
// colecaoConfig.ts) a página mostra a contagem e a lista de espera; depois,
// os botões viram "Comprar" e o preço aparece. Textos aprovados pela Cledna
// em 17/10/2026 — moram todos em colecaoConfig.ts.
//
// Prévia do pós-lançamento (só localhost e previews da Vercel):
//   /colecao?previa=lancado

import {
  Fragment, useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type FormEvent, type MouseEvent, type ReactNode, type RefObject,
} from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, ChevronDown, CircleAlert, LoaderCircle } from 'lucide-react';
import SEO from '../../components/SEO/SEO';
import { SITE_NAME, SITE_URL } from '../../lib/siteConfig';
import { supabase } from '../../lib/supabase';
import { formatPhone, isValidPhone, toE164 } from '../../lib/formatters';
import Contagem from './Contagem';
import {
  CLAS, CLA_POR_SLUG, FICHA_ROTULOS, GALERIA, IMAGENS, INTRO, KIT_FOTOS, KIT_ITENS,
  LANCAMENTO, LANCAMENTO_DIA, LANCAMENTO_TEXTO, LOJA_COLECAO_URL, PRECO, PRECO_NUMERO,
  SEO_DESCRICAO, SEO_TITULO, SUBTITULO, TABELA_LEADS, TAMANHOS, VIDEOS,
  corComAlfa, ehClaSlug, imagemCla, linkLoja,
  type Cla, type ClaSlug,
} from './colecaoConfig';
import styles from './Colecao.module.css';

const EASE = [0.22, 1, 0.36, 1] as const;
const TAMANHOS_TEXTO = `${TAMANHOS.slice(0, -1).join(', ')} e ${TAMANHOS[TAMANHOS.length - 1]}`;
/** Guarda, neste navegador, que a pessoa já entrou na lista (só conveniência). */
const CHAVE_LISTA = 'nz_colecao2026_lista';

/* ═══════════════════════════════════════════
   Utilidades
   ═══════════════════════════════════════════ */

/** Variáveis de cor do clã para o CSS (acento, texto sobre o acento, brilho). */
function varsCla(c: Cla | undefined): CSSProperties | undefined {
  if (!c) return undefined;
  return {
    '--cla': c.cor,
    '--cla-texto': c.corTexto,
    '--cla-brilho': corComAlfa(c.cor, 0.13),
  } as CSSProperties;
}

/** "*trecho*" vira itálico — é a única marcação dos textos aprovados. */
function comEnfase(texto: string): ReactNode {
  return texto.split('*').map((parte, i) =>
    i % 2 === 1 ? <em key={i}>{parte}</em> : <Fragment key={i}>{parte}</Fragment>,
  );
}

function movimentoReduzido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Rola até uma seção sem empilhar histórico e mantendo ?utm_* na URL. */
function rolarPara(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: movimentoReduzido() ? 'auto' : 'smooth', block: 'start' });
  try {
    window.history.replaceState(window.history.state, '', `#${id}`);
  } catch { /* sem histórico (iframe/sandbox) — a rolagem já aconteceu */ }
}

function aoClicarAncora(id: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    rolarPara(id);
  };
}

function podeVerPrevia(): boolean {
  if (import.meta.env.DEV) return true;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.vercel.app');
}

/**
 * Já lançou? Vira sozinho na hora H, mesmo com a página aberta.
 * O setTimeout estoura acima de ~24,8 dias e atrasa com o computador
 * dormindo — por isso reconfere no máximo de hora em hora.
 */
function useLancado(): [boolean, () => void] {
  const [searchParams] = useSearchParams();
  const forcado = searchParams.get('previa') === 'lancado' && podeVerPrevia();
  const [lancado, setLancado] = useState(() => Date.now() >= LANCAMENTO.getTime());

  useEffect(() => {
    if (lancado) return;
    let id: number | undefined;
    const conferir = () => {
      const falta = LANCAMENTO.getTime() - Date.now();
      if (falta <= 0) {
        setLancado(true);
        return;
      }
      id = window.setTimeout(conferir, Math.min(falta + 250, 3_600_000));
    };
    id = window.setTimeout(conferir, 0);
    return () => window.clearTimeout(id);
  }, [lancado]);

  const marcarLancado = useCallback(() => setLancado(true), []);
  return [forcado || lancado, marcarLancado];
}

/* ═══════════════════════════════════════════
   Página
   ═══════════════════════════════════════════ */

export default function Colecao() {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const [lancado, marcarLancado] = useLancado();

  // Clã pré-escolhido: vem do botão "Quero ser do clã" ou de ?cla=<slug>.
  const [claEscolhido, setClaEscolhido] = useState<ClaSlug | ''>(() => {
    const doLink = searchParams.get('cla');
    return ehClaSlug(doLink) ? doLink : '';
  });
  const tituloListaRef = useRef<HTMLHeadingElement>(null);

  // Chegada com âncora (/colecao#meia-noite): o ScrollToTop do app sobe a
  // página ao trocar de rota, então a rolagem até a seção é feita aqui.
  useEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) return;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
    // Só na chegada: cliques internos já rolam por conta própria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quero = useCallback((slug: ClaSlug) => {
    setClaEscolhido(slug);
    rolarPara('lista');
    // Foco no título (não no campo): no celular, focar o campo abriria o
    // teclado no meio da rolagem. Leitor de tela anuncia onde chegou.
    window.setTimeout(() => tituloListaRef.current?.focus({ preventScroll: true }), movimentoReduzido() ? 0 : 450);
  }, []);

  const schema = useMemo(() => JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: SEO_TITULO,
    description: SEO_DESCRICAO,
    url: `${SITE_URL}/colecao`,
    inLanguage: 'pt-BR',
    image: `${SITE_URL}${IMAGENS.fila}`,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Os 5 clãs da Coleção NZPPF 2026',
      numberOfItems: CLAS.length,
      itemListElement: CLAS.map((c, i) => (lancado
        ? {
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Product',
              name: `Camiseta NZPPF Nº ${c.numero} ${c.camisa} · ${c.nome}`,
              image: `${SITE_URL}${imagemCla(c.n, 'costas')}`,
              brand: { '@type': 'Brand', name: 'NZPPF' },
              url: `${SITE_URL}/colecao#${c.slug}`,
              offers: {
                '@type': 'Offer',
                price: PRECO_NUMERO.toFixed(2),
                priceCurrency: 'BRL',
                availability: 'https://schema.org/InStock',
                url: `${SITE_URL}${linkLoja(c)}`,
              },
            },
          }
        : {
            '@type': 'ListItem',
            position: i + 1,
            name: `Nº ${c.numero} · ${c.camisa} · ${c.nome}`,
            url: `${SITE_URL}/colecao#${c.slug}`,
            image: `${SITE_URL}${imagemCla(c.n, 'costas')}`,
          })),
    },
  }), [lancado]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.page}>
        <SEO
          title={SEO_TITULO}
          description={SEO_DESCRICAO}
          keywords="coleção nzppf 2026, camiseta nzppf, os clãs nzppf, camiseta ppf, camiseta carro, nzppf"
          canonicalUrl="/colecao"
          imageUrl={`${SITE_URL}${IMAGENS.fila}`}
          schema={schema}
        />

        <Hero lancado={lancado} onLancou={marcarLancado} />

        {/* ═══ QUAL É O SEU CLÃ? ═══ */}
        <section id="clas" className={styles.escolha} aria-labelledby="clas-titulo">
          <p className={styles.eyebrow}>Os 5 clãs</p>
          <h2 id="clas-titulo" className={styles.secTitulo}>Qual é o seu clã?</h2>
          <p className={styles.intro}>{INTRO}</p>
          <ul className={styles.cartoes}>
            {CLAS.map((c, i) => (
              <motion.li
                key={c.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.06, ease: EASE }}
              >
                <a href={`#${c.slug}`} className={styles.cartao} style={varsCla(c)} onClick={aoClicarAncora(c.slug)}>
                  <img
                    className={styles.cartaoSimbolo}
                    src={imagemCla(c.n, 'simbolo')}
                    alt=""
                    width={720}
                    height={240}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.cartaoNum}>Nº {c.numero} · {c.camisa}</span>
                  <span className={styles.cartaoNome}>{c.nome}</span>
                  <span className={styles.cartaoDica}>{c.dica}</span>
                  <span className={styles.cartaoIr} aria-hidden="true">
                    Ver o clã <ArrowDown size={14} />
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ═══ UMA SEÇÃO POR CLÃ ═══ */}
        {CLAS.map((c, i) => (
          <SecaoCla key={c.slug} cla={c} invertida={i % 2 === 1} lancado={lancado} onQuero={quero} />
        ))}

        <Kit lancado={lancado} />
        <Filme />

        {!lancado && (
          <ListaEspera
            cla={claEscolhido}
            onCla={setClaEscolhido}
            tituloRef={tituloListaRef}
            onLancou={marcarLancado}
          />
        )}

        {lancado && (
          <section className={styles.final} aria-labelledby="final-titulo">
            <p className={styles.eyebrow}>Coleção NZPPF 2026</p>
            <h2 id="final-titulo" className={styles.secTitulo}>Já escolheu o seu clã?</h2>
            <p className={styles.intro}>{PRECO} cada · Tamanhos {TAMANHOS_TEXTO}</p>
            <div className={styles.ctas}>
              <Link to={LOJA_COLECAO_URL} className={`${styles.btn} ${styles.btnPrimario}`}>
                Comprar <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}
      </div>
    </MotionConfig>
  );
}

/* ═══════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════ */

function Hero({ lancado, onLancou }: { lancado: boolean; onLancou: () => void }) {
  // Só o vídeo do formato da tela é baixado (mesmo padrão do /ppf). Em pé =
  // 9:16; deitado = 16:9. Com movimento reduzido fica só o pôster.
  const [midia] = useState(() => ({
    vertical: window.matchMedia('(orientation: portrait)').matches,
    reduzido: movimentoReduzido(),
  }));
  const poster = midia.vertical ? IMAGENS.heroPosterMobile : IMAGENS.heroPosterDesktop;
  const video = midia.vertical ? VIDEOS.heroMobile : VIDEOS.heroDesktop;

  return (
    <header className={styles.hero}>
      {midia.reduzido ? (
        <img
          className={styles.heroMidia}
          src={poster}
          alt=""
          fetchPriority="high"
          decoding="async"
          width={midia.vertical ? 720 : 1280}
          height={midia.vertical ? 1280 : 720}
        />
      ) : (
        <video
          className={styles.heroMidia}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      <div className={styles.heroVeu} aria-hidden="true" />

      <motion.div
        className={styles.heroConteudo}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <p className={styles.eyebrow}>NZPPF Collection · 2026</p>
        <h1 className={styles.heroTitulo}>
          <span className={styles.srOnly}>Coleção NZPPF 2026 · Os Clãs. </span>
          Escolha o seu clã.
        </h1>
        <p className={styles.heroSub}>{SUBTITULO}</p>

        {lancado ? (
          <p className={styles.heroStatus}>
            <span className={styles.heroStatusSelo}>Já disponível</span>
            <span>{PRECO} · {TAMANHOS_TEXTO}</span>
          </p>
        ) : (
          <div className={styles.heroContagem}>
            <p className={styles.heroData}>Lançamento {LANCAMENTO_TEXTO}</p>
            <Contagem
              alvo={LANCAMENTO}
              rotulo={`Contagem regressiva para o lançamento: ${LANCAMENTO_TEXTO}`}
              onFim={onLancou}
            />
          </div>
        )}

        <div className={styles.ctas}>
          {lancado ? (
            <Link to={LOJA_COLECAO_URL} className={`${styles.btn} ${styles.btnPrimario}`}>
              Comprar <ArrowRight size={16} />
            </Link>
          ) : (
            <a href="#lista" className={`${styles.btn} ${styles.btnPrimario}`} onClick={aoClicarAncora('lista')}>
              Entrar na lista
            </a>
          )}
          <a href="#clas" className={`${styles.btn} ${styles.btnSecundario}`} onClick={aoClicarAncora('clas')}>
            Ver os 5 clãs <ArrowDown size={16} />
          </a>
        </div>
      </motion.div>
    </header>
  );
}

/* ═══════════════════════════════════════════
   Seção de um clã
   ═══════════════════════════════════════════ */

function SecaoCla({ cla, invertida, lancado, onQuero }: {
  cla: Cla;
  invertida: boolean;
  lancado: boolean;
  onQuero: (slug: ClaSlug) => void;
}) {
  // A lenda é longa: fechada no celular, aberta no computador.
  const [lendaAberta, setLendaAberta] = useState(
    () => window.matchMedia('(min-width: 1024px)').matches,
  );
  const tituloId = `${cla.slug}-titulo`;

  return (
    <section
      id={cla.slug}
      className={`${styles.cla} ${invertida ? styles.claInvertida : ''}`}
      style={varsCla(cla)}
      aria-labelledby={tituloId}
    >
      <div className={styles.claGrade}>
        <motion.figure
          className={styles.claArte}
          initial={{ opacity: 0, scale: 1.02 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <img
            src={imagemCla(cla.n, 'chave')}
            alt={cla.altChave}
            width={1200}
            height={1494}
            loading="lazy"
            decoding="async"
          />
          <span className={styles.claArteNum} aria-hidden="true">{cla.numero}</span>
        </motion.figure>

        <div className={styles.claTexto}>
          <p className={styles.claNumero}>Nº {cla.numero} · {cla.camisa}</p>
          <h2 id={tituloId} className={styles.claNome}>{cla.nome}</h2>

          <div className={styles.bloco}>
            <h3 className={styles.blocoTitulo}>Quem é do clã</h3>
            <div className={styles.texto}>
              <p>{cla.quem.bom}</p>
              <p><strong>O lado ruim:</strong> {cla.quem.ruim}</p>
            </div>
          </div>

          <div className={styles.bloco}>
            <h3 className={styles.blocoTitulo}>A ficha do clã</h3>
            <dl className={styles.ficha}>
              {FICHA_ROTULOS.map(([chave, rotulo]) => (
                <div key={chave} className={styles.fichaLinha}>
                  <dt>{rotulo}</dt>
                  <dd>{cla.ficha[chave]}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={styles.bloco}>
            <h3 className={styles.blocoTitulo}>A superstição</h3>
            <blockquote className={styles.citacao}>
              <p>{cla.supersticao.frase}</p>
            </blockquote>
            <div className={styles.texto}>
              <p>{comEnfase(cla.supersticao.origem)}</p>
            </div>
          </div>

          <details
            className={styles.lenda}
            open={lendaAberta}
            onToggle={(e) => setLendaAberta(e.currentTarget.open)}
          >
            <summary className={styles.lendaResumo}>
              <span className={styles.blocoTitulo}>A lenda</span>
              <span className={styles.lendaAcao}>
                {lendaAberta ? 'Fechar' : 'Ler a lenda'} <ChevronDown size={16} aria-hidden="true" />
              </span>
            </summary>
            <div className={`${styles.texto} ${styles.lendaCorpo}`}>
              {cla.lenda.map((p, i) => <p key={i}>{comEnfase(p)}</p>)}
            </div>
          </details>

          <div className={styles.claCta}>
            {lancado ? (
              <>
                <Link to={linkLoja(cla)} className={`${styles.btn} ${styles.btnCla}`}>
                  Comprar a Nº {cla.numero} <ArrowRight size={16} />
                </Link>
                <p className={styles.claNota}>
                  <strong className={styles.claPreco}>{PRECO}</strong> · Tamanhos {TAMANHOS_TEXTO}
                </p>
              </>
            ) : (
              <>
                <button type="button" className={`${styles.btn} ${styles.btnCla}`} onClick={() => onQuero(cla.slug)}>
                  Quero ser do {cla.nome}
                </button>
                <p className={styles.claNota}>
                  Lançamento {LANCAMENTO_TEXTO}. Quem está na lista recebe o aviso primeiro.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <Galeria cla={cla} />
    </section>
  );
}

function Galeria({ cla }: { cla: Cla }) {
  const rotulo = `Detalhes da Nº ${cla.numero} ${cla.camisa}`;
  return (
    <div className={styles.galeria}>
      <p className={styles.galeriaTitulo}>Os detalhes da Nº {cla.numero}</p>
      {/* Rola de lado no celular; no computador vira uma grade de 6. */}
      <div className={styles.galeriaRolagem} role="region" aria-label={rotulo} tabIndex={0}>
        <ul className={styles.galeriaLista}>
          {GALERIA.map((g) => (
            <li key={g.tipo}>
              <figure className={styles.galeriaItem}>
                <div className={`${styles.galeriaQuadro} ${g.encaixe === 'conter' ? styles.conter : ''}`}>
                  <img
                    src={imagemCla(cla.n, g.tipo)}
                    alt={g.alt(cla)}
                    width={g.largura}
                    height={g.altura}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption>{g.legenda}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   O kit e o filme
   ═══════════════════════════════════════════ */

function Kit({ lancado }: { lancado: boolean }) {
  return (
    <section className={styles.kit} aria-labelledby="kit-titulo">
      <div className={styles.kitGrade}>
        <div>
          <p className={styles.eyebrow}>O kit</p>
          <h2 id="kit-titulo" className={styles.secTitulo}>O que vem com cada camiseta</h2>
          <ol className={styles.kitLista}>
            {KIT_ITENS.map((k, i) => (
              <li key={k.titulo}>
                <span className={styles.kitNum} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{k.titulo}</strong>
                  <span>{k.detalhe}</span>
                </div>
              </li>
            ))}
          </ol>
          {lancado && <p className={styles.kitPreco}>{PRECO} cada camiseta</p>}
        </div>

        <ul className={styles.kitFotos}>
          {KIT_FOTOS.map((f) => (
            <li key={f.src}>
              <figure>
                <div className={styles.kitQuadro}>
                  <img src={f.src} alt={f.alt} width={1000} height={1768} loading="lazy" decoding="async" />
                </div>
                <figcaption>{f.legenda}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Filme() {
  return (
    <section className={styles.filme} aria-labelledby="filme-titulo">
      <div className={styles.filmeGrade}>
        <div className={styles.filmeTexto}>
          <p className={styles.eyebrow}>O filme</p>
          <h2 id="filme-titulo" className={styles.secTitulo}>Os cinco clãs em 64 segundos.</h2>
          <p className={styles.intro}>Aperte o play com o som ligado.</p>
        </div>
        <div className={styles.filmeQuadro}>
          {/* 6 MB: só baixa quando a pessoa aperta o play. */}
          <video
            className={styles.filmeVideo}
            controls
            playsInline
            preload="none"
            poster={IMAGENS.fila}
            aria-label="Filme da Coleção NZPPF 2026 · Os Clãs, 64 segundos, com som"
          >
            <source src={VIDEOS.filme} type="video/mp4" />
            Seu navegador não reproduz vídeo. <a href={VIDEOS.filme}>Abra o filme aqui</a>.
          </video>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Lista de espera
   ═══════════════════════════════════════════ */

interface Salvo {
  nome: string;
  cla: ClaSlug | '';
  jaEstava: boolean;
}

function lerSalvo(): Salvo | null {
  try {
    const raw = localStorage.getItem(CHAVE_LISTA);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Salvo>;
    return { nome: String(s.nome ?? ''), cla: ehClaSlug(s.cla) ? s.cla : '', jaEstava: true };
  } catch {
    return null;
  }
}

/** Aceita colagem/autopreenchimento com +55 na frente. */
function mascararWhats(valor: string): string {
  const d = valor.replace(/\D/g, '');
  return formatPhone(d.length > 11 && d.startsWith('55') ? d.slice(2) : d);
}

type Campo = 'nome' | 'whats' | 'cla' | 'aceite';

function ListaEspera({ cla, onCla, tituloRef, onLancou }: {
  cla: ClaSlug | '';
  onCla: (slug: ClaSlug | '') => void;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  onLancou: () => void;
}) {
  const [searchParams] = useSearchParams();
  const [nome, setNome] = useState('');
  const [whats, setWhats] = useState('');
  const [aceite, setAceite] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [pronto, setPronto] = useState<Salvo | null>(lerSalvo);

  const enviandoRef = useRef(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const sucessoRef = useRef<HTMLHeadingElement>(null);
  const refs = {
    nome: useRef<HTMLInputElement>(null),
    whats: useRef<HTMLInputElement>(null),
    cla: useRef<HTMLSelectElement>(null),
    aceite: useRef<HTMLInputElement>(null),
  };

  const erros: Record<Campo, string> = {
    nome: nome.trim().length < 2 ? 'Escreva seu nome.' : '',
    whats: !whats ? 'Digite seu WhatsApp com DDD.' : !isValidPhone(whats) ? 'Confira o número: DDD e mais 8 ou 9 dígitos.' : '',
    cla: !cla ? 'Escolha o seu clã.' : '',
    aceite: !aceite ? 'Marque a autorização para receber o aviso.' : '',
  };
  const mostrar = (c: Campo) => (tentou ? erros[c] : '');

  const claDoCartao = CLA_POR_SLUG[(pronto?.cla || cla) as ClaSlug];

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current) return;
    setTentou(true);
    setErroEnvio('');

    const primeiro = (['nome', 'whats', 'cla', 'aceite'] as const).find((c) => erros[c]);
    if (primeiro) {
      refs[primeiro].current?.focus();
      return;
    }

    const concluir = (jaEstava: boolean) => {
      const salvo: Salvo = { nome: nome.trim().split(/\s+/)[0] ?? '', cla, jaEstava };
      try {
        localStorage.setItem(CHAVE_LISTA, JSON.stringify({ nome: salvo.nome, cla: salvo.cla }));
      } catch { /* modo privado — só conveniência */ }
      setPronto(salvo);
      window.setTimeout(() => sucessoRef.current?.focus({ preventScroll: true }), 0);
    };

    // Honeypot preenchido = robô. Sucesso falso, nada gravado.
    if (honeypotRef.current?.value) {
      concluir(false);
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const payload = {
        nome: nome.trim().slice(0, 120),
        whatsapp: toE164(whats),
        cla,
        origem: (searchParams.get('utm_source') || 'site').slice(0, 80),
        utm_campaign: searchParams.get('utm_campaign')?.slice(0, 120) || null,
      };
      // supabase-js resolve (não lança) em erro de RLS/rede — o `error`
      // precisa ser conferido, senão um lead perdido mostraria sucesso.
      const { error } = await supabase.from(TABELA_LEADS).insert([payload]);
      if (error && error.code !== '23505') throw error;
      // 23505 = número já cadastrado: para a pessoa, ela está na lista.
      concluir(error?.code === '23505');
    } catch (err) {
      console.error('[Colecao] lista de espera', err);
      setErroEnvio('Não conseguimos registrar agora. Confira sua conexão e toque em "Entrar na lista" de novo.');
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const outroNumero = () => {
    setPronto(null);
    setNome('');
    setWhats('');
    setAceite(false);
    setTentou(false);
    window.setTimeout(() => refs.nome.current?.focus(), 0);
  };

  return (
    <section id="lista" className={styles.lista} aria-labelledby="lista-titulo">
      <div className={styles.listaGrade}>
        <div className={styles.listaTexto}>
          <p className={styles.eyebrow}>Lista de espera</p>
          <h2 id="lista-titulo" ref={tituloRef} tabIndex={-1} className={`${styles.secTitulo} ${styles.semFoco}`}>
            Entre na lista.
          </h2>
          <p className={styles.intro}>
            A coleção abre {LANCAMENTO_TEXTO}. Quem está na lista recebe o aviso primeiro, no WhatsApp.
          </p>
          <Contagem
            className={styles.listaContagem}
            alvo={LANCAMENTO}
            rotulo={`Contagem regressiva para o lançamento: ${LANCAMENTO_TEXTO}`}
            onFim={onLancou}
          />
        </div>

        <div className={styles.listaCartao} style={varsCla(claDoCartao)}>
          {pronto ? (
            <div className={styles.sucesso} role="status">
              <span className={styles.sucessoIcone} aria-hidden="true"><Check size={28} strokeWidth={3} /></span>
              <h3 ref={sucessoRef} tabIndex={-1} className={`${styles.sucessoTitulo} ${styles.semFoco}`}>
                {pronto.jaEstava
                  ? `${pronto.nome ? `${pronto.nome}, você` : 'Você'} já está na lista.`
                  : 'Você está na lista.'}
              </h3>
              <p>No dia {LANCAMENTO_DIA} às 18h você recebe o aviso primeiro.</p>
              {pronto.cla && (
                <p className={styles.sucessoCla}>Seu clã: <strong>{CLA_POR_SLUG[pronto.cla].nome}</strong></p>
              )}
              <button type="button" className={styles.linkTexto} onClick={outroNumero}>
                Cadastrar outro número
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={enviar} noValidate>
              {/* Honeypot — fora da tela, nunca focável */}
              <input
                ref={honeypotRef}
                type="text"
                name="empresa_site"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                className={styles.honeypot}
              />

              <div className={styles.campo}>
                <label htmlFor="lista-nome">Nome</label>
                <input
                  id="lista-nome"
                  ref={refs.nome}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como você se chama?"
                  autoComplete="name"
                  autoCapitalize="words"
                  maxLength={120}
                  aria-invalid={!!mostrar('nome')}
                  aria-describedby={mostrar('nome') ? 'lista-nome-erro' : undefined}
                />
                {mostrar('nome') && <p id="lista-nome-erro" className={styles.campoErro}>{erros.nome}</p>}
              </div>

              <div className={styles.campo}>
                <label htmlFor="lista-whats">WhatsApp</label>
                <input
                  id="lista-whats"
                  ref={refs.whats}
                  type="tel"
                  inputMode="numeric"
                  value={whats}
                  onChange={(e) => setWhats(mascararWhats(e.target.value))}
                  placeholder="(11) 90000-0000"
                  autoComplete="tel-national"
                  aria-invalid={!!mostrar('whats')}
                  aria-describedby={mostrar('whats') ? 'lista-whats-erro' : undefined}
                />
                {mostrar('whats') && <p id="lista-whats-erro" className={styles.campoErro}>{erros.whats}</p>}
              </div>

              <div className={styles.campo}>
                <label htmlFor="lista-cla">Clã favorito</label>
                <div className={styles.selectCaixa}>
                  <select
                    id="lista-cla"
                    ref={refs.cla}
                    value={cla}
                    onChange={(e) => onCla(ehClaSlug(e.target.value) ? e.target.value : '')}
                    aria-invalid={!!mostrar('cla')}
                    aria-describedby={mostrar('cla') ? 'lista-cla-erro' : undefined}
                  >
                    <option value="" disabled>Escolha o seu clã</option>
                    {CLAS.map((c) => (
                      <option key={c.slug} value={c.slug}>Nº {c.numero} · {c.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" />
                </div>
                {mostrar('cla') && <p id="lista-cla-erro" className={styles.campoErro}>{erros.cla}</p>}
              </div>

              <div className={styles.aceite}>
                <input
                  id="lista-aceite"
                  ref={refs.aceite}
                  type="checkbox"
                  checked={aceite}
                  onChange={(e) => setAceite(e.target.checked)}
                  aria-invalid={!!mostrar('aceite')}
                  aria-describedby={mostrar('aceite') ? 'lista-aceite-erro' : undefined}
                />
                <label htmlFor="lista-aceite">
                  Quero receber o aviso do lançamento no WhatsApp e autorizo a NZ Group a guardar meu nome e
                  meu número para isso.
                </label>
              </div>
              {mostrar('aceite') && <p id="lista-aceite-erro" className={styles.campoErro}>{erros.aceite}</p>}

              <p className={styles.privacidade}>
                Veja como cuidamos dos seus dados na <Link to="/privacidade">política de privacidade</Link>.
              </p>

              {erroEnvio && (
                <div className={styles.formErro} role="alert">
                  <CircleAlert size={16} aria-hidden="true" />
                  <span>{erroEnvio}</span>
                </div>
              )}

              <button
                type="submit"
                className={`${styles.btn} ${claDoCartao ? styles.btnCla : styles.btnPrimario} ${styles.btnEnviar}`}
                disabled={enviando}
                aria-busy={enviando}
              >
                {enviando
                  ? (<><LoaderCircle size={16} className={styles.girando} aria-hidden="true" /> Enviando...</>)
                  : 'Entrar na lista'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
