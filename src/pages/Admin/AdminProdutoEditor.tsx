// /admin/produtos/:slug (e /novo) — o cadastro do produto da loja.
//
// Era uma gaveta sobreposta à lista: o fundo rolava junto, F5 perdia tudo, não
// havia link para mandar a alguém e só a foto de capa era editável. Agora é
// página com endereço, dividida em abas, com a pré-visualização do card ao lado
// e barra de salvar fixa (Ctrl+S).
//
// O que é do ERP (SKU, nome oficial, preço, estoque) continua somente leitura —
// muda pelo sync. Aqui se edita o editorial: como o produto aparece na loja.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LINHA_LABEL } from '../../lib/shop/erp/mapa';
import { recarregarCatalogo } from '../../lib/shop/store';
import GaleriaEditor from '../../components/Admin/GaleriaEditor';
import { avaliarConjunto, type Midia } from '../../lib/admin/midia';
import styles from './AdminProdutoEditor.module.css';
import admin from './Admin.module.css';

type Aba = 'dados' | 'midia' | 'ficha' | 'erp' | 'seo';

interface FichaItem {
  label: string;
  value: string;
}

interface Produto {
  id: string;
  slug: string;
  erp_sku: string | null;
  tipo_vinculo: 'proprio' | 'alias' | 'familia' | 'pendente';
  alias_de: string | null;
  alias_nota: string | null;
  nome: string;
  subtitulo: string | null;
  marca_exibicao: string | null;
  linha_key: string;
  linha_label: string | null;
  vertical: 'PPF' | 'WRAP' | 'SIGN' | 'DECOR';
  kind: 'cor' | 'padrao' | 'linha';
  codigo: string | null;
  imagem: string | null;
  hex: string | null;
  acabamento_label: string | null;
  acabamentos: string[] | null;
  aplicacoes: string[] | null;
  badges: string[] | null;
  ficha: FichaItem[] | null;
  descricao: string | null;
  garantia_anos: number | null;
  durabilidade_anos: number | null;
  publicado: boolean;
  oculto_manual: boolean;
  ordem: number;
  origem: 'editorial' | 'erp-auto' | 'manual';
  seo_titulo: string | null;
  seo_descricao: string | null;
  atualizado_em: string;
}

interface Erp {
  sku: string;
  nome: string | null;
  marca: string | null;
  ativo: boolean;
  removido_no_erp: boolean;
  saldo_ml: number;
  rolos_fechados: number;
  rolos_abertos: number;
  preco_rolo: number | null;
  preco_metro: number | null;
  metragem_padrao: number | null;
  largura_m: number | null;
  unidade: string | null;
}

const CAMPOS =
  'id, slug, erp_sku, tipo_vinculo, alias_de, alias_nota, nome, subtitulo, marca_exibicao, linha_key, linha_label, vertical, kind, codigo, imagem, hex, acabamento_label, acabamentos, aplicacoes, badges, ficha, descricao, garantia_anos, durabilidade_anos, publicado, oculto_manual, ordem, origem, seo_titulo, seo_descricao, atualizado_em';

const ACABAMENTOS = ['brilhante', 'fosco', 'acetinado', 'metalico', 'solido', 'camaleao', 'transparente', 'texturizado'] as const;
const APLICACOES: { id: string; label: string }[] = [
  { id: 'automotivo', label: 'Automotivo' },
  { id: 'arquitetonico', label: 'Arquitetônico' },
  { id: 'comunicacao-visual', label: 'Comunicação visual' },
];
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const CHAVE_FILA = 'nz:admin:fila-produtos';

const VAZIO = (): Produto => ({
  id: '',
  slug: '',
  erp_sku: null,
  tipo_vinculo: 'pendente',
  alias_de: null,
  alias_nota: null,
  nome: '',
  subtitulo: null,
  marca_exibicao: null,
  linha_key: 'diversos',
  linha_label: null,
  vertical: 'WRAP',
  kind: 'cor',
  codigo: null,
  imagem: null,
  hex: null,
  acabamento_label: null,
  acabamentos: [],
  aplicacoes: [],
  badges: [],
  ficha: [],
  descricao: null,
  garantia_anos: null,
  durabilidade_anos: null,
  publicado: false,
  oculto_manual: false,
  ordem: 0,
  origem: 'manual',
  seo_titulo: null,
  seo_descricao: null,
  atualizado_em: '',
});

function paraSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export default function AdminProdutoEditor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const criando = !slug;

  const [p, setP] = useState<Produto>(VAZIO);
  const [original, setOriginal] = useState<Produto | null>(null);
  const [erp, setErp] = useState<Erp | null>(null);
  const [aba, setAba] = useState<Aba>('dados');
  const [carregando, setCarregando] = useState(!criando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [midias, setMidias] = useState<Midia[]>([]);
  const [buscaSku, setBuscaSku] = useState('');
  const [skus, setSkus] = useState<Erp[]>([]);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------- carregar
  const carregar = useCallback(async () => {
    if (criando) {
      setP(VAZIO());
      setOriginal(VAZIO());
      setCarregando(false);
      return;
    }
    const { data, error } = await supabase.from('produtos').select(CAMPOS).eq('slug', slug).maybeSingle();
    if (error || !data) {
      setErro(error?.message ?? 'Produto não encontrado.');
      setCarregando(false);
      return;
    }
    const row = data as unknown as Produto;
    row.acabamentos = row.acabamentos ?? [];
    row.aplicacoes = row.aplicacoes ?? [];
    row.badges = row.badges ?? [];
    row.ficha = Array.isArray(row.ficha) ? row.ficha : [];
    setP(row);
    setOriginal(row);
    setCarregando(false);
  }, [slug, criando]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Espelho do ERP para o SKU atual.
  useEffect(() => {
    const sku = p.erp_sku;
    if (!sku) {
      setErp(null);
      return;
    }
    let vivo = true;
    void supabase
      .from('erp_produtos')
      .select('sku, nome, marca, ativo, removido_no_erp, saldo_ml, rolos_fechados, rolos_abertos, preco_rolo, preco_metro, metragem_padrao, largura_m, unidade')
      .eq('sku', sku)
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setErp((data as Erp | null) ?? null);
      });
    return () => {
      vivo = false;
    };
  }, [p.erp_sku]);

  // Busca de SKU no servidor — nada de datalist com 1.500 opções.
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = buscaSku.trim();
      if (q.length < 2) {
        setSkus([]);
        return;
      }
      const { data } = await supabase
        .from('erp_produtos')
        .select('sku, nome, marca, ativo, removido_no_erp, saldo_ml, rolos_fechados, rolos_abertos, preco_rolo, preco_metro, metragem_padrao, largura_m, unidade')
        .or(`sku.ilike.%${q}%,nome.ilike.%${q}%`)
        .limit(12);
      setSkus((data ?? []) as Erp[]);
    }, 250);
    return () => clearTimeout(t);
  }, [buscaSku]);

  const mudou = useMemo(() => original !== null && JSON.stringify(p) !== JSON.stringify(original), [p, original]);

  // Sair com alteração pendente avisa (aba fechando/atualizando).
  useEffect(() => {
    if (!mudou) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [mudou]);

  const set = <K extends keyof Produto>(k: K, v: Produto[K]) => setP((x) => ({ ...x, [k]: v }));

  // ------------------------------------------------------------ salvar
  const salvar = useCallback(async (): Promise<string | null> => {
    setErro('');
    setAviso('');
    if (!p.nome.trim()) {
      setErro('O nome de exibição é obrigatório.');
      setAba('dados');
      return null;
    }
    const sku = (p.erp_sku ?? '').trim().toUpperCase() || null;
    let vinculo = p.tipo_vinculo;
    if (vinculo !== 'familia') {
      if (!sku) vinculo = 'pendente';
      else if (vinculo === 'pendente') vinculo = 'proprio';
      if (vinculo === 'alias' && !p.alias_de) vinculo = 'proprio';
    }

    const patch: Record<string, unknown> = {
      nome: p.nome.trim(),
      subtitulo: p.subtitulo?.trim() || null,
      marca_exibicao: p.marca_exibicao?.trim() || null,
      codigo: p.codigo?.trim() || null,
      linha_key: p.linha_key,
      linha_label: LINHA_LABEL[p.linha_key as keyof typeof LINHA_LABEL] ?? p.linha_key,
      vertical: p.vertical,
      kind: p.kind,
      hex: p.hex?.trim() || null,
      acabamento_label: p.acabamento_label?.trim() || null,
      acabamentos: p.acabamentos ?? [],
      aplicacoes: p.aplicacoes ?? [],
      badges: p.badges ?? [],
      ficha: (p.ficha ?? []).filter((f) => f.label.trim() && f.value.trim()),
      descricao: p.descricao?.trim() || null,
      garantia_anos: p.garantia_anos ?? null,
      durabilidade_anos: p.durabilidade_anos ?? null,
      erp_sku: vinculo === 'familia' ? null : sku,
      tipo_vinculo: vinculo,
      alias_de: vinculo === 'alias' ? p.alias_de : null,
      alias_nota: vinculo === 'alias' ? p.alias_nota?.trim() || null : null,
      // O CHECK do banco recusa publicar sem SKU; adianta a regra aqui.
      publicado: vinculo === 'familia' ? p.publicado : p.publicado && Boolean(sku),
      oculto_manual: p.oculto_manual,
      ordem: Number(p.ordem) || 0,
      seo_titulo: p.seo_titulo?.trim() || null,
      seo_descricao: p.seo_descricao?.trim() || null,
    };

    setSalvando(true);
    try {
      if (criando) {
        const novoSlug = p.slug.trim() || paraSlug(p.nome);
        if (!novoSlug) {
          setErro('Não consegui montar o endereço (slug) a partir do nome.');
          return null;
        }
        const { error } = await supabase.from('produtos').insert({ ...patch, slug: novoSlug, origem: 'manual', criado_por: user?.id ?? null });
        if (error) {
          setErro(error.code === '23505' ? `Já existe produto com o endereço "${novoSlug}".` : error.message);
          return null;
        }
        void recarregarCatalogo();
        return novoSlug;
      }
      const { error } = await supabase.from('produtos').update(patch).eq('id', p.id);
      if (error) {
        setErro(error.message);
        return null;
      }
      void recarregarCatalogo();
      return p.slug;
    } finally {
      setSalvando(false);
    }
  }, [p, criando, user]);

  const salvarEFicar = useCallback(async () => {
    const s = await salvar();
    if (!s) return;
    if (criando) {
      navigate(`/admin/produtos/${s}`, { replace: true });
      return;
    }
    await carregar();
    setAviso('Salvo.');
    setTimeout(() => setAviso(''), 2500);
  }, [salvar, criando, navigate, carregar]);

  // Ctrl+S salva sem tirar a mão do teclado (cadastro em série).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void salvarEFicar();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [salvarEFicar]);

  /** A lista guarda a fila filtrada; aqui só andamos nela. */
  const proximoDaFila = (): string | null => {
    try {
      const fila = JSON.parse(sessionStorage.getItem(CHAVE_FILA) ?? '[]') as string[];
      const i = fila.indexOf(slug ?? '');
      return i >= 0 && i + 1 < fila.length ? fila[i + 1] : null;
    } catch {
      return null;
    }
  };

  const salvarEProximo = async () => {
    const s = await salvar();
    if (!s) return;
    const prox = proximoDaFila();
    navigate(prox ? `/admin/produtos/${prox}` : '/admin/produtos');
  };

  const sair = () => {
    if (mudou && !confirm('Você tem alterações não salvas. Sair mesmo assim?')) return;
    navigate('/admin/produtos');
  };

  const apagar = async () => {
    if (p.origem === 'erp-auto') {
      setErro('Produto criado pelo ERP não se apaga — use "oculto à mão".');
      return;
    }
    if (!confirm(`Apagar "${p.nome}" definitivamente? A mídia enviada também some.`)) return;
    const { error } = await supabase.from('produtos').delete().eq('id', p.id);
    if (error) {
      setErro(error.message);
      return;
    }
    void recarregarCatalogo();
    navigate('/admin/produtos');
  };

  const duplicar = async () => {
    const base = `${p.nome} (cópia)`;
    const novoSlug = `${p.slug}-copia`;
    const { error } = await supabase.from('produtos').insert({
      slug: novoSlug,
      nome: base,
      subtitulo: p.subtitulo,
      marca_exibicao: p.marca_exibicao,
      linha_key: p.linha_key,
      linha_label: p.linha_label,
      vertical: p.vertical,
      kind: p.kind,
      acabamento_label: p.acabamento_label,
      acabamentos: p.acabamentos ?? [],
      aplicacoes: p.aplicacoes ?? [],
      badges: p.badges ?? [],
      ficha: p.ficha ?? [],
      descricao: p.descricao,
      garantia_anos: p.garantia_anos,
      durabilidade_anos: p.durabilidade_anos,
      tipo_vinculo: 'pendente',
      publicado: false,
      origem: 'manual',
      criado_por: user?.id ?? null,
    });
    if (error) {
      setErro(error.code === '23505' ? 'Já existe uma cópia deste produto.' : error.message);
      return;
    }
    navigate(`/admin/produtos/${novoSlug}`);
  };

  // -------------------------------------------------------------- ficha
  const fichaSet = (i: number, campo: keyof FichaItem, valor: string) =>
    setP((x) => ({ ...x, ficha: (x.ficha ?? []).map((f, j) => (j === i ? { ...f, [campo]: valor } : f)) }));
  const fichaAdd = () => setP((x) => ({ ...x, ficha: [...(x.ficha ?? []), { label: '', value: '' }] }));
  const fichaDel = (i: number) => setP((x) => ({ ...x, ficha: (x.ficha ?? []).filter((_, j) => j !== i) }));
  const fichaMover = (i: number, passo: number) =>
    setP((x) => {
      const lista = [...(x.ficha ?? [])];
      const j = i + passo;
      if (j < 0 || j >= lista.length) return x;
      [lista[i], lista[j]] = [lista[j], lista[i]];
      return { ...x, ficha: lista };
    });

  const puxarDoErp = () => {
    if (!erp) return;
    const novas: FichaItem[] = [];
    if (erp.largura_m) novas.push({ label: 'Largura', value: `${Number(erp.largura_m).toLocaleString('pt-BR')} m` });
    if (erp.metragem_padrao) novas.push({ label: 'Rolo fechado', value: `${Number(erp.metragem_padrao).toLocaleString('pt-BR')} m` });
    if (p.acabamento_label) novas.push({ label: 'Acabamento', value: p.acabamento_label });
    if (p.codigo) novas.push({ label: 'Código', value: p.codigo });
    setP((x) => {
      const atual = x.ficha ?? [];
      const faltando = novas.filter((n) => !atual.some((f) => f.label.toLowerCase() === n.label.toLowerCase()));
      return { ...x, ficha: [...atual, ...faltando] };
    });
  };

  const sugerirSeo = () => {
    const linha = LINHA_LABEL[p.linha_key as keyof typeof LINHA_LABEL] ?? p.linha_key;
    const titulo = `${p.nome}${p.codigo ? ` · ${p.codigo}` : ''} — ${linha} | NZ Group`.slice(0, 60);
    const desc = `${p.nome}${p.acabamento_label ? `, ${p.acabamento_label.toLowerCase()}` : ''}, da linha ${linha}. ${
      p.descricao?.trim() || 'Rolo fechado ou metro fracionado, com envio para todo o Brasil.'
    }`
      .replace(/\s+/g, ' ')
      .slice(0, 158);
    setP((x) => ({ ...x, seo_titulo: titulo, seo_descricao: desc }));
  };

  // ------------------------------------------------------------ render
  if (carregando) return <p style={{ color: '#a1a1a6' }}>Carregando produto…</p>;
  if (!criando && !p.id) return <div className={styles.erro}>{erro || 'Produto não encontrado.'}</div>;

  const capa = midias.find((m) => m.capa && m.tipo === 'imagem') ?? midias.find((m) => m.tipo === 'imagem');
  const fotoPreview = capa?.url ?? p.imagem;
  const avisosMidia = avaliarConjunto(midias);
  const visivel = p.publicado && !p.oculto_manual && (p.tipo_vinculo === 'familia' || Boolean(erp?.ativo));
  const linhaLabel = LINHA_LABEL[p.linha_key as keyof typeof LINHA_LABEL] ?? p.linha_key;

  const alternar = (lista: string[] | null, valor: string): string[] => {
    const atual = lista ?? [];
    return atual.includes(valor) ? atual.filter((x) => x !== valor) : [...atual, valor];
  };

  return (
    <div>
      <div className={styles.topo}>
        <button type="button" className={styles.voltar} onClick={sair}>
          ← Produtos
        </button>
        <span className={styles.migalha}>{criando ? 'Novo produto' : `/loja/${p.slug}`}</span>
        {!criando && (
          <>
            <span className={`${styles.chipEstado} ${visivel ? styles.chipVisivel : styles.chipFora}`}>
              {visivel ? 'visível na loja' : p.oculto_manual ? 'oculto' : 'fora da loja'}
            </span>
            <a className={styles.voltar} href={`/loja/${p.slug}`} target="_blank" rel="noopener noreferrer">
              ver no site ↗
            </a>
          </>
        )}
      </div>

      {erro && <div className={styles.erro}>{erro}</div>}

      <div className={styles.abas}>
        {([
          ['dados', 'Dados'],
          ['midia', 'Mídia'],
          ['ficha', 'Ficha'],
          ['erp', 'ERP'],
          ['seo', 'SEO'],
        ] as [Aba, string][]).map(([id, rotulo]) => {
          const pendente = (id === 'midia' && avisosMidia.length > 0) || (id === 'seo' && !p.seo_titulo);
          return (
            <button key={id} type="button" className={`${styles.aba} ${aba === id ? styles.abaAtiva : ''}`} onClick={() => setAba(id)}>
              {rotulo}
              {/* Decorativo: fora do nome acessível da aba. */}
              {pendente && (
                <span className={styles.abaPonto} aria-hidden="true">
                  •
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.pagina}>
        <div>
          {/* ------------------------------------------------- dados */}
          {aba === 'dados' && (
            <>
              <section className={styles.secao}>
                <h3 className={styles.secaoTitulo}>Identificação</h3>
                <div className={styles.grade}>
                  <div className={`${styles.campo} ${styles.largo}`}>
                    <label htmlFor="nome">Nome de exibição</label>
                    <input id="nome" ref={primeiroCampo} value={p.nome} onChange={(e) => set('nome', e.target.value)} />
                  </div>
                  {criando && (
                    <div className={`${styles.campo} ${styles.largo}`}>
                      <label htmlFor="slug">Endereço na loja</label>
                      <input id="slug" value={p.slug} onChange={(e) => set('slug', paraSlug(e.target.value))} placeholder={paraSlug(p.nome) || 'gerado-do-nome'} />
                      <p className={styles.ajuda}>/loja/{p.slug || paraSlug(p.nome) || '…'} — não muda depois de criado.</p>
                    </div>
                  )}
                  <div className={styles.campo}>
                    <label htmlFor="subtitulo">Subtítulo</label>
                    <input id="subtitulo" value={p.subtitulo ?? ''} onChange={(e) => set('subtitulo', e.target.value)} />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="codigo">Código no card</label>
                    <input id="codigo" value={p.codigo ?? ''} onChange={(e) => set('codigo', e.target.value)} />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="marca">Marca exibida</label>
                    <input id="marca" value={p.marca_exibicao ?? ''} onChange={(e) => set('marca_exibicao', e.target.value)} />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="linha">Linha</label>
                    <select id="linha" value={p.linha_key} onChange={(e) => set('linha_key', e.target.value)}>
                      {Object.entries(LINHA_LABEL).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="vertical">Vertical</label>
                    <select id="vertical" value={p.vertical} onChange={(e) => set('vertical', e.target.value as Produto['vertical'])}>
                      <option value="WRAP">NZWRAP</option>
                      <option value="DECOR">NZDECOR</option>
                      <option value="SIGN">NZSIGN</option>
                      <option value="PPF">NZPPF</option>
                    </select>
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="kind">Tipo</label>
                    <select id="kind" value={p.kind} onChange={(e) => set('kind', e.target.value as Produto['kind'])}>
                      <option value="cor">Cor</option>
                      <option value="padrao">Padrão</option>
                      <option value="linha">Linha técnica</option>
                    </select>
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="ordem">Ordem na vitrine</label>
                    <input id="ordem" type="number" value={p.ordem} onChange={(e) => set('ordem', Number(e.target.value) || 0)} />
                  </div>
                </div>
              </section>

              <section className={styles.secao}>
                <h3 className={styles.secaoTitulo}>Cor e acabamento</h3>
                <div className={styles.grade}>
                  <div className={styles.campo}>
                    <label htmlFor="hex">Cor (hex)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        aria-label="Escolher cor"
                        value={/^#[0-9a-f]{6}$/i.test(p.hex ?? '') ? (p.hex as string) : '#000000'}
                        onChange={(e) => set('hex', e.target.value)}
                        style={{ width: 48, minHeight: 42, padding: 0, border: 'none', background: 'transparent' }}
                      />
                      <input id="hex" value={p.hex ?? ''} onChange={(e) => set('hex', e.target.value)} placeholder="#ab071c" />
                    </div>
                    <p className={styles.ajuda}>Sem foto, é este quadrado que a loja mostra.</p>
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="acab">Acabamento (rótulo)</label>
                    <input id="acab" value={p.acabamento_label ?? ''} onChange={(e) => set('acabamento_label', e.target.value)} placeholder="Ex.: Metálico Fosco" />
                  </div>
                  <div className={`${styles.campo} ${styles.largo}`}>
                    <span>Acabamentos (filtro da loja)</span>
                    <div className={styles.chips}>
                      {ACABAMENTOS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={`${styles.chip} ${(p.acabamentos ?? []).includes(a) ? styles.chipAtivo : ''}`}
                          onClick={() => set('acabamentos', alternar(p.acabamentos, a))}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`${styles.campo} ${styles.largo}`}>
                    <span>Aplicações</span>
                    <div className={styles.chips}>
                      {APLICACOES.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className={`${styles.chip} ${(p.aplicacoes ?? []).includes(a.id) ? styles.chipAtivo : ''}`}
                          onClick={() => set('aplicacoes', alternar(p.aplicacoes, a.id))}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.secao}>
                <h3 className={styles.secaoTitulo}>Texto e selos</h3>
                <div className={styles.grade}>
                  <div className={`${styles.campo} ${styles.largo}`}>
                    <label htmlFor="descricao">Descrição</label>
                    <textarea id="descricao" value={p.descricao ?? ''} onChange={(e) => set('descricao', e.target.value)} />
                    <p className={styles.ajuda}>Duas ou três frases sobre uso, aparência e onde a cor funciona melhor.</p>
                  </div>
                  <div className={`${styles.campo} ${styles.largo}`}>
                    <span>Selos (badges do card)</span>
                    <div className={styles.chips}>
                      {(p.badges ?? []).map((b) => (
                        <span key={b} className={styles.chipRemover}>
                          {b}
                          <button type="button" onClick={() => set('badges', (p.badges ?? []).filter((x) => x !== b))} aria-label={`Remover ${b}`}>
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        placeholder="+ novo selo, Enter"
                        style={{ minHeight: 32, maxWidth: 200 }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const v = e.currentTarget.value.trim().toUpperCase();
                          if (v && !(p.badges ?? []).includes(v)) set('badges', [...(p.badges ?? []), v]);
                          e.currentTarget.value = '';
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="garantia">Garantia (anos)</label>
                    <input id="garantia" type="number" value={p.garantia_anos ?? ''} onChange={(e) => set('garantia_anos', e.target.value === '' ? null : Number(e.target.value))} />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="durab">Durabilidade (anos)</label>
                    <input id="durab" type="number" value={p.durabilidade_anos ?? ''} onChange={(e) => set('durabilidade_anos', e.target.value === '' ? null : Number(e.target.value))} />
                  </div>
                </div>
              </section>

              <section className={styles.secao}>
                <h3 className={styles.secaoTitulo}>Publicação</h3>
                <div className={styles.interruptores}>
                  <label className={styles.interruptor}>
                    <input type="checkbox" checked={p.publicado} onChange={(e) => set('publicado', e.target.checked)} />
                    Publicado
                  </label>
                  <label className={styles.interruptor}>
                    <input type="checkbox" checked={p.oculto_manual} onChange={(e) => set('oculto_manual', e.target.checked)} />
                    Oculto à mão
                  </label>
                </div>
                <p className={styles.ajuda} style={{ marginTop: '0.6rem' }}>
                  Aparece na loja quando está publicado, não oculto e com o SKU ativo no NZERP.
                </p>
              </section>
            </>
          )}

          {/* -------------------------------------------------- mídia */}
          {aba === 'midia' &&
            (criando ? (
              <section className={styles.secao}>
                <p className={styles.ajuda}>Salve o produto primeiro; depois dá para subir as fotos e os vídeos.</p>
              </section>
            ) : (
              <GaleriaEditor produtoId={p.id} slug={p.slug} onMudou={setMidias} />
            ))}

          {/* -------------------------------------------------- ficha */}
          {aba === 'ficha' && (
            <section className={styles.secao}>
              <h3 className={styles.secaoTitulo}>Ficha técnica</h3>
              <p className={styles.ajuda} style={{ marginBottom: '0.8rem' }}>
                É a tabela que aparece na página do produto. Sem nada aqui, a loja monta uma ficha simples com código, acabamento e cor.
              </p>
              {(p.ficha ?? []).map((f, i) => (
                <div key={i} className={styles.fichaLinha}>
                  <input value={f.label} onChange={(e) => fichaSet(i, 'label', e.target.value)} placeholder="Rótulo (ex.: Largura)" />
                  <input value={f.value} onChange={(e) => fichaSet(i, 'value', e.target.value)} placeholder="Valor (ex.: 1,52 m)" />
                  <div className={styles.fichaAcoes}>
                    <button type="button" className={admin.actionBtn} onClick={() => fichaMover(i, -1)} disabled={i === 0}>
                      ↑
                    </button>
                    <button type="button" className={admin.actionBtn} onClick={() => fichaMover(i, 1)} disabled={i === (p.ficha ?? []).length - 1}>
                      ↓
                    </button>
                    <button type="button" className={`${admin.actionBtn} ${admin.actionBtnDeny}`} onClick={() => fichaDel(i)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem', flexWrap: 'wrap' }}>
                <button type="button" className={styles.secundario} onClick={fichaAdd}>
                  + Linha
                </button>
                <button type="button" className={styles.secundario} onClick={puxarDoErp} disabled={!erp}>
                  Puxar do ERP
                </button>
              </div>
            </section>
          )}

          {/* ---------------------------------------------------- ERP */}
          {aba === 'erp' && (
            <>
              <section className={styles.secao}>
                <h3 className={styles.secaoTitulo}>NZERP · somente leitura</h3>
                <div className={styles.erpCaixa}>
                  {erp ? (
                    <>
                      <strong>{erp.nome}</strong> · {erp.marca} · {erp.ativo ? 'ativo' : 'INATIVO'}
                      {erp.removido_no_erp ? ' · removido do ERP' : ''}
                      <br />
                      Rolo {erp.preco_rolo ? BRL.format(Number(erp.preco_rolo)) : '—'} · Metro{' '}
                      {erp.preco_metro ? `${BRL.format(Number(erp.preco_metro))}/m` : '—'} · Rolo padrão {erp.metragem_padrao ?? '—'} m ·
                      Largura {erp.largura_m ?? '—'} m
                      <br />
                      Estoque SP: {Number(erp.saldo_ml).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m · {erp.rolos_fechados} fechado(s) ·{' '}
                      {erp.rolos_abertos} aberto(s) →{' '}
                      <strong style={{ color: Number(erp.saldo_ml) > 0 ? '#25D366' : '#f5a623' }}>
                        {Number(erp.saldo_ml) > 0 ? 'ESTOQUE' : 'DROP'}
                      </strong>
                    </>
                  ) : p.erp_sku ? (
                    <span style={{ color: '#f5a623' }}>O SKU {p.erp_sku} não está no espelho do ERP. Confira a grafia ou rode o sync.</span>
                  ) : (
                    <span style={{ color: '#f5a623' }}>Sem SKU conectado — o produto não aparece na loja.</span>
                  )}
                </div>
              </section>

              <section className={styles.secao}>
                <h3 className={styles.secaoTitulo}>Vínculo</h3>
                <div className={styles.grade}>
                  <div className={styles.campo}>
                    <label htmlFor="sku">SKU no NZERP</label>
                    <input id="sku" value={p.erp_sku ?? ''} onChange={(e) => set('erp_sku', e.target.value.toUpperCase())} disabled={p.tipo_vinculo === 'familia'} />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="vinculo">Tipo de vínculo</label>
                    <select
                      id="vinculo"
                      value={p.tipo_vinculo}
                      onChange={(e) => set('tipo_vinculo', e.target.value as Produto['tipo_vinculo'])}
                      disabled={p.tipo_vinculo === 'familia'}
                    >
                      <option value="proprio">Próprio — este produto É o SKU</option>
                      <option value="alias">Alias — mesmo rolo de outro produto</option>
                      <option value="pendente">Pendente — sem conexão (não publica)</option>
                      {p.tipo_vinculo === 'familia' && <option value="familia">Família (página de linha)</option>}
                    </select>
                  </div>
                  <div className={`${styles.campo} ${styles.largo}`}>
                    <label htmlFor="buscasku">Procurar SKU</label>
                    <input id="buscasku" value={buscaSku} onChange={(e) => setBuscaSku(e.target.value)} placeholder="código ou nome no ERP" />
                    {skus.length > 0 && (
                      <ul className={styles.skuLista}>
                        {skus.map((s) => (
                          <li key={s.sku}>
                            <button
                              type="button"
                              className={styles.skuItem}
                              onClick={() => {
                                set('erp_sku', s.sku);
                                if (p.tipo_vinculo === 'pendente') set('tipo_vinculo', 'proprio');
                                setBuscaSku('');
                                setSkus([]);
                              }}
                            >
                              <code>{s.sku}</code>
                              <span>{s.nome}</span>
                              <span style={{ color: Number(s.saldo_ml) > 0 ? '#25D366' : '#666' }}>
                                {Number(s.saldo_ml) > 0 ? `${Number(s.saldo_ml).toFixed(0)} m` : 'sem estoque'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {p.tipo_vinculo === 'alias' && (
                    <div className={`${styles.campo} ${styles.largo}`}>
                      <label htmlFor="aliasnota">Nota do alias</label>
                      <input id="aliasnota" value={p.alias_nota ?? ''} onChange={(e) => set('alias_nota', e.target.value)} placeholder="Ex.: mesmo rolo SH OP-105, nome NZWRAP" />
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* ---------------------------------------------------- SEO */}
          {aba === 'seo' && (
            <section className={styles.secao}>
              <h3 className={styles.secaoTitulo}>Busca e compartilhamento</h3>
              <div className={styles.grade}>
                <div className={`${styles.campo} ${styles.largo}`}>
                  <label htmlFor="seotitulo">Título</label>
                  <input id="seotitulo" value={p.seo_titulo ?? ''} onChange={(e) => set('seo_titulo', e.target.value)} maxLength={70} />
                  <span className={`${styles.contador} ${(p.seo_titulo ?? '').length > 60 ? styles.contadorRuim : ''}`}>
                    {(p.seo_titulo ?? '').length}/60 caracteres
                  </span>
                </div>
                <div className={`${styles.campo} ${styles.largo}`}>
                  <label htmlFor="seodesc">Descrição</label>
                  <textarea id="seodesc" value={p.seo_descricao ?? ''} onChange={(e) => set('seo_descricao', e.target.value)} maxLength={180} style={{ minHeight: 80 }} />
                  <span className={`${styles.contador} ${(p.seo_descricao ?? '').length > 158 ? styles.contadorRuim : ''}`}>
                    {(p.seo_descricao ?? '').length}/158 caracteres
                  </span>
                </div>
              </div>
              <button type="button" className={styles.secundario} style={{ marginTop: '0.7rem' }} onClick={sugerirSeo}>
                Sugerir a partir dos dados
              </button>
              <p className={styles.ajuda} style={{ marginTop: '0.6rem' }}>
                Vazio, o site monta título e descrição sozinho a partir do nome e da linha. Preencher só vale a pena para os produtos que
                você quer que apareçam no Google.
              </p>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------- lateral */}
        <aside className={styles.lateral}>
          <div className={styles.previewCaixa}>
            <p className={styles.previewTitulo}>Como aparece na loja</p>
            <div className={styles.cardFalso}>
              <div className={styles.cardFoto}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="" />
                ) : (
                  <div className={styles.cardSwatch} style={{ background: p.hex ?? '#1a1a1e' }} />
                )}
              </div>
              <div className={styles.cardCorpo}>
                <p className={styles.cardNome}>{p.nome || 'Nome do produto'}</p>
                <p className={styles.cardMeta}>
                  {p.codigo ? `${p.codigo} · ` : ''}
                  {p.marca_exibicao || linhaLabel}
                </p>
                {(p.badges ?? []).length > 0 && (
                  <div className={styles.cardChips}>
                    {(p.badges ?? []).slice(0, 3).map((b) => (
                      <span key={b} className={styles.cardChip}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {aba === 'seo' && (
            <div className={styles.previewCaixa}>
              <p className={styles.previewTitulo}>Prévia no Google</p>
              <div className={styles.seoPreview}>
                <div className={styles.seoUrl}>nzgroup.com.br › loja › {p.slug || '…'}</div>
                <p className={styles.seoTitulo}>{p.seo_titulo || `${p.nome || 'Produto'}${p.codigo ? ` · ${p.codigo}` : ''} — ${linhaLabel}`}</p>
                <p className={styles.seoDesc}>
                  {p.seo_descricao || p.descricao || 'A descrição automática do site aparece aqui quando este campo fica vazio.'}
                </p>
              </div>
            </div>
          )}

          {!criando && (
            <div className={styles.previewCaixa}>
              <p className={styles.previewTitulo}>Ações</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button type="button" className={styles.secundario} onClick={() => void duplicar()}>
                  Duplicar
                </button>
                {p.origem !== 'erp-auto' && (
                  <button type="button" className={`${styles.secundario} ${styles.perigo}`} onClick={() => void apagar()}>
                    Apagar produto
                  </button>
                )}
                <Link to="/admin/produtos" className={styles.secundario} style={{ textAlign: 'center', lineHeight: '42px' }}>
                  Voltar à lista
                </Link>
              </div>
              <p className={styles.ajuda} style={{ marginTop: '0.6rem' }}>
                Origem: {p.origem} · atualizado em {p.atualizado_em ? new Date(p.atualizado_em).toLocaleString('pt-BR') : '—'}
              </p>
            </div>
          )}
        </aside>
      </div>

      <div className={styles.barra}>
        <span className={styles.barraInfo}>
          {aviso ? <span className={styles.ok}>{aviso}</span> : mudou ? 'Alterações não salvas' : 'Tudo salvo'}
        </span>
        <button type="button" className={styles.secundario} onClick={sair}>
          Cancelar
        </button>
        {!criando && (
          <button type="button" className={styles.secundario} onClick={() => void salvarEProximo()} disabled={salvando}>
            Salvar e próximo
          </button>
        )}
        <button type="button" className={styles.salvar} onClick={() => void salvarEFicar()} disabled={salvando || (!mudou && !criando)}>
          {salvando ? 'Salvando…' : criando ? 'Criar produto' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
