// /admin/afiliados — a tela dos AFILIADOS (Fase 2 do plano de indicação,
// 21/10/2026; D21–D28).
//
// Quem é afiliado, quantos filiados tem, quanto gerou, quanto tem na
// carteira; as regras gerais (ativação, recorrência, desconto do cupom,
// periodicidade padrão); e a porta para a tela de cada afiliado
// (/admin/afiliados/:userId), onde fica a configuração individual.
// Tudo pela rota /api/nz/incentivos (service role, com log).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rotuloTipo } from '../../lib/shop/papeis';
import { listarAfiliados, salvarAfiliado, type AfiliadoLista, type ConfigIncentivos } from '../../lib/shop/incentivos';
import { Avisos, Botao, Chip, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, dataBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

const STATUS: Record<string, { rotulo: string; tom: 'ok' | 'atencao' | 'erro' }> = {
  aprovado: { rotulo: 'Aprovado', tom: 'ok' },
  pendente: { rotulo: 'Aguardando aprovação', tom: 'atencao' },
  suspenso: { rotulo: 'Suspenso', tom: 'erro' },
};

type Filtro = 'todos' | 'pendentes' | 'aprovados' | 'suspensos';

export default function AdminAfiliados() {
  const navigate = useNavigate();
  const [lista, setLista] = useState<AfiliadoLista[]>([]);
  const [config, setConfig] = useState<ConfigIncentivos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState('');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listarAfiliados();
      setLista(r.afiliados);
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
    return lista.filter((a) => {
      if (filtro === 'pendentes' && a.status !== 'pendente') return false;
      if (filtro === 'aprovados' && a.status !== 'aprovado') return false;
      if (filtro === 'suspensos' && a.status !== 'suspenso') return false;
      if (!t) return true;
      return [a.nome, a.empresa, a.email, a.codigo].some((x) => (x ?? '').toLowerCase().includes(t));
    });
  }, [lista, busca, filtro]);

  const mudarStatus = async (a: AfiliadoLista, status: 'aprovado' | 'suspenso' | 'pendente') => {
    setOcupado(a.user_id);
    setErro('');
    try {
      await salvarAfiliado({ userId: a.user_id, status });
      setMsg(`${a.nome || a.email}: ${STATUS[status].rotulo.toLowerCase()}.`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado('');
    }
  };

  const pendentes = lista.filter((a) => a.status === 'pendente').length;
  const aprovados = lista.filter((a) => a.status === 'aprovado').length;
  const saldoTotal = lista.reduce((s, a) => s + a.saldoDisponivel, 0);
  const aLiberar = lista.reduce((s, a) => s + a.saldoALiberar, 0);
  const comissaoMes = lista.reduce((s, a) => s + a.comissaoMes, 0);

  return (
    <PaginaAdmin
      titulo="Afiliados"
      tutorial="admin.afiliados"
      descricao={
        <>
          O afiliado tem um cupom permanente: quem se cadastra ou compra com ele fica <strong>filiado</strong> a ele para sempre. Ele ganha a comissão de <strong>ativação</strong> na primeira compra
          faturada de cada filiado e a de <strong>recorrência</strong> nas seguintes, fechada por mês ou quinzena. O afiliado vê só o próprio saldo; nós vemos tudo. Clique no nome para a configuração
          individual. Cupons de campanha e nominais ficam em <Link to="/admin/cupons" style={{ color: '#fff' }}>Cupons</Link>; o cupom de cada cliente, em{' '}
          <Link to="/admin/super-cupons" style={{ color: '#fff' }}>Super cupons</Link>.
        </>
      }
      acoes={
        <Link to="/admin/afiliados/regras" className={`${styles.actionBtn} ${styles.actionBtnApprove}`} style={{ textDecoration: 'none', display: 'inline-block' }}>
          ⚙ Regras gerais
        </Link>
      }
    >
      <Avisos erro={erro} msg={msg} />
      <Metricas
        itens={[
          { rotulo: 'Afiliados aprovados', valor: aprovados },
          { rotulo: 'Aguardando aprovação', valor: pendentes, alerta: pendentes > 0 },
          { rotulo: 'Saldo a pagar (disponível)', valor: BRL.format(saldoTotal) },
          { rotulo: 'A liberar', valor: BRL.format(aLiberar) },
          { rotulo: 'Comissões no mês', valor: BRL.format(comissaoMes) },
        ]}
      />
      {config && (
        <p className={ped.mudo} style={{ marginBottom: '1rem' }}>
          Regras gerais em vigor: ativação {pctTexto(config.pctAtivacaoAfiliado)}% · recorrência {pctTexto(config.pctRecorrenciaAfiliado)}% ({config.periodicidadePadrao}) · desconto do cupom{' '}
          {pctTexto(config.descontoCupomAfiliadoPct)}% · carência {config.diasLiberacao} dias · saldo vale {config.mesesValidade} meses.
        </p>
      )}

      <Secao
        titulo={`Afiliados (${filtrados.length})`}
        descricao="Clique no nome para abrir a tela do afiliado: percentuais individuais, periodicidade, carteira, filiados e ajustes."
        acoes={
          <>
            <input className={ped.busca} placeholder="Buscar por nome, empresa, e-mail ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
            {(['todos', 'pendentes', 'aprovados', 'suspensos'] as Filtro[]).map((f) => (
              <button key={f} type="button" className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f)}>
                {f === 'todos' ? 'Todos' : f === 'pendentes' ? 'Pendentes' : f === 'aprovados' ? 'Aprovados' : 'Suspensos'}
              </button>
            ))}
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Afiliado</th>
                <th>Código</th>
                <th>Status</th>
                <th>Filiados</th>
                <th>Compraram</th>
                <th>Ativação</th>
                <th>Recorrência</th>
                <th>Período</th>
                <th>Carteira</th>
                <th>Comissões</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => {
                const st = STATUS[a.status] ?? STATUS.pendente;
                return (
                  <tr key={a.user_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/afiliados/${a.user_id}`)}>
                    <td>
                      <Link to={`/admin/afiliados/${a.user_id}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }} onClick={(e) => e.stopPropagation()}>
                        {a.nome || a.email || a.user_id.slice(0, 8)}
                      </Link>
                      <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>
                        {a.empresa ? `${a.empresa} · ` : ''}
                        {a.tipo ? rotuloTipo(a.tipo) : ''} · desde {dataBR(a.criado_em)}
                      </div>
                    </td>
                    <td>
                      <code>{a.codigo}</code>
                    </td>
                    <td>
                      <Chip tom={st.tom}>{st.rotulo}</Chip>
                      {!a.ativo && (
                        <>
                          {' '}
                          <Chip tom="neutro">inativo</Chip>
                        </>
                      )}
                    </td>
                    <td>
                      {a.filiados}
                      <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{a.filiadosAprovados} aprovados</div>
                    </td>
                    <td>{a.compraram}</td>
                    <td>{a.pct_ativacao != null ? `${pctTexto(a.pct_ativacao)}%` : <span className={ped.mudo}>geral {pctTexto(config?.pctAtivacaoAfiliado)}%</span>}</td>
                    <td>{a.pct_recorrencia != null ? `${pctTexto(a.pct_recorrencia)}%` : <span className={ped.mudo}>geral {pctTexto(config?.pctRecorrenciaAfiliado)}%</span>}</td>
                    <td>{a.periodicidade}</td>
                    <td>
                      {BRL.format(a.saldoDisponivel)}
                      {a.saldoALiberar > 0 && <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>+ {BRL.format(a.saldoALiberar)} a liberar</div>}
                    </td>
                    <td>
                      {BRL.format(a.comissaoTotal)}
                      <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>mês: {BRL.format(a.comissaoMes)}</div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {a.status === 'pendente' && (
                        <Botao variante="principal" disabled={ocupado === a.user_id} onClick={() => void mudarStatus(a, 'aprovado')}>
                          ✅ Aprovar
                        </Botao>
                      )}
                      {a.status === 'aprovado' && (
                        <Botao variante="perigo" disabled={ocupado === a.user_id} onClick={() => void mudarStatus(a, 'suspenso')}>
                          Suspender
                        </Botao>
                      )}
                      {a.status === 'suspenso' && (
                        <Botao disabled={ocupado === a.user_id} onClick={() => void mudarStatus(a, 'aprovado')}>
                          Reativar
                        </Botao>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={11} className={styles.emptyState}>
                    Nenhum afiliado com esse filtro. O pedido de adesão nasce em "Indique e ganhe", no painel do cliente.
                  </td>
                </tr>
              )}
              {carregando && (
                <tr>
                  <td colSpan={11} className={styles.emptyState}>
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
