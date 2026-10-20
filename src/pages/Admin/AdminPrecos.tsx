// /admin/precos — Tipos de acesso: uma linha por tipo, e cada uma abre a sua
// configuração (preço e visibilidade) em /admin/precos/:papel.
//
// A primeira versão (20/10, tarde) era uma matriz única de percentuais, que o
// João achou confusa. Agora a tela de entrada só responde "o que cada tipo
// vê e paga hoje", em uma frase por tipo, e a configuração fina fica na
// página do tipo (AdminAcessoConfig.tsx).
//
// Admin aparece na lista para a régua ficar completa, mas não se configura:
// vê tudo e compra pela base do ERP.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { TIPO_DESCRICAO, TIPO_LABEL, TIPOS_CLIENTE, type TipoAcesso } from '../../lib/shop/papeis';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

type PapelPreco = 'reseller' | 'lojista' | 'client';

interface RegraRow {
  papel: PapelPreco;
  linha_key: string | null;
  base: 'atacado' | 'varejo';
  percentual: number;
}

interface VisRow {
  papel: PapelPreco;
  linhas_ocultas: string[] | null;
  ve_rolo: boolean;
  ve_metro: boolean;
  ve_estoque: boolean;
  ve_promocao: boolean;
  pagamento_online: boolean;
  atualizado_em: string | null;
}

const ORDEM: TipoAcesso[] = ['admin', 'reseller', 'lojista', 'client'];
const pct = (v: number) => `${String(v).replace('.', ',')}%`;

export default function AdminPrecos() {
  const [regras, setRegras] = useState<RegraRow[]>([]);
  const [vis, setVis] = useState<VisRow[]>([]);
  const [contas, setContas] = useState<Record<string, number>>({});
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const [r, v, u] = await Promise.all([
      supabase.from('precos_acesso').select('papel, linha_key, base, percentual'),
      supabase.from('acesso_config').select('papel, linhas_ocultas, ve_rolo, ve_metro, ve_estoque, ve_promocao, pagamento_online, atualizado_em'),
      supabase.from('user_profiles').select('role').limit(1000),
    ]);
    const err = r.error ?? v.error ?? u.error;
    setErro(err ? `Não carregou: ${err.message} — as migrations 2026-10-20b/c já foram aplicadas?` : '');
    setRegras((r.data ?? []) as RegraRow[]);
    setVis((v.data ?? []) as VisRow[]);
    const c: Record<string, number> = {};
    for (const p of (u.data ?? []) as { role: string }[]) c[p.role] = (c[p.role] ?? 0) + 1;
    setContas(c);
    setCarregando(false);
  }, []);

  useEffect(() => {
    // Carga inicial (o mesmo padrão das outras abas do admin).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar();
  }, [carregar]);

  const resumo = useMemo(() => {
    const por: Record<string, { preco: string; ve: string }> = {};
    for (const p of TIPOS_CLIENTE) {
      const geral = regras.find((x) => x.papel === p && !x.linha_key);
      const proprias = regras.filter((x) => x.papel === p && x.linha_key).length;
      const base = geral?.base ?? (p === 'client' ? 'varejo' : 'atacado');
      const g = Number(geral?.percentual ?? 0);
      const preco = `${base === 'varejo' ? 'varejo do ERP' : 'atacado do ERP'}${g > 0 ? ` + ${pct(g)}` : ', sem acréscimo'}${proprias ? ` · ${proprias} linha${proprias > 1 ? 's' : ''} com percentual próprio` : ''}`;
      const vr = vis.find((x) => x.papel === p);
      const partes: string[] = [];
      const ocultas = vr?.linhas_ocultas?.length ?? 0;
      partes.push(ocultas ? `${ocultas} linha${ocultas > 1 ? 's' : ''} oculta${ocultas > 1 ? 's' : ''}` : 'todas as linhas');
      if (vr && !vr.ve_rolo) partes.push('sem rolo fechado');
      if (vr && !vr.ve_metro) partes.push('sem metro fracionado');
      partes.push(vr?.ve_estoque ?? p !== 'client' ? 'estoque detalhado' : 'sem estoque detalhado');
      if (vr && !vr.ve_promocao) partes.push('sem Promoção Moto');
      partes.push(vr && !vr.pagamento_online ? 'sem pagamento online (só orçamento)' : 'pagamento online');
      por[p] = { preco, ve: partes.join(' · ') };
    }
    return por;
  }, [regras, vis]);

  if (carregando) return <p style={{ color: '#a1a1a6' }}>Carregando tipos de acesso…</p>;

  return (
    <div>
      <p className={styles.tabDescription}>
        Cada pessoa aprovada tem um <strong>tipo de acesso</strong> (escolhido em <Link to="/admin/clientes" style={{ color: '#fff' }}>Clientes</Link>). O tipo
        decide o <strong>preço</strong> que ela vê (base do ERP + percentual, geral ou por linha) e o <strong>que ela vê</strong> na loja (linhas, rolo ou metro,
        estoque detalhado, promoção, pagamento online). Abra um tipo para configurar.
      </p>
      {erro && <p className={ped.aviso}>{erro}</p>}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ORDEM.map((p) => {
          const n = contas[p] ?? 0;
          const ehAdmin = p === 'admin';
          return (
            <div key={p} className={ped.card} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 260px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: '#fff' }}>{TIPO_LABEL[p]}</strong>
                  <small className={ped.mudo}>
                    {n} conta{n === 1 ? '' : 's'}
                  </small>
                </div>
                <div className={ped.mudo} style={{ marginTop: '0.2rem' }}>{ehAdmin ? 'Equipe NZ: vê tudo, inclusive a tabela de varejo e o pátio, e compra pela base do ERP.' : TIPO_DESCRICAO[p as PapelPreco]}</div>
              </div>
              <div style={{ flex: '2 1 380px', fontSize: '0.85rem', lineHeight: 1.6 }}>
                <div>
                  <span className={ped.mudo}>Preço: </span>
                  {ehAdmin ? 'base do ERP (atacado), sem percentual' : resumo[p]?.preco}
                </div>
                <div>
                  <span className={ped.mudo}>Vê: </span>
                  {ehAdmin ? 'tudo' : resumo[p]?.ve}
                </div>
              </div>
              <div>
                {ehAdmin ? (
                  <span className={`${ped.chip} ${ped.neutro}`}>sem configuração</span>
                ) : (
                  <Link to={`/admin/precos/${p}`} className={`${styles.actionBtn} ${styles.actionBtnApprove}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Configurar
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className={ped.mudo} style={{ marginTop: '1.25rem' }}>
        A regra que calcula mora no servidor e é a mesma da vitrine, do carrinho e do checkout — o que a pessoa vê é o que ela paga.
      </p>
    </div>
  );
}
