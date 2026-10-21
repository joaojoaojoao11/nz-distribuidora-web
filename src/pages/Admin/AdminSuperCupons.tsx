// /admin/super-cupons — a LISTA dos super cupons (Fase 2, D22): o cupom
// pessoal que todo cliente aprovado tem. As regras (desconto, cashback,
// carência, validade) ficam em tela própria (/admin/super-cupons/regras), por
// pedido do João (21/10/2026).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { rotuloTipo } from '../../lib/shop/papeis';
import { listarSuperCupons, type ConfigIncentivos } from '../../lib/shop/incentivos';
import { Avisos, Chip, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, dataBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface SuperCupom {
  codigo: string;
  dono_user_id: string | null;
  usos: number;
  ativo: boolean;
  criado_em: string;
  dono: { full_name: string | null; company_name: string | null; email: string | null; role: string } | null;
  cashbackGerado: number;
}

export default function AdminSuperCupons() {
  const [lista, setLista] = useState<SuperCupom[]>([]);
  const [config, setConfig] = useState<ConfigIncentivos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'com-uso'>('todos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listarSuperCupons();
      setLista(r.superCupons as unknown as SuperCupom[]);
      setConfig(r.config);
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
    return lista.filter((c) => {
      if (filtro === 'ativos' && !c.ativo) return false;
      if (filtro === 'com-uso' && Number(c.usos) === 0) return false;
      if (!t) return true;
      return [c.codigo, c.dono?.full_name, c.dono?.company_name, c.dono?.email].some((x) => (x ?? '').toLowerCase().includes(t));
    });
  }, [lista, busca, filtro]);

  const totalUsos = lista.reduce((s, c) => s + Number(c.usos), 0);
  const totalCashback = lista.reduce((s, c) => s + Number(c.cashbackGerado), 0);

  return (
    <PaginaAdmin
      titulo="Super cupons"
      descricao={
        <>
          Todo cliente aprovado tem o seu super cupom, criado na hora em "Indique e ganhe". Quem compra com ele ganha o <strong>desconto</strong>; quem indicou ganha <strong>cashback</strong> na carteira,
          liberado depois da carência. Vale <strong>uma compra por indicado</strong>, só para conta nova. O cliente não vê quem indicou quem; nós vemos aqui. Afiliados têm regra própria em{' '}
          <Link to="/admin/afiliados" style={{ color: '#fff' }}>Afiliados</Link>.
        </>
      }
      acoes={
        <Link to="/admin/super-cupons/regras" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
          ⚙ Regras do super cupom
        </Link>
      }
    >
      <Avisos erro={erro} />
      <Metricas
        itens={[
          { rotulo: 'Clientes com super cupom', valor: lista.filter((c) => c.ativo).length },
          { rotulo: 'Compras com super cupom', valor: totalUsos },
          { rotulo: 'Cashback gerado', valor: BRL.format(totalCashback) },
          { rotulo: 'Programa', valor: config?.superCupomAtivo ? 'ligado' : 'desligado', alerta: config ? !config.superCupomAtivo : false },
        ]}
      />
      {config && (
        <p className={ped.mudo} style={{ marginBottom: '1rem' }}>
          Regras em vigor: desconto {pctTexto(config.pctDescontoIndicado)}% para quem compra · cashback {pctTexto(config.pctCashbackIndicador)}% para quem indicou · carência {config.diasLiberacao} dias ·
          saldo vale {config.mesesValidade} meses.
        </p>
      )}

      <Secao
        titulo={`Super cupons (${filtrados.length})`}
        descricao="Um por cliente. O cliente pode trocar o código no painel; o antigo é desligado e fica aqui no histórico."
        acoes={
          <>
            <input className={ped.busca} placeholder="Buscar por código, nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
            {(['todos', 'ativos', 'com-uso'] as const).map((f) => (
              <button key={f} type="button" className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f)}>
                {f === 'todos' ? 'Todos' : f === 'ativos' ? 'Ativos' : 'Com uso'}
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
                <th>Dono</th>
                <th>Tipo de acesso</th>
                <th>Compras com o cupom</th>
                <th>Cashback gerado</th>
                <th>Criado em</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.codigo}>
                  <td>
                    <code style={{ fontWeight: 700 }}>{c.codigo}</code>
                  </td>
                  <td>
                    {c.dono?.full_name || c.dono?.email || '—'}
                    {c.dono?.company_name && <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{c.dono.company_name}</div>}
                  </td>
                  <td className={ped.mudo}>{c.dono ? rotuloTipo(c.dono.role) : '—'}</td>
                  <td>{c.usos}</td>
                  <td>{BRL.format(Number(c.cashbackGerado))}</td>
                  <td>{dataBR(c.criado_em)}</td>
                  <td>{c.ativo ? <Chip tom="ok">ativo</Chip> : <Chip tom="neutro">trocado</Chip>}</td>
                </tr>
              ))}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Ninguém gerou super cupom ainda. Ele nasce quando o cliente aprovado abre "Indique e ganhe".
                  </td>
                </tr>
              )}
              {carregando && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
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
