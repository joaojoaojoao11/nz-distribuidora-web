// /admin/saques — os saques de cashback pedidos no site (Fase 4 mínima,
// 21/10/2026). Só leitura: o pagamento é um título no Contas a Pagar do NZERP
// e é lá que o financeiro paga, baixa ou cancela. O sync espelha a situação.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarSaques, PIX_TIPO_LABEL, STATUS_SAQUE, type Saque } from '../../lib/shop/incentivos';
import { Avisos, Chip, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, dataBR, dataHoraBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

type Filtro = 'abertos' | 'todos' | 'pagos' | 'cancelados' | 'pendentes';

export default function AdminSaques() {
  const [lista, setLista] = useState<Saque[]>([]);
  const [config, setConfig] = useState<{ saqueMinimo: number; saqueHoraCorte: string; saqueDiasVencimento: number } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('abertos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listarSaques();
      setLista(r.saques);
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

  const hoje = new Date().toISOString().slice(0, 10);
  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return lista.filter((s) => {
      if (filtro === 'abertos' && !['solicitado', 'enviado'].includes(s.status)) return false;
      if (filtro === 'pagos' && s.status !== 'pago') return false;
      if (filtro === 'cancelados' && s.status !== 'cancelado') return false;
      if (filtro === 'pendentes' && s.status !== 'solicitado') return false;
      if (!t) return true;
      return [s.cliente?.full_name, s.cliente?.company_name, s.cliente?.email, s.pix_chave, s.erp_ap_id].some((x) => (x ?? '').toLowerCase().includes(t));
    });
  }, [lista, busca, filtro]);

  const abertos = lista.filter((s) => ['solicitado', 'enviado'].includes(s.status));
  const atrasados = abertos.filter((s) => s.vencimento && s.vencimento < hoje);
  const pendentesErp = lista.filter((s) => s.status === 'solicitado');
  const pagosMes = lista.filter((s) => s.status === 'pago' && (s.pago_em ?? '').slice(0, 7) === hoje.slice(0, 7));

  return (
    <PaginaAdmin
      titulo="Saques"
      descricao={
        <>
          O cliente cadastra a chave Pix em "Indique e ganhe" e pede o saque do saldo da carteira. Cada pedido vira um <strong>título em aberto no Contas a Pagar do NZERP</strong> (fornecedor
          "CASHBACK: nome", categoria "SAQUE DE CASHBACK", forma Pix). O financeiro paga e baixa lá; aqui a situação é espelhada pelo sync. Título cancelado devolve o saldo ao cliente. Regras em{' '}
          <Link to="/admin/afiliados/regras" style={{ color: '#fff' }}>Regras gerais → Carteira</Link>.
        </>
      }
    >
      <Avisos erro={erro} />
      <Metricas
        itens={[
          { rotulo: 'Em aberto', valor: abertos.length, sub: BRL.format(abertos.reduce((s, x) => s + Number(x.valor), 0)) },
          { rotulo: 'Vencidos', valor: atrasados.length, alerta: atrasados.length > 0 },
          { rotulo: 'Não chegaram ao NZERP', valor: pendentesErp.length, sub: pendentesErp.length ? 'o sync remanda' : 'tudo enviado', alerta: pendentesErp.length > 0 },
          { rotulo: 'Pagos no mês', valor: pagosMes.length, sub: BRL.format(pagosMes.reduce((s, x) => s + Number(x.valor), 0)) },
        ]}
      />
      {config && (
        <p className={ped.mudo} style={{ marginBottom: '1rem' }}>
          Regras em vigor: saque mínimo R$ {pctTexto(config.saqueMinimo)} · hora de corte {config.saqueHoraCorte} · vence em {config.saqueDiasVencimento} dia(s) útil(eis).
        </p>
      )}

      <Secao
        titulo={`Saques (${filtrados.length})`}
        descricao="Pagamento, baixa e cancelamento acontecem no NZERP; esta lista só mostra."
        acoes={
          <>
            <input className={ped.busca} placeholder="Buscar por cliente, chave ou título" value={busca} onChange={(e) => setBusca(e.target.value)} />
            {(['abertos', 'pendentes', 'pagos', 'cancelados', 'todos'] as const).map((f) => (
              <button key={f} type="button" className={`${styles.periodBtn} ${filtro === f ? styles.periodBtnActive : ''}`} onClick={() => setFiltro(f)}>
                {f === 'abertos' ? 'Em aberto' : f === 'pendentes' ? 'Sem título' : f === 'pagos' ? 'Pagos' : f === 'cancelados' ? 'Cancelados' : 'Todos'}
              </button>
            ))}
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido em</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Pix</th>
                <th>Vence em</th>
                <th>Situação</th>
                <th>Título no NZERP</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id}>
                  <td>{dataHoraBR(s.criado_em)}</td>
                  <td>
                    {s.cliente?.full_name || s.cliente?.email || '—'}
                    {s.cliente?.company_name && <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{s.cliente.company_name}</div>}
                  </td>
                  <td style={{ fontWeight: 700 }}>{BRL.format(Number(s.valor))}</td>
                  <td>
                    <code>{s.pix_chave}</code>
                    <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{PIX_TIPO_LABEL[s.pix_tipo] ?? s.pix_tipo}</div>
                  </td>
                  <td className={s.vencimento && s.vencimento < hoje && ['solicitado', 'enviado'].includes(s.status) ? ped.erro : undefined}>{dataBR(s.vencimento)}</td>
                  <td>
                    <Chip tom={s.status === 'pago' ? 'ok' : s.status === 'cancelado' ? 'neutro' : s.status === 'solicitado' ? 'erro' : 'atencao'}>{STATUS_SAQUE[s.status]}</Chip>
                    {s.status === 'pago' && s.pago_em ? <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>em {dataBR(s.pago_em)}</div> : null}
                    {s.status === 'cancelado' && s.cancelado_motivo ? <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{s.cancelado_motivo}</div> : null}
                  </td>
                  <td>
                    {s.erp_ap_id ? <code>{s.erp_ap_id}</code> : <span className={ped.mudo}>ainda não</span>}
                    {s.erp_erro ? <div className={ped.erro} style={{ fontSize: '0.72rem', maxWidth: 260 }}>{s.erp_erro}</div> : null}
                  </td>
                </tr>
              ))}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Nenhum saque {filtro === 'todos' ? 'ainda' : 'neste filtro'}.
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
