// Aba Produtos do painel admin — o cadastro da LOJA (produtos ⨝ erp_produtos).
//
// Duas colunas de verdade convivem aqui: o que vem do ERP (SKU, nome oficial,
// ativo, preço de venda, saldo) e o que é do site (nome de exibição, foto,
// hex, linha, descrição, SEO). O admin edita só o segundo; o primeiro é
// somente leitura e muda pelo sync.
//
// Filas que importam:
//   · sem conexão  — editorial sem erp_sku: não publica até alguém apontar o SKU
//   · sem foto     — criado do ERP com amostra de cor; trocar por foto quando houver
//   · alias        — NZWRAP que é o mesmo rolo de uma SH (o admin vê o par)
//   · inativo ERP  — some da loja sozinho; fica aqui para não parecer bug

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LINHA_LABEL } from '../../lib/shop/erp/mapa';
import { recarregarCatalogo } from '../../lib/shop/store';
import styles from './Admin.module.css';

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
  galeria: string[];
  hex: string | null;
  acabamento_label: string | null;
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
}

type Fila = 'todos' | 'sem-conexao' | 'sem-foto' | 'alias' | 'inativo-erp' | 'erp-auto' | 'ocultos' | 'com-estoque';

const FILA_LABEL: Record<Fila, string> = {
  todos: 'Todos',
  'sem-conexao': 'Sem conexão com o ERP',
  'sem-foto': 'Sem foto',
  alias: 'Alias (NZWRAP → SH)',
  'inativo-erp': 'Inativos no ERP',
  'erp-auto': 'Criados do ERP',
  ocultos: 'Ocultos à mão',
  'com-estoque': 'Com estoque em SP',
};

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

