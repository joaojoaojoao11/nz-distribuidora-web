// /admin/produtos — a lista do cadastro da loja.
//
// A busca e os filtros agora rodam no banco (RPC `produtos_buscar`): a tela
// antiga baixava os 1.292 produtos e o espelho inteiro do ERP para o navegador
// e recarregava tudo a cada gravação. Aqui vêm 50 por vez, já com o que o ERP
// diz (estoque, preço, ativo) e com a contagem de mídia.
//
// O estado da busca vive na URL — assim dá para mandar "olha a fila de sem
// foto da SH Wrapping" para alguém, e o botão Voltar do editor traz a mesma
// lista de volta.
//
// SKU, nome oficial, preço e estoque continuam vindo do NZERP e mudam pelo
// sync. Aqui se edita o editorial.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LINHA_LABEL } from '../../lib/shop/erp/mapa';
import { recarregarCatalogo } from '../../lib/shop/store';
import styles from './Admin.module.css';

interface Linha {
  id: string;
  slug: string;
  nome: string;
  codigo: string | null;
  erp_sku: string | null;
  linha_key: string;
  linha_label: string | null;
  vertical: string;
  kind: string;
  tipo_vinculo: string;
  origem: string;
  imagem: string | null;
  hex: string | null;
  publicado: boolean;
  oculto_manual: boolean;
  atualizado_em: string;
  erp_nome: string | null;
  erp_ativo: boolean | null;
  saldo_ml: number | null;
  preco_rolo: number | null;
  preco_metro: number | null;
  midias: number;
  videos: number;
  completude: number;
  visivel: boolean;
  total_geral: number;
}

interface Resumo {
  total: number;
  visiveis: number;
  semConexao: number;
  semFoto: number;
  alias: number;
  inativos: number;
  incompletos: number;
}

const FILAS: { id: string; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'sem-foto', label: 'Sem foto' },
  { id: 'incompletos', label: 'Cadastro incompleto' },
  { id: 'sem-conexao', label: 'Sem conexão com o ERP' },
  { id: 'alias', label: 'Alias (NZWRAP → SH)' },
  { id: 'inativo-erp', label: 'Inativos no ERP' },
  { id: 'erp-auto', label: 'Criados do ERP' },
  { id: 'ocultos', label: 'Ocultos à mão' },
  { id: 'com-estoque', label: 'Com estoque em SP' },
  { id: 'com-video', label: 'Com vídeo' },
  { id: 'visiveis', label: 'Visíveis na loja' },
];

const ORDENS: { id: string; label: string }[] = [
  { id: 'nome', label: 'Nome' },
  { id: 'atualizado', label: 'Editado por último' },
  { id: 'completude', label: 'Mais incompleto' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'linha', label: 'Linha' },
];

