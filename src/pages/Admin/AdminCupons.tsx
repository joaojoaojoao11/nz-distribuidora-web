// /admin/cupons — a LISTA dos cupons da NZ (Fase 2, D21). Criar e editar fica
// em tela própria (/admin/cupons/novo e /admin/cupons/:codigo), por pedido do
// João (21/10/2026): o formulário não fica em cima da lista.
//
// Campanha = qualquer cliente usa (validade e limite). Nominal = um cliente da
// base. Cupom de afiliado aparece para consulta (quem manda nele é a tela do
// afiliado); o super cupom de cada cliente tem a tela dele.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ativarCupom, listarCupons } from '../../lib/shop/incentivos';
import { Avisos, Botao, Chip, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, dataBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface Cupom {
  codigo: string;
  tipo: 'afiliado' | 'campanha' | 'nominal' | 'super';
  descricao: string | null;
  desconto_pct: number | null;
  desconto_valor: number | null;
  dono_user_id: string | null;
  afiliado_user_id: string | null;
  valido_de: string | null;
  valido_ate: string | null;
  limite_usos: number | null;
  usos: number;
  usos_por_cliente: number | null;
  so_conta_nova: boolean;
  ativo: boolean;
  criado_em: string;
  dono: { full_name: string | null; company_name: string | null; email: string | null } | null;
  afiliado: { full_name: string | null; company_name: string | null; email: string | null } | null;
  cashbackGerado: number;
}

const TIPO_ROTULO: Record<string, string> = { campanha: 'Campanha', nominal: 'Nominal', afiliado: 'Afiliado', super: 'Super cupom' };
type Filtro = 'todos' | 'campanha' | 'nominal' | 'afiliado' | 'ativos';

export default function AdminCupons() {
  const navigate = useNavigate();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listarCupons(['campanha', 'nominal', 'afiliado']);
      setCupons(r.cupons as unknown as Cupom[]);
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return cupons.filter((c) => {
      if (filtro === 'ativos' && !c.ativo) return false;
      if (filtro !== 'todos' && filtro !== 'ativos' && c.tipo !== filtro) return false;
      if (!t) return true;
      return [c.codigo, c.descricao, c.dono?.full_name, c.dono?.email, c.afiliado?.full_name, c.afiliado?.email].some((x) => (x ?? '').toLowerCase().includes(t));
    });
  }, [cupons, busca, filtro]);

  const alternar = async (c: Cupom) => {
    try {
      await ativarCupom(c.codigo, !c.ativo);
      setMsg(`Cupom ${c.codigo} ${c.ativo ? 'desligado' : 'ligado'}.`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  const descontoTexto = (c: Cupom) => (c.desconto_pct ? `${pctTexto(c.desconto_pct)}%` : c.desconto_valor ? BRL.format(Number(c.desconto_valor)) : c.tipo === 'afiliado' ? 'regra do afiliado' : '—');
  const hoje = Date.now();
  const situacao = (c: Cupom) => {
    if (!c.ativo) return { tom: 'neutro' as const, rotulo: 'desligado' };
    if (c.valido_ate && Date.parse(c.valido_ate) < hoje) return { tom: 'erro' as const, rotulo: 'vencido' };
    if (c.valido_de && Date.parse(c.valido_de) > hoje) return { tom: 'atencao' as const, rotulo: 'agendado' };
    if (c.limite_usos != null && c.usos >= c.limite_usos) return { tom: 'erro' as const, rotulo: 'esgotado' };
    return { tom: 'ok' as const, rotulo: 'ativo' };
  };

  return (
    <PaginaAdmin
      titulo="Cupons"
      tutorial="admin.cupons"
      descricao={
        <>
          Cupom de <strong>campanha</strong> (qualquer cliente usa, com validade e limite) e cupom <strong>nominal</strong> (criado para um cliente da base: só ele usa). O cupom de cada{' '}
          <Link to="/admin/afiliados" style={{ color: '#fff' }}>afiliado</Link> aparece para consulta; o <Link to="/admin/super-cupons" style={{ color: '#fff' }}>super cupom</Link> de cada cliente tem a tela
          dele. O desconto chega ao NZERP rateado por item e sai na NF. Clique numa linha para abrir o cupom.
        </>
      }
      acoes={
        <Link to="/admin/cupons/novo" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
          + Novo cupom
        </Link>
      }
    >
      <Avisos erro={erro} msg={msg} />
      <Metricas
        itens={[
          { rotulo: 'Cupons', valor: cupons.length },
          { rotulo: 'Ativos', valor: cupons.filter((c) => situacao(c).rotulo === 'ativo').length },
          { rotulo: 'Usos', valor: cupons.reduce((s, c) => s + Number(c.usos), 0) },
          { rotulo: 'Nominais', valor: cupons.filter((c) => c.tipo === 'nominal').length },
        ]}
      />

      <Secao
        titulo={`Cupons (${filtrados.length})`}
        acoes={
          <>
            <input className={ped.busca} placeholder="Buscar por código, descrição ou cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
            {(['todos', 'ativos', 'campanha', 'nominal', 'afiliado'] as Filtro[]).map((f) => (
              <button key={f} type="button" className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f)}>
                {f === 'todos' ? 'Todos' : f === 'ativos' ? 'Ativos' : TIPO_ROTULO[f]}
              </button>
            ))}
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>Para quem</th>
                <th>Validade</th>
                <th>Usos</th>
                <th>Regras</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const st = situacao(c);
                return (
                  <tr key={c.codigo} style={{ cursor: 'pointer' }} onClick={() => navigate(c.tipo === 'afiliado' ? `/admin/afiliados/${c.afiliado_user_id}` : `/admin/cupons/${c.codigo}`)}>
                    <td>
                      <code style={{ fontWeight: 700 }}>{c.codigo}</code>
                      {c.descricao && <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{c.descricao}</div>}
                    </td>
                    <td>{TIPO_ROTULO[c.tipo] ?? c.tipo}</td>
                    <td>{descontoTexto(c)}</td>
                    <td>
                      {c.tipo === 'nominal' && c.dono ? c.dono.full_name || c.dono.company_name || c.dono.email : ''}
                      {c.tipo === 'afiliado' && c.afiliado ? `afiliado ${c.afiliado.full_name || c.afiliado.company_name || c.afiliado.email}` : ''}
                      {c.tipo === 'campanha' ? <span className={ped.mudo}>todo mundo</span> : ''}
                    </td>
                    <td className={ped.mudo}>
                      {c.valido_de ? `de ${dataBR(c.valido_de)} ` : ''}
                      {c.valido_ate ? `até ${dataBR(c.valido_ate)}` : c.valido_de ? '' : 'sem prazo'}
                    </td>
                    <td>
                      {c.usos}
                      {c.limite_usos != null ? ` / ${c.limite_usos}` : ''}
                    </td>
                    <td className={ped.mudo} style={{ fontSize: '0.72rem' }}>
                      {[c.usos_por_cliente != null ? `${c.usos_por_cliente} por cliente` : null, c.so_conta_nova ? 'só conta nova' : null].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td>
                      <Chip tom={st.tom}>{st.rotulo}</Chip>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {c.tipo !== 'afiliado' ? (
                        <Botao variante={c.ativo ? 'perigo' : 'neutro'} onClick={() => void alternar(c)}>
                          {c.ativo ? 'Desligar' : 'Ligar'}
                        </Botao>
                      ) : (
                        <Link to={`/admin/afiliados/${c.afiliado_user_id}`} className={styles.actionBtn} style={{ textDecoration: 'none' }}>
                          Tela do afiliado
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    Nenhum cupom com esse filtro. Crie o primeiro em "Novo cupom".
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
      </Secao>
    </PaginaAdmin>
  );
}
