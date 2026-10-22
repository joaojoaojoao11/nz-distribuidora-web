// /admin/super-cupons/regras — as regras do SUPER CUPOM em tela própria
// (pedido do João, 21/10/2026): ligado/desligado, desconto para quem compra,
// cashback para quem indicou, carência e validade do saldo. Sem imposto nem
// trava aqui: isso é conta do plano de margem, fora desta tela.

import { useCallback, useEffect, useState } from 'react';
import { lerConfigIncentivos, salvarConfigIncentivos, type ConfigIncentivos } from '../../lib/shop/incentivos';
import { Avisos, Botao, Campo, Grade, PaginaAdmin, Secao } from './comuns/Pagina';
import { campoEstilo, pctTexto } from './comuns/formato';
import ped from './AdminPedidos.module.css';

const num = (s: string | undefined) => {
  const t = (s ?? '').trim().replace(',', '.');
  return t === '' ? null : Number(t);
};

export default function AdminSuperCuponsRegras() {
  const [config, setConfig] = useState<ConfigIncentivos | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    try {
      const { config: c } = await lerConfigIncentivos();
      setConfig(c);
      setForm({
        superCupomAtivo: c.superCupomAtivo ? '1' : '',
        pctDescontoIndicado: pctTexto(c.pctDescontoIndicado),
        pctCashbackIndicador: pctTexto(c.pctCashbackIndicador),
        diasLiberacao: String(c.diasLiberacao),
        mesesValidade: String(c.mesesValidade),
        tetoMensalPremios: c.tetoMensalPremios == null ? '' : pctTexto(c.tetoMensalPremios),
      });
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = async () => {
    const patch: Partial<ConfigIncentivos> = {
      superCupomAtivo: form.superCupomAtivo === '1',
      pctDescontoIndicado: num(form.pctDescontoIndicado) ?? 0,
      pctCashbackIndicador: num(form.pctCashbackIndicador) ?? 0,
      diasLiberacao: num(form.diasLiberacao) ?? 7,
      mesesValidade: num(form.mesesValidade) ?? 12,
      tetoMensalPremios: num(form.tetoMensalPremios),
    };
    if (Object.values(patch).some((v) => typeof v === 'number' && (!Number.isFinite(v) || v < 0)) || (patch.pctDescontoIndicado ?? 0) > 100 || (patch.pctCashbackIndicador ?? 0) > 100) {
      setErro('Percentuais entre 0 e 100; dias, meses e valores maiores ou iguais a zero.');
      return;
    }
    setSalvando(true);
    setErro('');
    setMsg('');
    try {
      const r = await salvarConfigIncentivos(patch);
      setConfig(r.config);
      setMsg('Regras salvas. Valem para a próxima compra com super cupom.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  };

  if (!config && !erro) return <p className={ped.mudo}>Carregando…</p>;

  return (
    <PaginaAdmin
      titulo="Regras do super cupom"
      tutorial="admin.super-cupons-regras"
      voltar={{ para: '/admin/super-cupons', rotulo: 'Super cupons' }}
      descricao="Todo cliente aprovado tem um super cupom. Quem compra com ele ganha o desconto; quem indicou ganha cashback na carteira. Vale uma compra por indicado, só para conta nova. Valores iniciais são fictícios: ajuste depois de fazer as contas."
      acoes={
        <Botao variante="principal" disabled={salvando || !config} onClick={() => void salvar()}>
          {salvando ? 'Salvando…' : 'Salvar regras'}
        </Botao>
      }
    >
      <Avisos erro={erro} msg={msg} />
      <Secao titulo="Super cupom">
        <Grade min={200}>
          <Campo label="Programa" dica="desligado = ninguém gera nem usa super cupom">
            <select style={campoEstilo} value={form.superCupomAtivo ?? '1'} onChange={(e) => setForm((f) => ({ ...f, superCupomAtivo: e.target.value }))}>
              <option value="1">ligado</option>
              <option value="">desligado</option>
            </select>
          </Campo>
          <Campo label="Desconto para quem compra (%)">
            <input style={campoEstilo} inputMode="decimal" value={form.pctDescontoIndicado ?? ''} onChange={(e) => setForm((f) => ({ ...f, pctDescontoIndicado: e.target.value }))} />
          </Campo>
          <Campo label="Cashback para quem indicou (%)" dica="× multiplicador do nível de quem indicou">
            <input style={campoEstilo} inputMode="decimal" value={form.pctCashbackIndicador ?? ''} onChange={(e) => setForm((f) => ({ ...f, pctCashbackIndicador: e.target.value }))} />
          </Campo>
          <Campo label="Compras por indicado" dica="regra fixa do super cupom">
            <input style={{ ...campoEstilo, opacity: 0.6 }} value="1 (a primeira compra)" disabled />
          </Campo>
          <Campo label="Quem pode usar" dica="regra fixa do super cupom">
            <input style={{ ...campoEstilo, opacity: 0.6 }} value="só conta nova (sem compra paga)" disabled />
          </Campo>
        </Grade>
      </Secao>
      <Secao titulo="Carteira (vale para super cupom e afiliados)" descricao="A carência corre do faturamento no NZERP até o saldo ficar disponível. O saldo que vence volta para a NZ.">
        <Grade min={200}>
          <Campo label="Carência (dias)">
            <input style={campoEstilo} inputMode="numeric" value={form.diasLiberacao ?? ''} onChange={(e) => setForm((f) => ({ ...f, diasLiberacao: e.target.value }))} />
          </Campo>
          <Campo label="Validade do saldo (meses)">
            <input style={campoEstilo} inputMode="numeric" value={form.mesesValidade ?? ''} onChange={(e) => setForm((f) => ({ ...f, mesesValidade: e.target.value }))} />
          </Campo>
          <Campo label="Teto mensal de prêmios (R$)" dica="bônus das conquistas da gamificação">
            <input style={campoEstilo} inputMode="decimal" value={form.tetoMensalPremios ?? ''} onChange={(e) => setForm((f) => ({ ...f, tetoMensalPremios: e.target.value }))} />
          </Campo>
        </Grade>
      </Secao>
    </PaginaAdmin>
  );
}