const POR_PAGINA = 50;
const CHAVE_FILA = 'nz:admin:fila-produtos';
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminProdutos() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const fila = params.get('fila') ?? 'todos';
  const linha = params.get('linha') ?? '';
  const ordem = params.get('ordem') ?? 'nome';
  const pagina = Math.max(0, Number(params.get('p') ?? 0));

  const [busca, setBusca] = useState(q);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [emLote, setEmLote] = useState(false);

  const trocar = useCallback(
    (mudancas: Record<string, string>) => {
      const novo = new URLSearchParams(params);
      for (const [k, v] of Object.entries(mudancas)) {
        if (v) novo.set(k, v);
        else novo.delete(k);
      }
      if (!('p' in mudancas)) novo.delete('p');
      setParams(novo, { replace: true });
    },
    [params, setParams]
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase.rpc('produtos_buscar', {
      p_q: q || null,
      p_fila: fila,
      p_linha: linha || null,
      p_ordem: ordem,
      p_offset: pagina * POR_PAGINA,
      p_limite: POR_PAGINA,
    });
    if (error) setErro(error.message);
    else setErro('');
    const lista = (data ?? []) as Linha[];
    setLinhas(lista);
    setTotal(lista[0]?.total_geral ?? 0);
    setMarcados(new Set());
    setCarregando(false);
    // O editor usa isto no "Salvar e próximo".
    try {
      sessionStorage.setItem(CHAVE_FILA, JSON.stringify(lista.map((l) => l.slug)));
    } catch {
      /* modo privado: o botão só volta para a lista */
    }
  }, [q, fila, linha, ordem, pagina]);

  useEffect(() => {
    // Carga inicial: buscar no banco é efeito de verdade; o estado da tela é
    // consequência da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const carregarResumo = useCallback(async () => {
    const { data } = await supabase.rpc('produtos_resumo');
    if (data) setResumo(data as Resumo);
  }, []);

  useEffect(() => {
    // Carga inicial: buscar no banco é efeito de verdade; o estado da tela é
    // consequência da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarResumo();
  }, [carregarResumo]);

  // Digitar não recarrega a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      if (busca !== q) trocar({ q: busca });
    }, 350);
    return () => clearTimeout(t);
  }, [busca, q, trocar]);

  const paginas = Math.ceil(total / POR_PAGINA);

  const alternarMarca = (id: string) =>
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const emLoteAplicar = async (patch: Record<string, unknown>, texto: string) => {
    if (marcados.size === 0) return;
    if (!confirm(`${texto} — ${marcados.size} produto(s)?`)) return;
    setEmLote(true);
    const { error } = await supabase.from('produtos').update(patch).in('id', [...marcados]);
    setEmLote(false);
    if (error) {
      setErro(error.message);
      return;
    }
    void recarregarCatalogo();
    await carregar();
    await carregarResumo();
  };

  const exportarCsv = () => {
    const cab = ['slug', 'nome', 'codigo', 'sku', 'linha', 'fotos', 'videos', 'completude', 'visivel', 'estoque_m'];
    const corpo = linhas.map((l) => [
      l.slug,
      l.nome,
      l.codigo ?? '',
      l.erp_sku ?? '',
      l.linha_label ?? l.linha_key,
      l.midias,
      l.videos,
      `${l.completude}/5`,
      l.visivel ? 'sim' : 'nao',
      l.saldo_ml ?? '',
    ]);
    const csv = [cab, ...corpo].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos-nz-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const metricas = useMemo(
    () =>
      resumo
        ? [
            { label: 'Cadastrados', valor: resumo.total, fila: 'todos' },
            { label: 'Visíveis na loja', valor: resumo.visiveis, fila: 'visiveis' },
            { label: 'Sem foto', valor: resumo.semFoto, fila: 'sem-foto', alerta: true },
            { label: 'Cadastro incompleto', valor: resumo.incompletos, fila: 'incompletos', alerta: true },
            { label: 'Sem conexão', valor: resumo.semConexao, fila: 'sem-conexao', alerta: true },
            { label: 'Inativos no ERP', valor: resumo.inativos, fila: 'inativo-erp' },
          ]
        : [],
    [resumo]
  );

  return (
    <div>
      <p className={styles.tabDescription}>
        Cadastro da LOJA. <strong>SKU, nome oficial, preço e estoque vêm do NZERP</strong> e mudam pelo sync; aqui se edita o editorial —
        nome de exibição, fotos, vídeo, cor, ficha, descrição e SEO. Um produto aparece na loja quando está publicado, não oculto e com o
        SKU ativo no ERP.
      </p>

      <div className={styles.metricsGrid}>
        {metricas.map((m) => (
          <button
            key={m.label}
            type="button"
            className={styles.metricCard}
            style={{ cursor: 'pointer', textAlign: 'left', border: 'none' }}
            onClick={() => trocar({ fila: m.fila })}
          >
            <span className={styles.metricLabel}>{m.label}</span>
            <span className={m.alerta && m.valor > 0 ? styles.metricValueWarning : styles.metricValue}>{m.valor}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableSection}>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <div className={styles.createField} style={{ flex: '1 1 250px' }}>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, slug, código, SKU ou nome no ERP"
              autoFocus
            />
          </div>
          <div className={styles.createField}>
            <select value={fila} onChange={(e) => trocar({ fila: e.target.value })}>
              {FILAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.createField}>
            <select value={linha} onChange={(e) => trocar({ linha: e.target.value })}>
              <option value="">Todas as linhas</option>
              {Object.entries(LINHA_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.createField}>
            <select value={ordem} onChange={(e) => trocar({ ordem: e.target.value })}>
              {ORDENS.map((o) => (
                <option key={o.id} value={o.id}>
                  ordenar: {o.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={styles.createBtn} onClick={exportarCsv}>
            ↓ CSV
          </button>
          <Link to="/admin/produtos/novo" className={styles.createBtn}>
            + Novo produto
          </Link>
        </div>

        {erro && <div className={styles.createError}>{erro}</div>}

        {marcados.size > 0 && (
          <div className={styles.createModal} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{marcados.size} selecionado(s)</strong>
            <button type="button" className={styles.actionBtn} disabled={emLote} onClick={() => void emLoteAplicar({ publicado: true }, 'Publicar')}>
              Publicar
            </button>
            <button type="button" className={styles.actionBtn} disabled={emLote} onClick={() => void emLoteAplicar({ oculto_manual: true }, 'Ocultar')}>
              Ocultar
            </button>
            <button type="button" className={styles.actionBtn} disabled={emLote} onClick={() => void emLoteAplicar({ oculto_manual: false }, 'Mostrar')}>
              Mostrar
            </button>
            <button type="button" className={styles.actionBtn} onClick={() => setMarcados(new Set())}>
              Limpar seleção
            </button>
          </div>
        )}

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 28 }}>
                  <input
                    type="checkbox"
                    aria-label="Marcar todos"
                    checked={linhas.length > 0 && marcados.size === linhas.length}
                    onChange={(e) => setMarcados(e.target.checked ? new Set(linhas.map((l) => l.id)) : new Set())}
                  />
                </th>
                <th style={{ width: 56 }}></th>
                <th>Produto</th>
                <th>Linha</th>
                <th>ERP</th>
                <th>Estoque SP</th>
                <th>Cadastro</th>
                <th>Loja</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={marcados.has(l.id)} onChange={() => alternarMarca(l.id)} aria-label={`Selecionar ${l.nome}`} />
                  </td>
                  <td>
                    <div style={{ position: 'relative', width: 44, height: 44 }}>
                      {l.imagem ? (
                        <img src={l.imagem} alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 5 }} />
                      ) : (
                        <span
                          style={{
                            display: 'block',
                            width: 44,
                            height: 44,
                            borderRadius: 5,
                            background: l.hex ?? '#222',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      )}
                      {l.videos > 0 && (
                        <span style={{ position: 'absolute', right: -4, bottom: -4, fontSize: '0.65rem', background: '#000', borderRadius: 4, padding: '0 3px' }}>▶</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link to={`/admin/produtos/${l.slug}`} style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
                      {l.nome}
                    </Link>
                    <div style={{ color: '#777', fontSize: '0.72rem' }}>
                      {l.codigo ? `${l.codigo} · ` : ''}
                      {l.slug}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{l.linha_label ?? l.linha_key}</td>
                  <td>
                    {l.erp_sku ? (
                      <>
                        <code style={{ color: '#fff' }}>{l.erp_sku}</code>
                        <div style={{ color: '#777', fontSize: '0.72rem' }}>{l.erp_nome ?? '— fora do espelho —'}</div>
                        {l.erp_ativo === false && <span className={`${styles.badge} ${styles.badgeAdmin}`}>inativo no ERP</span>}
                      </>
                    ) : l.tipo_vinculo === 'familia' ? (
                      <span className={styles.badge}>família</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgePending}`}>sem conexão</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {l.erp_sku ? (
                      Number(l.saldo_ml ?? 0) > 0 ? (
                        <>
                          <span className={`${styles.badge} ${styles.badgeApproved}`}>ESTOQUE</span>{' '}
                          {Number(l.saldo_ml).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m
                          <div style={{ color: '#777', fontSize: '0.72rem' }}>{l.preco_rolo ? BRL.format(Number(l.preco_rolo)) : ''}</div>
                        </>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePending}`}>DROP</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span
                      title="foto · galeria · descrição · ficha · SEO"
                      style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: 10,
                            height: 6,
                            borderRadius: 2,
                            background: i < l.completude ? (l.completude >= 4 ? '#25D366' : '#f5a623') : 'rgba(255,255,255,0.12)',
                          }}
                        />
                      ))}
                    </span>
                    <div style={{ color: '#777', fontSize: '0.7rem' }}>
                      {l.midias} foto{l.midias === 1 ? '' : 's'}
                      {l.videos > 0 ? ` · ${l.videos} vídeo${l.videos === 1 ? '' : 's'}` : ''}
                    </div>
                  </td>
                  <td>
                    {l.visivel ? (
                      <span className={`${styles.badge} ${styles.badgeApproved}`}>visível</span>
                    ) : l.oculto_manual ? (
                      <span className={`${styles.badge} ${styles.badgeAdmin}`}>oculto</span>
                    ) : (
                      <span className={styles.badge}>fora</span>
                    )}
                  </td>
                  <td>
                    <button type="button" className={styles.actionBtn} onClick={() => navigate(`/admin/produtos/${l.slug}`)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {!carregando && linhas.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    Nenhum produto com esse filtro.
                  </td>
                </tr>
              )}
              {carregando && (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {paginas > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <button type="button" className={styles.actionBtn} disabled={pagina === 0} onClick={() => trocar({ p: String(pagina - 1) })}>
              ← anterior
            </button>
            <span style={{ color: '#888', fontSize: '0.8rem' }}>
              página {pagina + 1} de {paginas} · {total} produto(s)
            </span>
            <button type="button" className={styles.actionBtn} disabled={pagina + 1 >= paginas} onClick={() => trocar({ p: String(pagina + 1) })}>
              próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
