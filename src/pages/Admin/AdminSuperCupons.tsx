// /admin/super-cupons — a tela do SUPER CUPOM (Fase 2, D22): o cupom pessoal
// que todo cliente aprovado tem. Quem compra com ele ganha o desconto; quem
// indicou ganha cashback na carteira; vale uma compra por indicado, só para
// conta nova. Aqui ficam as regras (desconto, cashback, carência, validade do
// saldo, teto de prêmios e a trava de margem) e a lista de quem tem cupom e
// quanto gerou.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { rotuloTipo } from '../../lib/shop/papeis';
import { listarSuperCupons, salvarConfigIncentivos, type ConfigIncentivos } from '../../lib/shop/incentivos';
import { Avisos, Botao, Campo, Chip, Grade, Metricas, PaginaAdmin, Secao } from './comuns/Pagina';
import { BRL, campoEstilo, dataBR, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface SuperCupom {
  codigo: string;
  dono_user_id: string | null;
  usos: number;
  ativo: boolean;
  criado_em: string;
  desconto_pct: number | null;
  comissao_pct: number | null;
  dono: { full_name: string | null; company_name: string | null; email: string | null; role: string } | null;
  cashbackGerado: number;
}

export default function AdminSuperCupons() {
  const [lista, setLista] = useState<SuperCupom[]>([]);
  const [config, setConfig] = useState<ConfigIncentivos | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listarSuperCupons();
      setLista(r.superCupons as unknown as SuperCupom[]);
      setConfig(r.config);
      setForm({
        superCupomAtivo: r.config.superCupomAtivo ? '1' : '',
        pctDescontoIndicado: pctTexto(r.config.pctDescontoIndicado),
        pctCashbackIndicador: pctTexto(r.config.pctCashbackIndicador),
        diasLiberacao: String(r.config.diasLiberacao),
        mesesValidade: String(r.config.mesesValidade),
        tetoMensalPremios: r.config.tetoMensalPremios == null ? '' : pctTexto(r.config.tetoMensalPremios),
        travaAtiva: r.config.travaAtiva ? '1' : '',
        impostoPct: r.config.impostoPct == null ? '' : pctTexto(r.config.impostoPct),
        comissaoEmbutidaPct: r.config.comissaoEmbutidaPct == null ? '' : pctTexto(r.config.comissaoEmbutidaPct),
      });
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

  const num = (s: string) => {
    const t = (s ?? '').trim().replace(',', '.');
    return t === '' ? null : Number(t);
  };

  const salvar = async () => {
    const patch: Partial<ConfigIncentivos> = {
      superCupomAtivo: form.superCupomAtivo === '1',
      pctDescontoIndicado: num(form.pctDescontoIndicado) ?? 0,
      pctCashbackIndicador: num(form.pctCashbackIndicador) ?? 0,
      diasLiberacao: num(form.diasLiberacao) ?? 7,
      mesesValidade: num(form.mesesValidade) ?? 12,
      tetoMensalPremios: num(form.tetoMensalPremios),
      travaAtiva: form.travaAtiva === '1',
      impostoPct: num(form.impostoPct),
      comissaoEmbutidaPct: num(form.comissaoEmbutidaPct),
    };
    if (patch.travaAtiva && (patch.impostoPct == null || patch.comissaoEmbutidaPct == null)) {
      setErro('Para ligar a trava de margem, informe o imposto e a comissão embutida (confira com o Davi e a Danila).');
      return;
    }
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const r = await salvarConfigIncentivos(patch);
      setConfig(r.config);
      setMsg('Regras salvas. Valem para o próximo pedido faturado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  };

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter((c) => [c.codigo, c.dono?.full_name, c.dono?.company_name, c.dono?.email].some((x) => (x ?? '').toLowerCase().includes(t)));
  }, [lista, busca]);

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
    >
      <Avisos erro={erro} msg={msg} />
      <Metricas
        itens={[
          { rotulo: 'Clientes com super cupom', valor: lista.length },
          { rotulo: 'Compras com super cupom', valor: totalUsos },
          { rotulo: 'Cashback gerado', valor: BRL.format(totalCashback) },
          { rotulo: 'Programa', valor: config?.superCupomAtivo ? 'ligado' : 'desligado', alerta: config ? !config.superCupomAtivo : false },
        ]}
      />

      <Secao
        titulo="Regras do super cupom e da carteira"
        descricao="Valores iniciais são fictícios: ajuste depois de fazer as contas. A trava de margem só corta quando está ligada e tem imposto e comissão embutida preenchidos — confirme os dois com o Davi e a Danila antes de ligar."
        acoes={
          <Botao variante="principal" disabled={salvando || !config} onClick={() => void salvar()}>
            {salvando ? 'Salvando…' : 'Salvar regras'}
          </Botao>
        }
      >
        <Grade min={170}>
          <Campo label="Super cupom" dica="desligado = ninguém gera nem usa">
            <select style={campoEstilo} value={form.superCupomAtivo ?? '1'} onChange={(e) => setForm((f) => ({ ...f, superCupomAtivo: e.target.value }))}>
              <option value="1">ligado</option>
              <option value="">desligado</option>
            </select>
          </Campo>
          <Campo label="Desconto para quem compra (%)">
            <input style={campoEstilo} inputMode="decimal" value={form.pctDescontoIndicado ?? ''} onChange={(e) => setForm((f) => ({ ...f, pctDescontoIndicado: e.target.value }))} />
          </Campo>
          <Campo label="Cashback para quem indicou (%)" dica="× multiplicador do nível">
            <input style={campoEstilo} inputMode="decimal" value={form.pctCashbackIndicador ?? ''} onChange={(e) => setForm((f) => ({ ...f, pctCashbackIndicador: e.target.value }))} />
          </Campo>
          <Campo label="Carência (dias)" dica="do faturamento até 'disponível'">
            <input style={campoEstilo} inputMode="numeric" value={form.diasLiberacao ?? ''} onChange={(e) => setForm((f) => ({ ...f, diasLiberacao: e.target.value }))} />
          </Campo>
          <Campo label="Validade do saldo (meses)" dica="o que vence volta para a NZ">
            <input style={campoEstilo} inputMode="numeric" value={form.mesesValidade ?? ''} onChange={(e) => setForm((f) => ({ ...f, mesesValidade: e.target.value }))} />
          </Campo>
          <Campo label="Teto mensal de prêmios (R$)" dica="bônus das conquistas; vazio = sem bônus em dinheiro">
            <input style={campoEstilo} inputMode="decimal" value={form.tetoMensalPremios ?? ''} onChange={(e) => setForm((f) => ({ ...f, tetoMensalPremios: e.target.value }))} />
          </Campo>
          <Campo label="Trava de margem" dica="a venda do canal nunca rende menos que no balcão">
            <select style={campoEstilo} value={form.travaAtiva ?? ''} onChange={(e) => setForm((f) => ({ ...f, travaAtiva: e.target.value }))}>
              <option value="">desligada</option>
              <option value="1">ligada</option>
            </select>
          </Campo>
          <Campo label="Imposto (%)" dica="t da trava — confirmar com o Davi">
            <input style={campoEstilo} inputMode="decimal" value={form.impostoPct ?? ''} onChange={(e) => setForm((f) => ({ ...f, impostoPct: e.target.value }))} />
          </Campo>
          <Campo label="Comissão embutida no preço (%)" dica="k da trava — a do vendedor do balcão">
            <input style={campoEstilo} inputMode="decimal" value={form.comissaoEmbutidaPct ?? ''} onChange={(e) => setForm((f) => ({ ...f, comissaoEmbutidaPct: e.target.value }))} />
          </Campo>
        </Grade>
      </Secao>

      <Secao
        titulo={`Super cupons (${filtrados.length})`}
        descricao="Um por cliente. O cliente pode trocar o código no painel; o antigo é desligado e fica aqui no histórico."
        acoes={<input className={ped.busca} placeholder="Buscar por código, nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.codigo}>
                  <td>
                    <code>{c.codigo}</code>
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
            </tbody>
          </table>
        </div>
      </Secao>
    </PaginaAdmin>
  );
}
