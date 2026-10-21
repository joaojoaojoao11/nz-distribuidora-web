// /admin/afiliados/:userId — a tela de UM afiliado (configuração individual,
// D21/D24/D25/D28): status, percentuais próprios (vazio = regra geral),
// periodicidade, desconto do cupom, carteira com extrato e ajuste manual, e a
// lista dos filiados com o que compraram. O afiliado, no site, não vê nada
// disso além do próprio saldo (D26).

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { rotuloTipo } from '../../lib/shop/papeis';
import { ajustarCarteira, salvarAfiliado, verAfiliado, type ConfigIncentivos, type Saldo } from '../../lib/shop/incentivos';
import { Avisos, Botao, Campo, Chip, Grade, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, campoEstilo, dataBR, dataHoraBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface Afiliado {
  user_id: string;
  codigo: string;
  status: 'pendente' | 'aprovado' | 'suspenso';
  ativo: boolean;
  percentual: number | null;
  pct_ativacao: number | null;
  pct_recorrencia: number | null;
  desconto_cupom_pct: number | null;
  periodicidade: 'mensal' | 'quinzenal';
  criado_em: string;
  aprovado_em: string | null;
  aceite_termos_em: string | null;
  obs_admin: string | null;
}

interface Perfil {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  cpf_cnpj: string | null;
  is_approved: boolean;
  created_at: string;
}

interface Movimento {
  id: number;
  tipo: string;
  valor: number;
  status: string;
  libera_em: string | null;
  criado_em: string;
  origem_user_id: string | null;
  periodo: string | null;
  percentual_aplicado: number | null;
  base_valor: number | null;
  obs: string | null;
  pedido_id: string | null;
}

interface Filiado {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  is_approved: boolean;
  filiado_em: string | null;
  created_at: string;
  pedidos: number;
  pedidosFaturados: number;
  totalComprado: number;
  ultimaCompra: string | null;
}

const ROTULO: Record<string, string> = {
  cashback_indicacao: 'Cashback (super cupom)',
  comissao_ativacao: 'Comissão de ativação',
  comissao_recorrencia: 'Comissão de recorrência',
  bonus_meta: 'Bônus de meta',
  bonus_campanha: 'Bônus de campanha',
  resgate_pontos: 'Resgate de pontos',
  uso_compra: 'Usado em compra',
  saque: 'Saque',
  estorno: 'Estorno',
  expiracao: 'Expirado',
  ajuste: 'Ajuste da NZ',
};

export default function AdminAfiliadoDetalhe() {
  const { userId = '' } = useParams();
  const [af, setAf] = useState<Afiliado | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [extrato, setExtrato] = useState<Movimento[]>([]);
  const [filiados, setFiliados] = useState<Filiado[]>([]);
  const [config, setConfig] = useState<ConfigIncentivos | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [ajuste, setAjuste] = useState({ valor: '', obs: '' });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const r = (await verAfiliado(userId)) as { afiliado: Afiliado; perfil: Perfil | null; saldo: Saldo; extrato: Movimento[]; filiados: Filiado[]; config: ConfigIncentivos };
      setAf(r.afiliado);
      setPerfil(r.perfil);
      setSaldo(r.saldo);
      setExtrato(r.extrato);
      setFiliados(r.filiados);
      setConfig(r.config);
      setForm({
        status: r.afiliado.status,
        ativo: r.afiliado.ativo ? '1' : '',
        pct_ativacao: pctTexto(r.afiliado.pct_ativacao),
        pct_recorrencia: pctTexto(r.afiliado.pct_recorrencia),
        desconto_cupom_pct: pctTexto(r.afiliado.desconto_cupom_pct),
        periodicidade: r.afiliado.periodicidade,
        obs_admin: r.afiliado.obs_admin ?? '',
      });
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const num = (s: string) => {
    const t = (s ?? '').trim().replace(',', '.');
    return t === '' ? null : Number(t);
  };

  const salvar = async () => {
    const dados = {
      userId,
      status: form.status,
      ativo: form.ativo === '1',
      pct_ativacao: num(form.pct_ativacao),
      pct_recorrencia: num(form.pct_recorrencia),
      desconto_cupom_pct: num(form.desconto_cupom_pct),
      periodicidade: form.periodicidade,
      obs_admin: form.obs_admin,
    };
    for (const k of ['pct_ativacao', 'pct_recorrencia', 'desconto_cupom_pct'] as const) {
      const v = dados[k];
      if (v != null && (!Number.isFinite(v) || v < 0 || v > 100)) {
        setErro('Percentual precisa estar entre 0 e 100 (ou vazio para usar a regra geral).');
        return;
      }
    }
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      await salvarAfiliado(dados);
      setMsg('Afiliado salvo.');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  };

  const fazerAjuste = async () => {
    const v = num(ajuste.valor);
    if (v == null || !Number.isFinite(v) || v === 0 || !ajuste.obs.trim()) {
      setErro('Informe o valor (positivo credita, negativo debita) e o motivo do ajuste.');
      return;
    }
    if (!window.confirm(`${v > 0 ? 'Creditar' : 'Debitar'} ${BRL.format(Math.abs(v))} na carteira de ${perfil?.full_name || perfil?.email}? Fica no extrato e no log da equipe.`)) return;
    setSalvando(true);
    setErro('');
    try {
      await ajustarCarteira(userId, v, ajuste.obs.trim());
      setAjuste({ valor: '', obs: '' });
      setMsg('Ajuste lançado.');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  };

  const nomeFiliado = (id: string | null) => {
    if (!id) return '—';
    const f = filiados.find((x) => x.id === id);
    return f ? f.full_name || f.company_name || f.email || id.slice(0, 8) : id.slice(0, 8);
  };

  if (carregando && !af) return <p className={ped.mudo}>Carregando…</p>;
  if (!af) {
    return (
      <PaginaAdmin titulo="Afiliado" voltar={{ para: '/admin/afiliados', rotulo: 'Afiliados' }}>
        <Avisos erro={erro || 'Afiliado não encontrado.'} />
      </PaginaAdmin>
    );
  }
  const st = af.status === 'aprovado' ? { r: 'Aprovado', t: 'ok' as const } : af.status === 'suspenso' ? { r: 'Suspenso', t: 'erro' as const } : { r: 'Aguardando aprovação', t: 'atencao' as const };

  return (
    <PaginaAdmin
      titulo={perfil?.full_name || perfil?.email || af.codigo}
      voltar={{ para: '/admin/afiliados', rotulo: 'Afiliados' }}
      descricao={
        <>
          {perfil?.company_name ? `${perfil.company_name} · ` : ''}
          {perfil ? `${rotuloTipo(perfil.role)} · ` : ''}
          {perfil?.email} {perfil?.phone ? `· ${perfil.phone}` : ''} · cupom <code>{af.codigo}</code> · afiliado desde {dataBR(af.criado_em)}
          {af.aprovado_em ? ` · aprovado em ${dataBR(af.aprovado_em)}` : ''}
        </>
      }
      acoes={<Chip tom={st.t}>{st.r}</Chip>}
    >
      <Avisos erro={erro} msg={msg} />
      <Metricas
        itens={[
          { rotulo: 'Disponível na carteira', valor: BRL.format(saldo?.disponivel ?? 0) },
          { rotulo: 'A liberar', valor: BRL.format(saldo?.aLiberar ?? 0) },
          { rotulo: 'Filiados', valor: filiados.length, sub: `${filiados.filter((f) => f.is_approved).length} aprovados` },
          { rotulo: 'Filiados que compraram', valor: filiados.filter((f) => f.pedidosFaturados > 0).length },
          { rotulo: 'Total comprado pelos filiados', valor: BRL.format(filiados.reduce((s, f) => s + f.totalComprado, 0)) },
        ]}
      />

      <Secao
        titulo="Configuração individual"
        descricao={`Vazio = regra geral (ativação ${pctTexto(config?.pctAtivacaoAfiliado)}%, recorrência ${pctTexto(config?.pctRecorrenciaAfiliado)}%, desconto do cupom ${pctTexto(config?.descontoCupomAfiliadoPct)}%). O que for preenchido aqui vale só para este afiliado.`}
        acoes={
          <Botao variante="principal" disabled={salvando} onClick={() => void salvar()}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        }
      >
        <Grade min={170}>
          <Campo label="Status">
            <select style={campoEstilo} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="pendente">aguardando aprovação</option>
              <option value="aprovado">aprovado</option>
              <option value="suspenso">suspenso</option>
            </select>
          </Campo>
          <Campo label="Cupom ativo" dica="desligado = o cupom não entra em pedido">
            <select style={campoEstilo} value={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.value }))}>
              <option value="1">sim</option>
              <option value="">não</option>
            </select>
          </Campo>
          <Campo label="Ativação (%)" dica="1ª compra faturada do filiado">
            <input style={campoEstilo} inputMode="decimal" placeholder={`geral ${pctTexto(config?.pctAtivacaoAfiliado)}`} value={form.pct_ativacao ?? ''} onChange={(e) => setForm((f) => ({ ...f, pct_ativacao: e.target.value }))} />
          </Campo>
          <Campo label="Recorrência (%)" dica="compras seguintes, por período">
            <input style={campoEstilo} inputMode="decimal" placeholder={`geral ${pctTexto(config?.pctRecorrenciaAfiliado)}`} value={form.pct_recorrencia ?? ''} onChange={(e) => setForm((f) => ({ ...f, pct_recorrencia: e.target.value }))} />
          </Campo>
          <Campo label="Desconto do cupom (%)" dica="o que o filiado ganha ao usar o cupom">
            <input style={campoEstilo} inputMode="decimal" placeholder={`geral ${pctTexto(config?.descontoCupomAfiliadoPct)}`} value={form.desconto_cupom_pct ?? ''} onChange={(e) => setForm((f) => ({ ...f, desconto_cupom_pct: e.target.value }))} />
          </Campo>
          <Campo label="Periodicidade da recorrência" dica="o afiliado também escolhe no painel dele">
            <select style={campoEstilo} value={form.periodicidade} onChange={(e) => setForm((f) => ({ ...f, periodicidade: e.target.value }))}>
              <option value="mensal">mensal</option>
              <option value="quinzenal">quinzenal</option>
            </select>
          </Campo>
          <Campo label="Observações da NZ (só a equipe vê)">
            <input style={campoEstilo} value={form.obs_admin ?? ''} onChange={(e) => setForm((f) => ({ ...f, obs_admin: e.target.value }))} />
          </Campo>
        </Grade>
      </Secao>

      <Secao titulo="Carteira" descricao="O extrato completo, com o filiado que gerou cada comissão (o afiliado vê só 'indicado nº N'). Ajuste manual para acerto, sempre com motivo.">
        <div style={{ maxWidth: 760, marginBottom: '1rem' }}>
          <Grade min={160}>
            <Campo label="Ajuste (R$)" dica="positivo credita, negativo debita">
              <input style={campoEstilo} inputMode="decimal" value={ajuste.valor} onChange={(e) => setAjuste((a) => ({ ...a, valor: e.target.value }))} />
            </Campo>
            <Campo label="Motivo" dica="fica no extrato e no log da equipe" colunas={2}>
              <input style={campoEstilo} value={ajuste.obs} onChange={(e) => setAjuste((a) => ({ ...a, obs: e.target.value }))} />
            </Campo>
            <Campo>
              <Botao disabled={salvando} onClick={() => void fazerAjuste()}>
                Lançar ajuste
              </Botao>
            </Campo>
          </Grade>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quando</th>
                <th>O quê</th>
                <th>Filiado</th>
                <th>Base</th>
                <th>%</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Libera em</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {extrato.map((m) => (
                <tr key={m.id}>
                  <td>{dataHoraBR(m.criado_em)}</td>
                  <td>
                    {ROTULO[m.tipo] ?? m.tipo}
                    {m.periodo ? <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{m.periodo}</div> : null}
                  </td>
                  <td>{nomeFiliado(m.origem_user_id)}</td>
                  <td>{m.base_valor != null ? BRL.format(Number(m.base_valor)) : '—'}</td>
                  <td>{m.percentual_aplicado != null ? `${pctTexto(m.percentual_aplicado)}%` : '—'}</td>
                  <td style={{ color: Number(m.valor) < 0 ? '#f87171' : '#4ade80', fontWeight: 700 }}>{BRL.format(Number(m.valor))}</td>
                  <td>
                    <Chip tom={m.status === 'disponivel' ? 'ok' : m.status === 'a_liberar' ? 'atencao' : 'neutro'}>{m.status.replace('_', ' ')}</Chip>
                  </td>
                  <td>{m.libera_em ? dataBR(m.libera_em) : '—'}</td>
                  <td className={ped.mudo} style={{ fontSize: '0.72rem', maxWidth: 260 }}>
                    {m.obs ?? ''}
                  </td>
                </tr>
              ))}
              {extrato.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    Nenhum movimento ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao titulo={`Filiados (${filiados.length})`} descricao="Quem se cadastrou ou comprou com o cupom deste afiliado. Permanente: um afiliado por cliente, o primeiro.">
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Cadastro</th>
                <th>Filiado em</th>
                <th>Pedidos</th>
                <th>Faturados</th>
                <th>Total comprado</th>
                <th>Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {filiados.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.full_name || f.email || f.id.slice(0, 8)}
                    {f.company_name && <div className={ped.mudo} style={{ fontSize: '0.72rem' }}>{f.company_name}</div>}
                  </td>
                  <td>{f.is_approved ? <Chip tom="ok">aprovado</Chip> : <Chip tom="atencao">pendente</Chip>}</td>
                  <td>{dataBR(f.filiado_em ?? f.created_at)}</td>
                  <td>{f.pedidos}</td>
                  <td>{f.pedidosFaturados}</td>
                  <td>{BRL.format(f.totalComprado)}</td>
                  <td>{dataBR(f.ultimaCompra)}</td>
                </tr>
              ))}
              {filiados.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Nenhum filiado ainda.
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