async function lerTudo<T>(tabela: string, colunas: string, ordem: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(tabela).select(colunas).order(ordem).range(from, from + 999);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    out.push(...((data ?? []) as unknown as T[]));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erp, setErp] = useState<Map<string, Erp>>(new Map());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [fila, setFila] = useState<Fila>('todos');
  const [linha, setLinha] = useState('');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Produto | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [p, e] = await Promise.all([
        lerTudo<Produto>(
          'produtos',
          'id, slug, erp_sku, tipo_vinculo, alias_de, alias_nota, nome, subtitulo, marca_exibicao, linha_key, linha_label, vertical, kind, codigo, imagem, galeria, hex, acabamento_label, descricao, garantia_anos, durabilidade_anos, publicado, oculto_manual, ordem, origem, seo_titulo, seo_descricao, atualizado_em',
          'nome'
        ),
        lerTudo<Erp>(
          'erp_produtos',
          'sku, nome, marca, ativo, removido_no_erp, saldo_ml, rolos_fechados, rolos_abertos, preco_rolo, preco_metro, metragem_padrao',
          'sku'
        ),
      ]);
      setProdutos(p);
      setErp(new Map(e.map((x) => [x.sku, x])));
      setErro('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);

  const visivel = useCallback(
    (p: Produto) => {
      if (!p.publicado || p.oculto_manual) return false;
      if (p.tipo_vinculo === 'familia') return true;
      const e = p.erp_sku ? erp.get(p.erp_sku) : undefined;
      return Boolean(e?.ativo);
    },
    [erp]
  );

  const metricas = useMemo(() => {
    let visiveis = 0, semConexao = 0, semFoto = 0, alias = 0, inativos = 0, auto = 0;
    for (const p of produtos) {
      if (visivel(p)) visiveis++;
      if (p.tipo_vinculo === 'pendente') semConexao++;
      if (!p.imagem && p.kind !== 'linha') semFoto++;
      if (p.tipo_vinculo === 'alias') alias++;
      if (p.erp_sku && erp.get(p.erp_sku) && !erp.get(p.erp_sku)!.ativo) inativos++;
      if (p.origem === 'erp-auto') auto++;
    }
    return { total: produtos.length, visiveis, semConexao, semFoto, alias, inativos, auto };
  }, [produtos, erp, visivel]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const e = p.erp_sku ? erp.get(p.erp_sku) : undefined;
      switch (fila) {
        case 'sem-conexao':
          if (p.tipo_vinculo !== 'pendente') return false;
          break;
        case 'sem-foto':
          if (p.imagem || p.kind === 'linha') return false;
          break;
        case 'alias':
          if (p.tipo_vinculo !== 'alias') return false;
          break;
        case 'inativo-erp':
          if (!e || e.ativo) return false;
          break;
        case 'erp-auto':
          if (p.origem !== 'erp-auto') return false;
          break;
        case 'ocultos':
          if (!p.oculto_manual) return false;
          break;
        case 'com-estoque':
          if (!e || Number(e.saldo_ml) <= 0) return false;
          break;
      }
      if (linha && p.linha_key !== linha) return false;
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        (p.codigo ?? '').toLowerCase().includes(q) ||
        (p.erp_sku ?? '').toLowerCase().includes(q) ||
        (e?.nome ?? '').toLowerCase().includes(q)
      );
    });
  }, [produtos, erp, fila, linha, busca]);

  const alternarOculto = async (p: Produto) => {
    const { error } = await supabase.from('produtos').update({ oculto_manual: !p.oculto_manual }).eq('id', p.id);
    if (error) setErro(error.message);
    await carregar();
    void recarregarCatalogo();
  };

  if (loading) return <p style={{ color: '#a1a1a6' }}>Carregando cadastro…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Cadastro da LOJA. <strong>SKU, nome oficial, ativo, preço e estoque vêm do NZERP</strong> e
        mudam pelo sync; aqui se edita o editorial — nome de exibição, foto, cor, linha, descrição e
        SEO. Um produto só aparece na loja quando está publicado, não oculto e o SKU está ativo no ERP.
      </p>

      {erro && (
        <div className={styles.createError} style={{ marginBottom: '1rem' }}>
          {erro}
        </div>
      )}

      <div className={styles.metricsGrid}>
        <Metrica label="Cadastrados" valor={metricas.total} />
        <Metrica label="Visíveis na loja" valor={metricas.visiveis} />
        <Metrica label="Sem conexão" valor={metricas.semConexao} alerta onClick={() => setFila('sem-conexao')} />
        <Metrica label="Sem foto" valor={metricas.semFoto} onClick={() => setFila('sem-foto')} />
        <Metrica label="Alias NZWRAP→SH" valor={metricas.alias} onClick={() => setFila('alias')} />
        <Metrica label="Inativos no ERP" valor={metricas.inativos} onClick={() => setFila('inativo-erp')} />
      </div>

      <div className={styles.tableSection}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <div className={styles.createField} style={{ flex: '1 1 260px' }}>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, slug, código, SKU ou nome no ERP"
            />
          </div>
          <div className={styles.createField}>
            <select value={fila} onChange={(e) => setFila(e.target.value as Fila)}>
              {(Object.keys(FILA_LABEL) as Fila[]).map((f) => (
                <option key={f} value={f}>
                  {FILA_LABEL[f]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.createField}>
            <select value={linha} onChange={(e) => setLinha(e.target.value)}>
              <option value="">Todas as linhas</option>
              {Object.entries(LINHA_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <span style={{ color: '#888', fontSize: '0.8rem' }}>{lista.length} item(ns)</span>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Produto</th>
                <th>Linha</th>
                <th>ERP</th>
                <th>Estoque SP</th>
                <th>Preço rolo / metro</th>
                <th>Loja</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, 400).map((p) => {
                const e = p.erp_sku ? erp.get(p.erp_sku) : undefined;
                const aliasDe = p.alias_de ? porId.get(p.alias_de) : undefined;
                return (
                  <tr key={p.id}>
                    <td>
                      {p.imagem ? (
                        <img src={p.imagem} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 36,
                            height: 36,
                            borderRadius: 4,
                            background: p.hex ?? '#222',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      )}
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{p.nome}</strong>
                      <br />
                      <span style={{ color: '#777', fontSize: '0.72rem' }}>
                        {p.codigo ? `${p.codigo} · ` : ''}
                        {p.slug}
                      </span>
                      {aliasDe && (
                        <>
                          <br />
                          <span style={{ color: '#4A90D9', fontSize: '0.72rem' }}>= {aliasDe.nome} ({aliasDe.erp_sku})</span>
                        </>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.linha_label ?? p.linha_key}</td>
                    <td>
                      {p.erp_sku ? (
                        <>
                          <code style={{ color: '#fff' }}>{p.erp_sku}</code>
                          <br />
                          <span style={{ color: '#777', fontSize: '0.72rem' }}>{e?.nome ?? '— não está no espelho —'}</span>
                          {e && !e.ativo && (
                            <>
                              <br />
                              <span className={`${styles.badge} ${styles.badgeAdmin}`}>inativo no ERP</span>
                            </>
                          )}
                        </>
                      ) : p.tipo_vinculo === 'familia' ? (
                        <span className={styles.badge}>família</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePending}`}>sem conexão</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {e ? (
                        Number(e.saldo_ml) > 0 ? (
                          <>
                            <span className={`${styles.badge} ${styles.badgeApproved}`}>ESTOQUE</span>{' '}
                            {Number(e.saldo_ml).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m ·{' '}
                            {e.rolos_fechados}F/{e.rolos_abertos}A
                          </>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgePending}`}>DROP</span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {e?.preco_rolo ? BRL.format(Number(e.preco_rolo)) : '—'}
                      <br />
                      <span style={{ color: '#777', fontSize: '0.72rem' }}>
                        {e?.preco_metro ? `${BRL.format(Number(e.preco_metro))}/m` : ''}
                      </span>
                    </td>
                    <td>
                      {visivel(p) ? (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>visível</span>
                      ) : p.oculto_manual ? (
                        <span className={`${styles.badge} ${styles.badgeAdmin}`}>oculto</span>
                      ) : (
                        <span className={styles.badge}>fora</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className={styles.actionBtn} onClick={() => setEditando(p)}>
                        Editar
                      </button>{' '}
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${p.oculto_manual ? styles.actionBtnApprove : styles.actionBtnDeny}`}
                        onClick={() => alternarOculto(p)}
                      >
                        {p.oculto_manual ? 'Mostrar' : 'Ocultar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {lista.length > 400 && (
          <p style={{ color: '#777', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Mostrando 400 de {lista.length}. Refine a busca.
          </p>
        )}
      </div>

      {editando && (
        <EditorProduto
          produto={editando}
          erp={erp}
          candidatosAlias={produtos.filter((p) => p.tipo_vinculo === 'proprio' && p.erp_sku)}
          onClose={() => setEditando(null)}
          onSaved={async () => {
            setEditando(null);
            await carregar();
            void recarregarCatalogo();
          }}
        />
      )}
    </div>
  );
}

function Metrica({ label, valor, alerta, onClick }: { label: string; valor: number; alerta?: boolean; onClick?: () => void }) {
  return (
    <div className={styles.metricCard} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={alerta && valor > 0 ? styles.metricValueWarning : styles.metricValue}>{valor}</span>
    </div>
  );
}

// ------------------------------------------------------------------ editor

function EditorProduto({
  produto,
  erp,
  candidatosAlias,
  onClose,
  onSaved,
}: {
  produto: Produto;
  erp: Map<string, Erp>;
  candidatosAlias: Produto[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [f, setF] = useState({
    nome: produto.nome,
    subtitulo: produto.subtitulo ?? '',
    codigo: produto.codigo ?? '',
    marca_exibicao: produto.marca_exibicao ?? '',
    linha_key: produto.linha_key,
    vertical: produto.vertical,
    kind: produto.kind,
    hex: produto.hex ?? '',
    imagem: produto.imagem ?? '',
    acabamento_label: produto.acabamento_label ?? '',
    descricao: produto.descricao ?? '',
    garantia_anos: produto.garantia_anos ?? '',
    durabilidade_anos: produto.durabilidade_anos ?? '',
    erp_sku: produto.erp_sku ?? '',
    tipo_vinculo: produto.tipo_vinculo,
    alias_de: produto.alias_de ?? '',
    alias_nota: produto.alias_nota ?? '',
    publicado: produto.publicado,
    oculto_manual: produto.oculto_manual,
    ordem: produto.ordem,
    seo_titulo: produto.seo_titulo ?? '',
    seo_descricao: produto.seo_descricao ?? '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const skuUpper = f.erp_sku.trim().toUpperCase();
  const erpRow = skuUpper ? erp.get(skuUpper) : undefined;

  const enviarFoto = async (file: File) => {
    setEnviando(true);
    setErro('');
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const path = `produtos/${produto.slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true, cacheControl: '31536000' });
    if (error) {
      setErro(`upload: ${error.message}`);
    } else {
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      setF((s) => ({ ...s, imagem: data.publicUrl }));
    }
    setEnviando(false);
  };

  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSalvando(true);
    setErro('');

    let tipo = f.tipo_vinculo;
    if (produto.tipo_vinculo !== 'familia') {
      if (!skuUpper) tipo = 'pendente';
      else if (tipo === 'pendente') tipo = 'proprio';
      if (tipo === 'alias' && !f.alias_de) tipo = 'proprio';
    }
    if (skuUpper && !erpRow) {
      setErro(`O SKU ${skuUpper} não está no espelho do ERP. Confira a grafia ou rode o sync.`);
      setSalvando(false);
      return;
    }

    const patch = {
      nome: f.nome.trim(),
      subtitulo: f.subtitulo.trim() || null,
      codigo: f.codigo.trim() || null,
      marca_exibicao: f.marca_exibicao.trim() || null,
      linha_key: f.linha_key,
      linha_label: LINHA_LABEL[f.linha_key as keyof typeof LINHA_LABEL] ?? f.linha_key,
      vertical: f.vertical,
      kind: f.kind,
      hex: f.hex.trim() || null,
      imagem: f.imagem.trim() || null,
      acabamento_label: f.acabamento_label.trim() || null,
      descricao: f.descricao.trim() || null,
      garantia_anos: f.garantia_anos === '' ? null : Number(f.garantia_anos),
      durabilidade_anos: f.durabilidade_anos === '' ? null : Number(f.durabilidade_anos),
      erp_sku: tipo === 'familia' ? null : skuUpper || null,
      tipo_vinculo: tipo,
      alias_de: tipo === 'alias' ? f.alias_de : null,
      alias_nota: tipo === 'alias' ? f.alias_nota.trim() || null : null,
      // Sem SKU não publica — o check do banco recusaria de qualquer jeito.
      publicado: tipo === 'familia' ? f.publicado : f.publicado && Boolean(skuUpper),
      oculto_manual: f.oculto_manual,
      ordem: Number(f.ordem) || 0,
      seo_titulo: f.seo_titulo.trim() || null,
      seo_descricao: f.seo_descricao.trim() || null,
    };

    const { error } = await supabase.from('produtos').update(patch).eq('id', produto.id);
    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }
    await onSaved();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 500,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <form
        onSubmit={salvar}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          height: '100%',
          overflowY: 'auto',
          background: '#0f0f12',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
          <h3 className={styles.tableSectionTitle} style={{ margin: 0 }}>
            {produto.nome}
          </h3>
          <span style={{ color: '#777', fontSize: '0.75rem' }}>/loja/{produto.slug}</span>
        </div>

        {erro && <div className={styles.createError}>{erro}</div>}

        {/* --------------------------------------------------- ERP (leitura) */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '0.9rem 1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
          <strong style={{ color: '#fff', letterSpacing: '1px', fontSize: '0.65rem', textTransform: 'uppercase' }}>NZERP · somente leitura</strong>
          {erpRow ? (
            <div style={{ color: '#a1a1a6', marginTop: '0.4rem', lineHeight: 1.7 }}>
              {erpRow.nome} · {erpRow.marca} · {erpRow.ativo ? 'ativo' : 'INATIVO'}
              {erpRow.removido_no_erp ? ' · removido do ERP' : ''}
              <br />
              Rolo {erpRow.preco_rolo ? BRL.format(Number(erpRow.preco_rolo)) : '—'} · Metro{' '}
              {erpRow.preco_metro ? `${BRL.format(Number(erpRow.preco_metro))}/m` : '—'} · Rolo padrão {erpRow.metragem_padrao ?? '—'} m
              <br />
              Estoque SP: {Number(erpRow.saldo_ml).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m ·{' '}
              {erpRow.rolos_fechados} fechado(s) · {erpRow.rolos_abertos} aberto(s) →{' '}
              <strong style={{ color: Number(erpRow.saldo_ml) > 0 ? '#25D366' : '#f5a623' }}>
                {Number(erpRow.saldo_ml) > 0 ? 'ESTOQUE' : 'DROP'}
              </strong>
            </div>
          ) : (
            <div style={{ color: '#f5a623', marginTop: '0.4rem' }}>Sem SKU conectado — o produto não aparece na loja.</div>
          )}
        </div>

        <div className={styles.createGrid}>
          <div className={styles.createField}>
            <label>SKU no NZERP</label>
            <input
              list="erp-skus"
              value={f.erp_sku}
              onChange={(e) => setF({ ...f, erp_sku: e.target.value })}
              placeholder="Ex.: SHOP-105"
              disabled={produto.tipo_vinculo === 'familia'}
            />
            <datalist id="erp-skus">
              {[...erp.values()].slice(0, 1500).map((e) => (
                <option key={e.sku} value={e.sku}>
                  {e.nome ?? ''}
                </option>
              ))}
            </datalist>
          </div>
          <div className={styles.createField}>
            <label>Vínculo</label>
            <select
              value={f.tipo_vinculo}
              onChange={(e) => setF({ ...f, tipo_vinculo: e.target.value as Produto['tipo_vinculo'] })}
              disabled={produto.tipo_vinculo === 'familia'}
            >
              <option value="proprio">Próprio — este produto É o SKU</option>
              <option value="alias">Alias — mesmo rolo de outro produto</option>
              <option value="pendente">Pendente — sem conexão (não publica)</option>
              {produto.tipo_vinculo === 'familia' && <option value="familia">Família (página de linha)</option>}
            </select>
          </div>

          {f.tipo_vinculo === 'alias' && (
            <>
              <div className={styles.createField}>
                <label>É o mesmo rolo de</label>
                <select
                  value={f.alias_de}
                  onChange={(e) => {
                    const alvo = candidatosAlias.find((c) => c.id === e.target.value);
                    setF({ ...f, alias_de: e.target.value, erp_sku: alvo?.erp_sku ?? f.erp_sku });
                  }}
                >
                  <option value="">— escolher —</option>
                  {candidatosAlias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.erp_sku}) · {c.linha_label ?? c.linha_key}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.createField}>
                <label>Nota do alias</label>
                <input value={f.alias_nota} onChange={(e) => setF({ ...f, alias_nota: e.target.value })} placeholder="Ex.: mesmo rolo SH OP-105, nome NZWRAP" />
              </div>
            </>
          )}

          <div className={styles.createField}>
            <label>Nome de exibição</label>
            <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Subtítulo</label>
            <input value={f.subtitulo} onChange={(e) => setF({ ...f, subtitulo: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Código exibido no card</label>
            <input value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Marca exibida</label>
            <input value={f.marca_exibicao} onChange={(e) => setF({ ...f, marca_exibicao: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Linha</label>
            <select value={f.linha_key} onChange={(e) => setF({ ...f, linha_key: e.target.value })}>
              {Object.entries(LINHA_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.createField}>
            <label>Vertical / tipo</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={f.vertical} onChange={(e) => setF({ ...f, vertical: e.target.value as Produto['vertical'] })}>
                <option value="WRAP">NZWRAP</option>
                <option value="DECOR">NZDECOR</option>
                <option value="SIGN">NZSIGN</option>
                <option value="PPF">NZPPF</option>
              </select>
              <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Produto['kind'] })}>
                <option value="cor">Cor</option>
                <option value="padrao">Padrão</option>
                <option value="linha">Linha técnica</option>
              </select>
            </div>
          </div>
          <div className={styles.createField}>
            <label>Cor (hex)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(f.hex) ? f.hex : '#000000'} onChange={(e) => setF({ ...f, hex: e.target.value })} style={{ width: 48, height: 44, padding: 0, border: 'none', background: 'transparent' }} />
              <input value={f.hex} onChange={(e) => setF({ ...f, hex: e.target.value })} placeholder="#ab071c" style={{ flex: 1 }} />
            </div>
          </div>
          <div className={styles.createField}>
            <label>Acabamento (rótulo)</label>
            <input value={f.acabamento_label} onChange={(e) => setF({ ...f, acabamento_label: e.target.value })} placeholder="Ex.: Metálico Fosco" />
          </div>
          <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
            <label>Foto principal</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {f.imagem && <img src={f.imagem} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }} />}
              <input value={f.imagem} onChange={(e) => setF({ ...f, imagem: e.target.value })} placeholder="/assets/images/... ou URL" style={{ flex: 1 }} />
              <label className={styles.actionBtn} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {enviando ? 'Enviando…' : 'Enviar arquivo'}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && enviarFoto(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className={styles.createField} style={{ gridColumn: '1 / -1' }}>
            <label>Descrição</label>
            <textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} style={{ minHeight: 90 }} />
          </div>
          <div className={styles.createField}>
            <label>Garantia (anos)</label>
            <input type="number" value={f.garantia_anos} onChange={(e) => setF({ ...f, garantia_anos: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Durabilidade (anos)</label>
            <input type="number" value={f.durabilidade_anos} onChange={(e) => setF({ ...f, durabilidade_anos: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Título SEO</label>
            <input value={f.seo_titulo} onChange={(e) => setF({ ...f, seo_titulo: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Descrição SEO</label>
            <input value={f.seo_descricao} onChange={(e) => setF({ ...f, seo_descricao: e.target.value })} />
          </div>
          <div className={styles.createField}>
            <label>Ordem</label>
            <input type="number" value={f.ordem} onChange={(e) => setF({ ...f, ordem: Number(e.target.value) })} />
          </div>
          <div className={styles.createField} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginTop: '1.4rem' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
              <input type="checkbox" checked={f.publicado} onChange={(e) => setF({ ...f, publicado: e.target.checked })} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#25D366' }} />
              Publicado
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
              <input type="checkbox" checked={f.oculto_manual} onChange={(e) => setF({ ...f, oculto_manual: e.target.checked })} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#ff4444' }} />
              Oculto à mão
            </label>
          </div>
        </div>

        <div className={styles.createActions} style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button type="button" onClick={onClose} className={styles.createBtnCancel}>
            Cancelar
          </button>
          <button type="submit" className={styles.createBtnConfirm} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
